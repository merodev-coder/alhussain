import mongoose, { Schema } from 'mongoose';
const SiteSettingsSchema = new Schema({
    vodafoneCashNumber: { type: String, required: true, trim: true },
    instapayNumber: { type: String, required: true, trim: true },
    activeUploadThingTokenIndex: { type: Number, required: true, default: 0 },
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
SiteSettingsSchema.index({ dbIndex: 1 });
export function getSiteSettingsModel(connection) {
    if (connection.models.SiteSettings) {
        return connection.models.SiteSettings;
    }
    return connection.model('SiteSettings', SiteSettingsSchema);
}
export default getSiteSettingsModel(mongoose.connection);
