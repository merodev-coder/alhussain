import { Schema } from 'mongoose';
const PricelistPdfSchema = new Schema({
    data: { type: Buffer, required: true },
    fileName: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    itemCount: { type: Number, default: 0 },
    signature: { type: String, default: '' },
    dbIndex: { type: Number, default: 0 },
}, { timestamps: true });
export function getPricelistPdfModel(connection) {
    if (connection.models.PricelistPdf) {
        return connection.models.PricelistPdf;
    }
    return connection.model('PricelistPdf', PricelistPdfSchema);
}
