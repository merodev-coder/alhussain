import mongoose, { Schema } from 'mongoose';
const ShippingRateSchema = new Schema({
    governorate: { type: String, required: true, trim: true, unique: true },
    cost: { type: Number, required: true, min: 0, default: 0 },
    estimatedDays: { type: Number, required: true, min: 1, default: 3 },
    active: { type: Boolean, default: true },
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
ShippingRateSchema.index({ governorate: 1 }, { unique: true });
ShippingRateSchema.index({ dbIndex: 1 });
export function getShippingRateModel(connection) {
    if (connection.models.ShippingRate) {
        return connection.models.ShippingRate;
    }
    return connection.model('ShippingRate', ShippingRateSchema);
}
export default getShippingRateModel(mongoose.connection);
