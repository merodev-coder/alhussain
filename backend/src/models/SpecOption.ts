import mongoose, { Schema, model } from 'mongoose'

export type SpecType = 'cpu' | 'gpu' | 'ram' | 'storage'

export interface SpecOptionDoc {
  type: SpecType
  value: string
  active: boolean
  dbIndex: number // Index of the database where this record is stored
  createdAt: Date
  updatedAt: Date
}

const SpecOptionSchema = new Schema<SpecOptionDoc>(
  {
    type: {
      type: String,
      enum: ['cpu', 'gpu', 'ram', 'storage'],
      required: true,
    },
    value: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    dbIndex: { type: Number, required: true, default: 0 },
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

// Prevent duplicate values within the same type.
SpecOptionSchema.index({ type: 1, value: 1 }, { unique: true })
SpecOptionSchema.index({ dbIndex: 1 })

// Helper function to get SpecOption model for a specific connection
export function getSpecOptionModel(connection: mongoose.Connection): mongoose.Model<SpecOptionDoc> {
  if (connection.models.SpecOption) {
    return connection.models.SpecOption as mongoose.Model<SpecOptionDoc>
  }
  return connection.model<SpecOptionDoc>('SpecOption', SpecOptionSchema)
}

// Legacy export for backward compatibility (uses default connection)
const SpecOption = getSpecOptionModel(mongoose.connection)

export default SpecOption
