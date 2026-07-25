import mongoose, { Schema, model, models } from 'mongoose'

export interface PricelistDoc {
  sourceFileName: string
  parsedHtml: string
  uploadedAt: Date
  published: boolean
  createdAt: Date
  updatedAt: Date
}

const PricelistSchema = new Schema<PricelistDoc>(
  {
    sourceFileName: { type: String, required: true },
    parsedHtml: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id?.toString()
        delete ret._id
      },
    },
  }
)

const Pricelist =
  (models.Pricelist as mongoose.Model<PricelistDoc>) ||
  model<PricelistDoc>('Pricelist', PricelistSchema)

export default Pricelist
