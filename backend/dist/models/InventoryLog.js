import mongoose, { Schema } from 'mongoose';
const InventoryLogSchema = new Schema({
    itemType: { type: String, enum: ['laptop', 'addon', 'accessory'], required: true },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    adminUser: { type: String, required: true },
    oldQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
    reason: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    dbIndex: { type: Number, required: true, default: 0 },
}, {
    timestamps: false,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            ret.id = ret._id?.toString();
            delete ret._id;
        },
    },
});
InventoryLogSchema.index({ itemId: 1, date: -1 });
InventoryLogSchema.index({ date: -1 });
export function getInventoryLogModel(connection) {
    if (connection.models.InventoryLog) {
        return connection.models.InventoryLog;
    }
    return connection.model('InventoryLog', InventoryLogSchema);
}
export default getInventoryLogModel(mongoose.connection);
