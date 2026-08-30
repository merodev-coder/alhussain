import mongoose, { Schema } from 'mongoose';
const AddonSchema = new Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['ram', 'storage', 'accessory', 'other'],
        default: 'other',
    },
    compatibleWith: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    stockStatus: {
        type: String,
        enum: ['in_stock', 'limited', 'out_of_stock'],
        default: 'in_stock',
    },
    quantity: { type: Number, default: 0, min: 0 },
    visible: { type: Boolean, default: true },
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
AddonSchema.index({ visible: 1, createdAt: -1 });
AddonSchema.index({ visible: 1, category: 1 });
AddonSchema.index({ dbIndex: 1 });
export function getAddonModel(connection) {
    if (connection.models.Addon) {
        return connection.models.Addon;
    }
    return connection.model('Addon', AddonSchema);
}
export default getAddonModel(mongoose.connection);
