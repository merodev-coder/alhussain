import mongoose, { Schema, model } from 'mongoose'

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
  discountBadge?: string
  visible: boolean
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
    visible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc: any, ret: any) {
        if (ret._id) {
          ret.id = ret._id.toString()
        }
        delete ret._id
        delete ret.__v
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: function (_doc: any, ret: any) {
        if (ret._id) {
          ret.id = ret._id.toString()
        }
        delete ret._id
        delete ret.__v
      },
    },
  }
)

const Product = (mongoose.models.Product as mongoose.Model<ProductDoc>) || model<ProductDoc>('Product', ProductSchema)

export default Product
