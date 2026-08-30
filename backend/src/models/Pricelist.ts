import mongoose, { Schema, model } from 'mongoose'

export interface PricelistDoc {
  sourceFileName: string
  parsedHtml: string
  uploadedAt: Date
  published: boolean
  dbIndex: number // Index of the database where this record is stored
  createdAt: Date
  updatedAt: Date
}

const PricelistSchema = new Schema<PricelistDoc>(
  {
    sourceFileName: { type: String, required: true },
    parsedHtml: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false },
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

// Helper function to get Pricelist model for a specific connection
export function getPricelistModel(connection: mongoose.Connection): mongoose.Model<PricelistDoc> {
  if (connection.models.Pricelist) {
    return connection.models.Pricelist as mongoose.Model<PricelistDoc>
  }
  return connection.model<PricelistDoc>('Pricelist', PricelistSchema)
}

// Legacy export for backward compatibility (uses default connection)
const Pricelist = getPricelistModel(mongoose.connection)

export default Pricelist
