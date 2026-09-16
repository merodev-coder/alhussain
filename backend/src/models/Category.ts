import mongoose, { Schema } from 'mongoose'

// The 8 fixed homepage categories. `slug` matches Product.homeSection so the
// tile links line up with real inventory. Categories are seeded once (see
// routes/categories.ts) and only their `image` is expected to change day to
// day, but the whole document remains editable from the dashboard.
export const CATEGORY_SLUGS = [
  'laptops',
  'bags',
  'mice',
  'ram',
  'storage',
  'batteries',
  'chargers',
  'monitors',
] as const

export interface CategoryDoc {
  _id?: string
  id?: string
  slug: (typeof CATEGORY_SLUGS)[number]
  name: string
  /** Real product photo for the category tile. Null/empty falls back to an icon on the frontend. */
  image: string | null
  order: number
  dbIndex: number
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    slug: { type: String, required: true, enum: CATEGORY_SLUGS, unique: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: null },
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

CategorySchema.index({ order: 1 })
CategorySchema.index({ dbIndex: 1 })

export function getCategoryModel(connection: mongoose.Connection): mongoose.Model<CategoryDoc> {
  if (connection.models.Category) {
    return connection.models.Category as mongoose.Model<CategoryDoc>
  }
  return connection.model<CategoryDoc>('Category', CategorySchema)
}

export default getCategoryModel(mongoose.connection)
