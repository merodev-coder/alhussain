/**
 * Fills in the screen size for every laptop already in the database.
 *
 * The size is read from the Arabic description ("شاشة 15.6") which every
 * existing laptop has. Products that already have a screen size are skipped.
 *
 *   cd backend
 *   npx tsx scripts/backfill-screen-size.ts          # dry run, prints changes
 *   npx tsx scripts/backfill-screen-size.ts --apply  # writes to the database(s)
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB, getAllConnections } from '../src/lib/db.js'
import { getProductModel } from '../src/models/Product.js'

const APPLY = process.argv.includes('--apply')

export function extractScreen(text: string): string {
  const m =
    text.match(/شاشة\s*([0-9]{2}(?:\.[0-9])?)/) ||
    text.match(/([0-9]{2}(?:\.[0-9])?)\s*(?:"|”|″|inch|بوصة|إنش|انش)/i)
  return m ? `${m[1]}"` : ''
}

async function main() {
  await connectDB()
  const connections = getAllConnections() as mongoose.Connection[]
  let updated = 0
  let missing = 0

  for (const [i, connection] of connections.entries()) {
    const Product = getProductModel(connection)
    const products = await Product.find({})
    for (const p of products) {
      const current = p.screen || p.specs?.screen || ''
      if (current) continue
      const screen = extractScreen(`${p.description || ''} ${p.name || ''}`)
      if (!screen) {
        missing++
        console.log(`[db ${i}] NO SCREEN FOUND: ${p.name} (${p.id})`)
        continue
      }
      console.log(`[db ${i}] ${p.name} -> ${screen}`)
      if (APPLY) {
        await Product.updateOne({ _id: p._id }, { $set: { screen, 'specs.screen': screen } })
      }
      updated++
    }
  }

  console.log(`\n${APPLY ? 'Updated' : 'Would update'} ${updated} laptops; ${missing} without a detectable size.`)
  if (!APPLY) console.log('Dry run only. Re-run with --apply to save.')
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
