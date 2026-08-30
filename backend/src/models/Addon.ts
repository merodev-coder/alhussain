import mongoose, { Schema } from 'mongoose'
import type { StockStatus } from './Product.js'

export type AddonCategory = 'ram' | 'storage' | 'accessory' | 'other'

export interface AddonDoc {
  _id?: string
  id?: string
  name: string
  price: number
  description: string
  category: AddonCategory
  compatibleWith: string[]
  photos: string[]
  stockStatus: StockStatus
  quantity: number
  visible: boolean
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const AddonSchema = new Schema<AddonDoc>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['ram', 'storage', 'accessory', 'other'],
      default: 'other',
    },
    compatibleWith: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'limited', 'out_of_stock'],
      default: 'in_stock',
    },
    quantity: { type: Number, default: 0, min: 0 },
    visible: { type: Boolean, default: true },
    dbIndex: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString: () => string })?.toString()
        delete ret._id
      },
    },
  }
)

AddonSchema.index({ visible: 1, createdAt: -1 })
AddonSchema.index({ visible: 1, category: 1 })
AddonSchema.index({ dbIndex: 1 })

export function getAddonModel(connection: mongoose.Connection): mongoose.Model<AddonDoc> {
  if (connection.models.Addon) {
    return connection.models.Addon as mongoose.Model<AddonDoc>
  }
  return connection.model<AddonDoc>('Addon', AddonSchema)
}

export default getAddonModel(mongoose.connection)
