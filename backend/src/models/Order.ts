import mongoose, { Schema, model, models } from 'mongoose'

export type OrderStatus = 'pending' | 'confirmed' | 'declined' | 'shipped' | 'completed'

export interface OrderItemDoc {
  productId: string
  name: string
  price: number
  qty: number
}

export interface OrderDoc {
  orderNumber: string
  customerName: string
  phone: string
  address: string
  governorate: string
  deliveryMethod: 'shipping' | 'pickup'
  depositPhotoUrl?: string
  items: OrderItemDoc[]
  total: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<OrderItemDoc>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const OrderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    governorate: { type: String, default: '' },
    deliveryMethod: {
      type: String,
      enum: ['shipping', 'pickup'],
      required: true,
    },
    depositPhotoUrl: { type: String },
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'shipped', 'completed'],
      default: 'pending',
    },
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

const Order = (models.Order as mongoose.Model<OrderDoc>) || model<OrderDoc>('Order', OrderSchema)

export default Order
