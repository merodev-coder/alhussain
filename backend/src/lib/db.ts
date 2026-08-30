/**
 * Multi-database connection pool.
 *
 * Env pattern (detected dynamically — no hardcoded max):
 *   MONGODB_URI       → connection index 0 (primary)
 *   MONGODB_URI_2     → connection index 1
 *   MONGODB_URI_3     → connection index 2
 *   MONGODB_URI_N     → connection index N-1  (any /^MONGODB_URI_\d+$/)
 *
 * Uses mongoose.createConnection() so several clusters can stay open at once.
 * See db-router.ts for create failover / read-merge / update-by-dbIndex.
 */
import mongoose from 'mongoose'
import { logError, logInfo } from './logger.js'

interface DatabaseConnection {
  index: number
  uri: string
  connection: mongoose.Connection
}

const connections: DatabaseConnection[] = []

export function getMongoURIs(): string[] {
  const numbered: { n: number; uri: string }[] = []

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue
    const match = key.match(/^MONGODB_URI_(\d+)$/)
    if (match) {
      numbered.push({ n: parseInt(match[1], 10), uri: value })
    }
  }

  numbered.sort((a, b) => a.n - b.n)

  const uris: string[] = []
  if (process.env.MONGODB_URI) {
    uris.push(process.env.MONGODB_URI)
  }
  for (const entry of numbered) {
    if (entry.uri !== process.env.MONGODB_URI) {
      uris.push(entry.uri)
    }
  }
  return uris
}

export async function connectDB(): Promise<void> {
  if (connections.length > 0) {
    logInfo('Database', 'Already connected to databases')
    return
  }

  const uris = getMongoURIs()

  if (uris.length === 0) {
    throw new Error(
      'No MongoDB URIs found. Set MONGODB_URI and optionally MONGODB_URI_2, MONGODB_URI_3, …'
    )
  }

  logInfo('Database', `Found ${uris.length} MongoDB URI(s)`)

  for (let i = 0; i < uris.length; i++) {
    try {
      const connection = mongoose.createConnection(uris[i], {
        bufferCommands: false,
      })
      await connection.asPromise()
      connections.push({ index: i, uri: uris[i], connection })
      logInfo('Database', `Connected to MongoDB database ${i} (1-based slot ${i + 1})`)
    } catch (error) {
      logError('Database connection', `Failed to connect to database ${i}: ${error}`)
    }
  }

  if (connections.length === 0) {
    throw new Error('Failed to connect to any MongoDB database')
  }

  logInfo('Database', `Successfully connected to ${connections.length} database(s)`)
}

export function getConnection(index: number): mongoose.Connection {
  const db = connections.find(c => c.index === index)
  if (!db) {
    throw new Error(`Database connection with index ${index} not found`)
  }
  return db.connection
}

export function getPrimaryConnection(): mongoose.Connection {
  if (connections.length === 0) {
    throw new Error('No database connections available')
  }
  return connections[0].connection
}

export function getAllConnections(): mongoose.Connection[] {
  return connections.map(c => c.connection)
}

export function getConnectionCount(): number {
  return connections.length
}
