import mongoose, { Schema, model } from 'mongoose'

export interface StructuredLaptopItem {
  index?: number
  brand: string
  model: string
  name: string
  cpu: string
  ram: string
  storage: string
  screen: string
  gpu: string
  price: number
  category?: string
  flagged?: boolean
  flagReason?: string
}

export interface PricelistDoc {
  sourceFileName: string
  rawExcelFileUrl?: string
  structuredItems: StructuredLaptopItem[]
  generatedHtml: string
  parsedHtml: string // Kept for backward compatibility
  uploadedAt: Date
  published: boolean
  dbIndex: number // Index of the database where this record is stored
  createdAt: Date
  updatedAt: Date
}

const PricelistSchema = new Schema<PricelistDoc>(
  {
    sourceFileName: { type: String, required: true },
    rawExcelFileUrl: { type: String, default: '' },
    structuredItems: { type: [Object], default: [] },
    generatedHtml: { type: String, default: '' },
    parsedHtml: { type: String, default: '' },
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

