/**
 * Simple client-side logger that respects production environment.
 * In production, logs are silenced to avoid console spam.
 */

const isProduction = process.env.NODE_ENV === 'production'

export const clientLogger = {
  log: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[Client]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    if (!isProduction) {
      console.error('[Client Error]', ...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (!isProduction) {
      console.warn('[Client Warn]', ...args)
    }
  },
}
