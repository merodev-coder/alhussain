import mongoose, { Schema, model } from 'mongoose';
const PricelistSchema = new Schema({
    sourceFileName: { type: String, required: true },
    parsedHtml: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    published: { type: Boolean, default: false },
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
const Pricelist = mongoose.models.Pricelist ||
    model('Pricelist', PricelistSchema);
export default Pricelist;
