import { Schema, model, models } from 'mongoose';
const SpecOptionSchema = new Schema({
    type: {
        type: String,
        enum: ['cpu', 'gpu', 'ram', 'storage'],
        required: true,
    },
    value: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
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
const SpecOption = models.SpecOption ||
    model('SpecOption', SpecOptionSchema);
export default SpecOption;
