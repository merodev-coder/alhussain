import mongoose, { Schema, model } from 'mongoose';
const OrderItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
}, { _id: false });
const OrderSchema = new Schema({
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    governorate: { type: String, default: '' },
    deliveryMethod: {
        type: String,
        enum: ['shipping', 'pickup'],
        required: true,
    },
    depositPhotoUrl: { type: String },
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined', 'shipped', 'completed'],
        default: 'pending',
    },
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
const Order = mongoose.models.Order || model('Order', OrderSchema);
export default Order;
