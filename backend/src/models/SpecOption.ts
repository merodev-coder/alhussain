import mongoose, { Schema, model, models } from 'mongoose'

export type SpecType = 'cpu' | 'gpu' | 'ram' | 'storage'

export interface SpecOptionDoc {
  type: SpecType
  value: string
  active: boolean
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

const SpecOption =
  (models.SpecOption as mongoose.Model<SpecOptionDoc>) ||
  model<SpecOptionDoc>('SpecOption', SpecOptionSchema)

export default SpecOption
