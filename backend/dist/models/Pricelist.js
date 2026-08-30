import mongoose, { Schema } from 'mongoose';
const PricelistSchema = new Schema({
    sourceFileName: { type: String, required: true },
    parsedHtml: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false },
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
// Helper function to get Pricelist model for a specific connection
export function getPricelistModel(connection) {
    if (connection.models.Pricelist) {
        return connection.models.Pricelist;
    }
    return connection.model('Pricelist', PricelistSchema);
}
// Legacy export for backward compatibility (uses default connection)
const Pricelist = getPricelistModel(mongoose.connection);
export default Pricelist;
