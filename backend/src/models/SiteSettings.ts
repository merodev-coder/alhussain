import mongoose, { Schema } from 'mongoose'

export interface SiteSettingsDoc {
  _id?: string
  id?: string
  vodafoneCashNumber?: string
  instapayNumber?: string
  activeUploadThingTokenIndex?: number
  senderEmail?: string
  senderEmailAppPassword?: string
  dbIndex?: number
  createdAt?: Date
  updatedAt?: Date
}

const SiteSettingsSchema = new Schema<SiteSettingsDoc>(
  {
    vodafoneCashNumber: { type: String, required: false, default: '', trim: true },
    instapayNumber: { type: String, required: false, default: '', trim: true },
    activeUploadThingTokenIndex: { type: Number, required: false, default: 0 },
    senderEmail: { type: String, required: false, default: '' },
    senderEmailAppPassword: { type: String, required: false, default: '' },
    dbIndex: { type: Number, required: false, default: 0 },
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

SiteSettingsSchema.index({ dbIndex: 1 })

export function getSiteSettingsModel(
  connection: mongoose.Connection
): mongoose.Model<SiteSettingsDoc> {
  if (connection.models.SiteSettings) {
    return connection.models.SiteSettings as mongoose.Model<SiteSettingsDoc>
  }
  return connection.model<SiteSettingsDoc>('SiteSettings', SiteSettingsSchema)
}

export default getSiteSettingsModel(mongoose.connection)
