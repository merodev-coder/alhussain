import mongoose, { Schema } from 'mongoose'

export type StockStatus = 'in_stock' | 'limited' | 'out_of_stock'

export interface ProductDoc {
  _id?: string
  id?: string
  name: string
  price: number
  description: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  photos: string[]
  stockStatus: StockStatus
  quantity: number
  discountBadge?: string
  badge?: string | null
  homeSection?: 'graphics' | 'business' | 'accessories' | 'batteries' | 'storage' | null
  specs?: {
    cpu?: string
    ram?: string
    storage?: string
    screen?: string
    gpu?: string
  }
  visible: boolean
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    cpu: { type: String, default: '' },
    gpu: { type: String, default: '' },
    ram: { type: String, default: '' },
    storage: { type: String, default: '' },
    photos: { type: [String], default: [] },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'limited', 'out_of_stock'],
      default: 'in_stock',
    },
    quantity: { type: Number, default: 0, min: 0 },
    discountBadge: { type: String },
    badge: { type: String, default: null },
    homeSection: {
      type: String,
      enum: ['graphics', 'business', 'accessories', 'batteries', 'storage', null],
      default: null,
    },
    specs: {
      cpu: { type: String, default: '' },
      ram: { type: String, default: '' },
      storage: { type: String, default: '' },
      screen: { type: String, default: '' },
      gpu: { type: String, default: '' },
    },
    visible: { type: Boolean, default: true },
    dbIndex: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = (ret._id as { toString: () => string }).toString()
        }
        delete ret._id
        delete ret.__v
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = (ret._id as { toString: () => string }).toString()
        }
        delete ret._id
        delete ret.__v
      },
    },
  }
)

ProductSchema.index({ visible: 1, createdAt: -1 })
ProductSchema.index({ homeSection: 1 })
ProductSchema.index({ name: 'text', description: 'text' })
ProductSchema.index({ dbIndex: 1 })

export function getProductModel(connection: mongoose.Connection): mongoose.Model<ProductDoc> {
  if (connection.models.Product) {
    return connection.models.Product as mongoose.Model<ProductDoc>
  }
  return connection.model<ProductDoc>('Product', ProductSchema)
}

const Product = getProductModel(mongoose.connection)
export default Product
