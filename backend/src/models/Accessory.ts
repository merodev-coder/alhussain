import mongoose, { Schema } from 'mongoose'
import type { StockStatus } from './Product.js'

export interface AccessoryDoc {
  _id?: string
  id?: string
  name: string
  price: number
  description: string
  category: string
  photos: string[]
  stockStatus: StockStatus
  quantity: number
  visible: boolean
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const AccessorySchema = new Schema<AccessoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    category: { type: String, default: 'other', trim: true },
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

AccessorySchema.index({ visible: 1, createdAt: -1 })
AccessorySchema.index({ name: 'text', description: 'text' })
AccessorySchema.index({ dbIndex: 1 })

export function getAccessoryModel(connection: mongoose.Connection): mongoose.Model<AccessoryDoc> {
  if (connection.models.Accessory) {
    return connection.models.Accessory as mongoose.Model<AccessoryDoc>
  }
  return connection.model<AccessoryDoc>('Accessory', AccessorySchema)
}

export default getAccessoryModel(mongoose.connection)
