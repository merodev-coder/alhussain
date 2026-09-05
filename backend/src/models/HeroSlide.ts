import mongoose, { Schema } from 'mongoose'

export interface HeroSlideDoc {
  _id?: string
  id?: string
  headline: string
  subtitle: string
  buttonText: string
  buttonColor: string
  buttonLink: string
  badgeImage?: string | null
  images: string[]
  isActive: boolean
  order: number
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const HeroSlideSchema = new Schema<HeroSlideDoc>(
  {
    headline: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    buttonText: { type: String, default: 'تصفح الآن', trim: true },
    buttonColor: { type: String, default: '#2563eb', trim: true },
    buttonLink: { type: String, default: '/laptops', trim: true },
    badgeImage: { type: String, default: null },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    dbIndex: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = (ret._id as { toString: () => string }).toString()
        }
        delete ret._id
        delete ret.__v
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = (ret._id as { toString: () => string }).toString()
        }
        delete ret._id
        delete ret.__v
      },
    },
  }
)

HeroSlideSchema.index({ order: 1 })
HeroSlideSchema.index({ isActive: 1 })
HeroSlideSchema.index({ dbIndex: 1 })

export function getHeroSlideModel(
  connection: mongoose.Connection
): mongoose.Model<HeroSlideDoc> {
  if (connection.models.HeroSlide) {
    return connection.models.HeroSlide as mongoose.Model<HeroSlideDoc>
  }
  return connection.model<HeroSlideDoc>('HeroSlide', HeroSlideSchema)
}

export default getHeroSlideModel(mongoose.connection)
