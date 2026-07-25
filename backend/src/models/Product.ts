import mongoose, { Schema, model } from 'mongoose'

export type StockStatus = 'in_stock' | 'limited' | 'out_of_stock'

export interface ProductDoc {
  name: string
  price: number
  description: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  photos: string[]
  stockStatus: StockStatus
  discountBadge?: string
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
    discountBadge: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc: any, ret: { id?: any; _id?: { toString: () => any } }) {
  ret.id = ret._id?.toString()
  delete ret._id
},
    },
  }
)

const Product = (mongoose.models.Product as mongoose.Model<ProductDoc>) || model<ProductDoc>('Product', ProductSchema)

export default Product
