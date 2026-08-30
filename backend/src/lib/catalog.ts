import { getProductModel } from '../models/Product.js'
import { getAddonModel } from '../models/Addon.js'
import { getAccessoryModel } from '../models/Accessory.js'
import { getShippingRateModel } from '../models/ShippingRate.js'
import { DatabaseRouter } from './db-router.js'
import { withId } from './json.js'

export async function findProductById(id: string) {
  const found = await DatabaseRouter.findByIdAcrossDatabases(
    id,
    async (connection, productId) => getProductModel(connection).findById(productId).lean(),
    'product'
  )
  if (!found) return null
  return { ...withId(found.result), dbIndex: found.dbIndex }
}

export async function findAddonById(id: string) {
  const found = await DatabaseRouter.findByIdAcrossDatabases(
    id,
    async (connection, addonId) => getAddonModel(connection).findById(addonId).lean(),
    'addon'
  )
  if (!found) return null
  return { ...withId(found.result), dbIndex: found.dbIndex }
}

export async function findAccessoryById(id: string) {
  const found = await DatabaseRouter.findByIdAcrossDatabases(
    id,
    async (connection, accessoryId) => getAccessoryModel(connection).findById(accessoryId).lean(),
    'accessory'
  )
  if (!found) return null
  return { ...withId(found.result), dbIndex: found.dbIndex }
}

export async function findShippingRate(governorate: string) {
  const all = await DatabaseRouter.readAcrossAllDatabases(
    async connection =>
      getShippingRateModel(connection).find({ governorate, active: true }).lean(),
    'shippingRate'
  )
  const first = all[0]
  return first ? withId(first) : null
}
