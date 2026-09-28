import mongoose, { Schema } from 'mongoose'

/**
 * The pre-generated price list PDF.
 *
 * The admin builds the PDF once (from the dashboard's "نشر قائمة الأسعار"
 * button) and uploads it here. Customers then download this stored file
 * directly, so no PDF is ever generated in a visitor's browser.
 *
 * Only the latest document is kept; older ones are deleted on each publish.
 */
export interface PricelistPdfDoc {
  data: Buffer
  fileName: string
  sizeBytes: number
  itemCount: number
  /** Fingerprint of the catalog the PDF was built from (see pricelist-live). */
  signature: string
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const PricelistPdfSchema = new Schema<PricelistPdfDoc>(
  {
    data: { type: Buffer, required: true },
    fileName: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    itemCount: { type: Number, default: 0 },
    signature: { type: String, default: '' },
    dbIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export function getPricelistPdfModel(
  connection: mongoose.Connection
): mongoose.Model<PricelistPdfDoc> {
  if (connection.models.PricelistPdf) {
    return connection.models.PricelistPdf as mongoose.Model<PricelistPdfDoc>
  }
  return connection.model<PricelistPdfDoc>('PricelistPdf', PricelistPdfSchema)
}
