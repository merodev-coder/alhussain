import { getShippingRateModel } from '../models/ShippingRate.js'
import { EGYPT_GOVERNORATES } from './governorates.js'
import { getAllConnections } from './db.js'
import { logInfo, logError } from './logger.js'

const DEFAULT_COST = 75
const DEFAULT_DAYS = 3

/**
 * If ShippingRate is empty on every configured cluster, seed all 27 governorates
 * on the primary connection (dbIndex 0). Safe to run on every boot.
 */
export async function seedShippingRatesIfEmpty(): Promise<void> {
  try {
    const connections = getAllConnections()
    let total = 0
    for (const connection of connections) {
      total += await getShippingRateModel(connection).countDocuments()
    }
    if (total > 0) {
      logInfo('Seed shipping', `ShippingRate already has ${total} row(s); skip seed`)
      return
    }

    const primary = connections[0]
    const Model = getShippingRateModel(primary)
    await Model.insertMany(
      EGYPT_GOVERNORATES.map(governorate => ({
        governorate,
        cost: DEFAULT_COST,
        estimatedDays: DEFAULT_DAYS,
        active: true,
        dbIndex: 0,
      }))
    )
    logInfo('Seed shipping', `Seeded ${EGYPT_GOVERNORATES.length} governorates on primary DB`)
  } catch (error) {
    logError('Seed shipping', error)
  }
}
