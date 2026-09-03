import mongoose, { Schema } from 'mongoose'

export type OrderStatus = 'pending' | 'confirmed' | 'declined' | 'shipped' | 'completed'
export type PaymentMethod = 'vodafone_cash' | 'instapay'
export type PaymentStatus = 'pending_verification' | 'confirmed' | 'rejected'
export type OrderItemType = 'laptop' | 'accessory'

export interface SelectedAddonDoc {
  addonId: string
  name: string
  price: number
  qty: number
}

export interface OrderItemDoc {
  productId: string
  itemType: OrderItemType
  name: string
  price: number
  priceAtOrder: number
  qty: number
  selectedAddons: SelectedAddonDoc[]
}

export interface OrderDoc {
  orderNumber: string
  customerName: string
  phone: string
  email: string
  address: string
  governorate: string
  deliveryMethod: 'shipping' | 'pickup'
  depositPhotoUrl?: string
  items: OrderItemDoc[]
  shippingCost: number
  total: number
  status: OrderStatus
  paymentMethod?: PaymentMethod
  isCashOnDelivery: boolean
  depositAmount: number
  paymentStatus: PaymentStatus
  stockDecremented: boolean
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const SelectedAddonSchema = new Schema<SelectedAddonDoc>(
  {
    addonId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const OrderItemSchema = new Schema<OrderItemDoc>(
  {
    productId: { type: String, required: true },
    itemType: { type: String, enum: ['laptop', 'accessory'], default: 'laptop' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    priceAtOrder: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    selectedAddons: { type: [SelectedAddonSchema], default: [] },
  },
  { _id: false }
)

const OrderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, default: '' },
    governorate: { type: String, default: '' },
    deliveryMethod: {
      type: String,
      enum: ['shipping', 'pickup'],
      required: true,
    },
    depositPhotoUrl: { type: String },
    items: { type: [OrderItemSchema], default: [] },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'shipped', 'completed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['vodafone_cash', 'instapay'],
    },
    isCashOnDelivery: { type: Boolean, default: false },
    depositAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending_verification', 'confirmed', 'rejected'],
      default: 'pending_verification',
    },
    stockDecremented: { type: Boolean, default: false },
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

OrderSchema.index({ status: 1, createdAt: -1 })
OrderSchema.index({ paymentStatus: 1, createdAt: -1 })
OrderSchema.index({ orderNumber: 1 }, { unique: true })
OrderSchema.index({ dbIndex: 1 })

export function getOrderModel(connection: mongoose.Connection): mongoose.Model<OrderDoc> {
  if (connection.models.Order) {
    return connection.models.Order as mongoose.Model<OrderDoc>
  }
  return connection.model<OrderDoc>('Order', OrderSchema)
}

const Order = getOrderModel(mongoose.connection)
export default Order
