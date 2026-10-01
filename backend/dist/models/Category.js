import mongoose, { Schema } from 'mongoose';
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
];
const CategorySchema = new Schema({
    slug: { type: String, required: true, enum: CATEGORY_SLUGS, unique: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    order: { type: Number, default: 0 },
    dbIndex: { type: Number, required: true, default: 0 },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            if (ret._id) {
                ret.id = ret._id.toString();
            }
            delete ret._id;
            delete ret.__v;
        },
    },
    toObject: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            if (ret._id) {
                ret.id = ret._id.toString();
            }
            delete ret._id;
            delete ret.__v;
        },
    },
});
CategorySchema.index({ order: 1 });
CategorySchema.index({ dbIndex: 1 });
export function getCategoryModel(connection) {
    if (connection.models.Category) {
        return connection.models.Category;
    }
    return connection.model('Category', CategorySchema);
}
export default getCategoryModel(mongoose.connection);
