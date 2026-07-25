import mongoose, { Schema, model } from 'mongoose';
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
    discountBadge: { type: String },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            ret.id = ret._id?.toString();
            delete ret._id;
        },
    },
});
const Product = mongoose.models.Product || model('Product', ProductSchema);
export default Product;
