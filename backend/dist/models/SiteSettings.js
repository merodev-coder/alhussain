import mongoose, { Schema } from 'mongoose';
const SiteSettingsSchema = new Schema({
    vodafoneCashNumber: { type: String, required: false, default: '', trim: true },
    instapayNumber: { type: String, required: false, default: '', trim: true },
    activeUploadThingTokenIndex: { type: Number, required: false, default: 0 },
    senderEmail: { type: String, required: false, default: '' },
    senderEmailAppPassword: { type: String, required: false, default: '' },
    dbIndex: { type: Number, required: false, default: 0 },
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
SiteSettingsSchema.index({ dbIndex: 1 });
export function getSiteSettingsModel(connection) {
    if (connection.models.SiteSettings) {
        return connection.models.SiteSettings;
    }
    return connection.model('SiteSettings', SiteSettingsSchema);
}
export default getSiteSettingsModel(mongoose.connection);
