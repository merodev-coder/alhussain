/**
 * DatabaseRouter — isolated multi-cluster routing.
 *
 * HOW FAILOVER TRIGGERS (creates)
 * --------------------------------
 * 1. createWithFailover() uses round-robin to pick a database, then tries it.
 * 2. If the write throws an Atlas/storage-quota error (MongoDB error code 8000,
 *    codeName 'AtlasError', or message contains "over your space quota"), it logs
 *    a warning and retries on the next database in round-robin order.
 * 3. Non-quota errors (validation, duplicate key, network) are NOT retried —
 *    they bubble up immediately so we don't silently write to the wrong cluster.
 * 4. The saved document's `dbIndex` is the connection index that succeeded.
 *
 * HOW ROUND-ROBIN WORKS
 * ---------------------
 * - Simple counter increments synchronously before any async operations
 * - This prevents race conditions where concurrent requests could pick same db
 * - When a storage-quota error occurs, the write continues to the next database
 * - The counter only advances on successful writes, not on retries
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

// Round-robin counter for write distribution
let currentDbIndex = 0

export function isStorageFullError(error: unknown): boolean {
  // Primary check: MongoDB Atlas error code 8000 (space quota exceeded)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { code?: number; codeName?: string; message?: string }
    if (errorObj.code === 8000 || errorObj.codeName === 'AtlasError') {
      return true
    }
  }

  // Secondary fallback: message text check (in case driver wraps error differently)
  if (error instanceof Error && error.message) {
    return error.message.toLowerCase().includes('over your space quota')
  }

  return false
}

function logFullError(error: unknown, context: string): void {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { code?: number; codeName?: string; message?: string; name?: string }
    logError(
      context,
      `Error details - code: ${errorObj.code}, codeName: ${errorObj.codeName}, name: ${errorObj.name}, message: ${errorObj.message}`
    )
  } else {
    logError(context, `Error details (non-object): ${String(error)}`)
  }
}

export class DatabaseRouter {
  /**
   * Create: round-robin distribution with storage-quota failover.
   * `modelCreator` receives the connection AND the index so the caller can stamp dbIndex.
   */
  static async createWithFailover<T>(
    modelCreator: (connection: mongoose.Connection, dbIndex: number) => Promise<T>,
    recordType: string
  ): Promise<{ result: T; dbIndex: number }> {
    const connectionCount = getConnectionCount()

    // Pick starting database using round-robin (synchronous increment before async operations)
    const startDbIndex = currentDbIndex
    currentDbIndex = (currentDbIndex + 1) % connectionCount

    // Try the chosen database first, then failover on storage-full errors
    for (let attempt = 0; attempt < connectionCount; attempt++) {
      const dbIndex = (startDbIndex + attempt) % connectionCount

      try {
        const connection = getConnection(dbIndex)
        logInfo('DatabaseRouter', `Attempting ${recordType} creation on database index ${dbIndex}`)
        const result = await modelCreator(connection, dbIndex)
        logInfo('DatabaseRouter', `Created ${recordType} on database index ${dbIndex}`)
        return { result, dbIndex }
      } catch (error) {
        logFullError(error, `DatabaseRouter write attempt ${dbIndex} for ${recordType}`)
        if (isStorageFullError(error) && attempt < connectionCount - 1) {
          logWarn(
            'DatabaseRouter',
            `Database index ${dbIndex} storage full (code 8000/AtlasError detected), trying next database for ${recordType}`
          )
          continue
        }
        logError('DatabaseRouter', `Failed to create ${recordType} on database ${dbIndex}: ${error}`)
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
      logFullError(error, `DatabaseRouter update on database ${dbIndex} for ${recordType}`)
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

  /**
   * Get database status for debugging - checks connection health and counts
   */
  static async getDatabaseStatus(): Promise<
    Array<{
      index: number
      alive: boolean
      collections: Record<string, number>
    }>
  > {
    const connections = getAllConnections()
    const status = []

    for (let i = 0; i < connections.length; i++) {
      try {
        const connection = connections[i]
        const collections = ['products', 'orders', 'addons', 'accessories', 'specOptions', 'pricelists', 'shippingRates', 'inventoryLogs']
        const counts: Record<string, number> = {}

        for (const collection of collections) {
          try {
            const count = await connection.collection(collection).countDocuments()
            counts[collection] = count
          } catch {
            counts[collection] = 0
          }
        }

        status.push({
          index: i,
          alive: connection.readyState === 1, // 1 = connected
          collections: counts,
        })
      } catch (error) {
        status.push({
          index: i,
          alive: false,
          collections: {},
        })
      }
    }

    return status
  }

  /**
   * Get current round-robin index for debugging
   */
  static getCurrentRoundRobinIndex(): number {
    return currentDbIndex
  }
}
