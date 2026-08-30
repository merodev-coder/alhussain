import mongoose, { Schema } from 'mongoose';
const ProductSchema = new Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    cpu: { type: String, default: '' },
    gpu: { type: String, default: '' },
    ram: { type: String, default: '' },
    storage: { type: String, default: '' },
    photos: { type: [String], default: [] },
    stockStatus: {
        type: String,
        enum: ['in_stock', 'limited', 'out_of_stock'],
        default: 'in_stock',
    },
    quantity: { type: Number, default: 0, min: 0 },
    discountBadge: { type: String },
    visible: { type: Boolean, default: true },
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
ProductSchema.index({ visible: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ dbIndex: 1 });
export function getProductModel(connection) {
    if (connection.models.Product) {
        return connection.models.Product;
    }
    return connection.model('Product', ProductSchema);
}
const Product = getProductModel(mongoose.connection);
export default Product;
