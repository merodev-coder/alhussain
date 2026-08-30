import mongoose, { Schema } from 'mongoose'

export interface ShippingRateDoc {
  _id?: string
  id?: string
  governorate: string
  cost: number
  estimatedDays: number
  active: boolean
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const ShippingRateSchema = new Schema<ShippingRateDoc>(
  {
    governorate: { type: String, required: true, trim: true, unique: true },
    cost: { type: Number, required: true, min: 0, default: 0 },
    estimatedDays: { type: Number, required: true, min: 1, default: 3 },
    active: { type: Boolean, default: true },
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

ShippingRateSchema.index({ governorate: 1 }, { unique: true })
ShippingRateSchema.index({ dbIndex: 1 })

export function getShippingRateModel(
  connection: mongoose.Connection
): mongoose.Model<ShippingRateDoc> {
  if (connection.models.ShippingRate) {
    return connection.models.ShippingRate as mongoose.Model<ShippingRateDoc>
  }
  return connection.model<ShippingRateDoc>('ShippingRate', ShippingRateSchema)
}

export default getShippingRateModel(mongoose.connection)
