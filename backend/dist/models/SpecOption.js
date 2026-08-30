import mongoose, { Schema } from 'mongoose';
const SpecOptionSchema = new Schema({
    type: {
        type: String,
        enum: ['cpu', 'gpu', 'ram', 'storage'],
        required: true,
    },
    value: { type: String, required: true, trim: true },
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
// Prevent duplicate values within the same type.
SpecOptionSchema.index({ type: 1, value: 1 }, { unique: true });
SpecOptionSchema.index({ dbIndex: 1 });
// Helper function to get SpecOption model for a specific connection
export function getSpecOptionModel(connection) {
    if (connection.models.SpecOption) {
        return connection.models.SpecOption;
    }
    return connection.model('SpecOption', SpecOptionSchema);
}
// Legacy export for backward compatibility (uses default connection)
const SpecOption = getSpecOptionModel(mongoose.connection);
export default SpecOption;
