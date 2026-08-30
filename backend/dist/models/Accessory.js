import mongoose, { Schema } from 'mongoose';
const AccessorySchema = new Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    category: { type: String, default: 'other', trim: true },
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
AccessorySchema.index({ visible: 1, createdAt: -1 });
AccessorySchema.index({ name: 'text', description: 'text' });
AccessorySchema.index({ dbIndex: 1 });
export function getAccessoryModel(connection) {
    if (connection.models.Accessory) {
        return connection.models.Accessory;
    }
    return connection.model('Accessory', AccessorySchema);
}
export default getAccessoryModel(mongoose.connection);
