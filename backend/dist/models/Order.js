import mongoose, { Schema } from 'mongoose';
const SelectedAddonSchema = new Schema({
    addonId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
}, { _id: false });
const OrderItemSchema = new Schema({
    productId: { type: String, required: true },
    itemType: { type: String, enum: ['laptop', 'accessory'], default: 'laptop' },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    priceAtOrder: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    selectedAddons: { type: [SelectedAddonSchema], default: [] },
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
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined', 'shipped', 'completed'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['vodafone_cash', 'instapay'],
    },
    isCashOnDelivery: { type: Boolean, default: false },
    depositAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['pending_verification', 'confirmed', 'rejected'],
        default: 'pending_verification',
    },
    stockDecremented: { type: Boolean, default: false },
    dbIndex: { type: Number, required: true, default: 0 },
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
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ dbIndex: 1 });
export function getOrderModel(connection) {
    if (connection.models.Order) {
        return connection.models.Order;
    }
    return connection.model('Order', OrderSchema);
}
const Order = getOrderModel(mongoose.connection);
export default Order;
