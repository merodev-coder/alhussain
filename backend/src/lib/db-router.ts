/**
 * DatabaseRouter — isolated multi-cluster routing.
 *
 * HOW FAILOVER TRIGGERS (creates)
 * --------------------------------
 * 1. createWithFailover() tries connection 0 (MONGODB_URI).
 * 2. If the write throws an Atlas/storage-quota error (message contains
 *    quota / storage / disk / "exceeded"), it logs a warning and retries
 *    on connection 1 (MONGODB_URI_2), then 2, etc.
 * 3. Non-quota errors (validation, duplicate key, network) are NOT retried —
 *    they bubble up immediately so we don't silently write to the wrong cluster.
 * 4. The saved document's `dbIndex` is the connection index that succeeded
 *    (0 = primary).
 *
 * HOW READS WORK
 * --------------
 * readAcrossAllDatabases() runs the same query on every live connection in
 * parallel (Promise.all) and concatenates results. Data may be split after
 * a failover, so list endpoints must always merge.
 *
 * HOW UPDATES / DELETES WORK
 * --------------------------
 * Prefer the document's stored dbIndex. If the client doesn't send it (legacy
 * records), findByIdAcrossDatabases() walks connections until the _id matches.
 *
 * HOW TO VERIFY
 * -------------
 * - Happy path: one URI — everything lives on dbIndex 0.
 * - Failover: point MONGODB_URI at a full/tiny Atlas free cluster (or a user
 *   without write storage) and MONGODB_URI_2 at a working cluster, then create
 *   a product. Logs should say "storage full, trying next" then "created on
 *   database 2". The new record's dbIndex should be 1.
 * - Reads: create one product on each cluster; GET /api/products should list both.
 *
 * MongoDB transactions across TWO Atlas clusters are not possible. Inventory
 * decrements therefore run sequentially per item (see inventory.ts).
 */
import mongoose from 'mongoose'
import { getConnection, getAllConnections, getConnectionCount } from './db.js'
import { logError, logInfo, logWarn } from './logger.js'

const STORAGE_FULL_PATTERNS = [
  'storage quota exceeded',
  'quotaexceeded',
  'storage limit',
  'disk space',
  'atlas.*quota',
  'you have exceeded',
  'quota',
]

export function isStorageFullError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message} ${JSON.stringify((error as { code?: unknown }).code ?? '')}`
      : String(error)
  const lower = message.toLowerCase()
  return STORAGE_FULL_PATTERNS.some(pattern => new RegExp(pattern, 'i').test(lower))
}

export class DatabaseRouter {
  /**
   * Create: try primary, then numbered fallbacks, only on storage-full errors.
   * `modelCreator` receives the connection AND the index so the caller can stamp dbIndex.
   */
  static async createWithFailover<T>(
    modelCreator: (connection: mongoose.Connection, dbIndex: number) => Promise<T>,
    recordType: string
  ): Promise<{ result: T; dbIndex: number }> {
    const connectionCount = getConnectionCount()

    for (let i = 0; i < connectionCount; i++) {
      try {
        const connection = getConnection(i)
        logInfo('DatabaseRouter', `Attempting ${recordType} creation on database index ${i}`)
        const result = await modelCreator(connection, i)
        logInfo('DatabaseRouter', `Created ${recordType} on database index ${i}`)
        return { result, dbIndex: i }
      } catch (error) {
        if (isStorageFullError(error) && i < connectionCount - 1) {
          logWarn(
            'DatabaseRouter',
            `Database index ${i} storage full, trying next database for ${recordType}`
          )
          continue
        }
        logError('DatabaseRouter', `Failed to create ${recordType} on database ${i}: ${error}`)
        throw error
      }
    }

    throw new Error(`Failed to create ${recordType} on any database (all may be full)`)
  }

  static async readAcrossAllDatabases<T>(
    modelReader: (connection: mongoose.Connection, dbIndex: number) => Promise<T[]>,
    recordType: string
  ): Promise<T[]> {
    const connections = getAllConnections()
    logInfo('DatabaseRouter', `Reading ${recordType} across ${connections.length} database(s)`)

    const resultsArrays = await Promise.all(
      connections.map(async (connection, index) => {
        try {
          const results = await modelReader(connection, index)
          logInfo('DatabaseRouter', `Found ${results.length} ${recordType} in database index ${index}`)
          return results
        } catch (error) {
          logError('DatabaseRouter', `Failed to read ${recordType} from database ${index}: ${error}`)
          return [] as T[]
        }
      })
    )

    const allResults = resultsArrays.flat()
    logInfo('DatabaseRouter', `Total ${recordType} across all databases: ${allResults.length}`)
    return allResults
  }

  static async updateOnDatabase<T>(
    dbIndex: number,
    modelUpdater: (connection: mongoose.Connection) => Promise<T>,
    recordType: string
  ): Promise<T> {
    try {
      const connection = getConnection(dbIndex)
      logInfo('DatabaseRouter', `Updating ${recordType} on database index ${dbIndex}`)
      return await modelUpdater(connection)
    } catch (error) {
      logError('DatabaseRouter', `Failed to update ${recordType} on database ${dbIndex}: ${error}`)
      throw error
    }
  }

  static async deleteFromDatabase<T>(
    dbIndex: number,
    modelDeleter: (connection: mongoose.Connection) => Promise<T>,
    recordType: string
  ): Promise<T> {
    try {
      const connection = getConnection(dbIndex)
      logInfo('DatabaseRouter', `Deleting ${recordType} from database index ${dbIndex}`)
      return await modelDeleter(connection)
    } catch (error) {
      logError('DatabaseRouter', `Failed to delete ${recordType} from database ${dbIndex}: ${error}`)
      throw error
    }
  }

  static async findByIdAcrossDatabases<T>(
    id: string,
    modelFinder: (connection: mongoose.Connection, id: string) => Promise<T | null>,
    recordType: string
  ): Promise<{ result: T; dbIndex: number } | null> {
    const connections = getAllConnections()

    for (let i = 0; i < connections.length; i++) {
      try {
        const result = await modelFinder(connections[i], id)
        if (result) {
          logInfo('DatabaseRouter', `Found ${recordType} ${id} in database index ${i}`)
          return { result, dbIndex: i }
        }
      } catch (error) {
        logError('DatabaseRouter', `Error searching ${recordType} ${id} in database ${i}: ${error}`)
      }
    }

    logWarn('DatabaseRouter', `${recordType} ${id} not found in any database`)
    return null
  }
}
