import { Router } from 'express';
import express from 'express';
import { getPricelistPdfModel } from '../models/PricelistPdf.js';
import { requireAdmin } from '../middleware/auth.js';
import { DatabaseRouter } from '../lib/db-router.js';
import { getConnection, getAllConnections } from '../lib/db.js';
import { logError, logInfo } from '../lib/logger.js';
const router = Router();
const MAX_PDF_BYTES = 15 * 1024 * 1024; // stays under Mongo's 16MB document limit
/** Metadata only (no binary) of the newest stored PDF across all databases. */
async function findLatestMeta() {
    const metas = await DatabaseRouter.readAcrossAllDatabases(async (connection, dbIndex) => {
        const docs = await getPricelistPdfModel(connection)
            .find({})
            .select('-data')
            .sort({ updatedAt: -1 })
            .limit(1)
            .lean();
        return docs.map(d => ({ ...d, dbIndex }));
    }, 'pricelist-pdf-meta');
    if (metas.length === 0)
        return null;
    metas.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return metas[0];
}
/**
 * POST /api/pricelist-pdf   (admin only)
 * Body: the raw PDF bytes (Content-Type: application/pdf)
 * Headers: X-Item-Count, X-Signature
 * Stores the PDF and removes any previously stored one.
 */
router.post('/api/pricelist-pdf', requireAdmin, express.raw({ type: 'application/pdf', limit: MAX_PDF_BYTES }), async (req, res) => {
    try {
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) {
            res.status(400).json({ error: 'ملف PDF غير صالح' });
            return;
        }
        // Every real PDF starts with "%PDF-"
        if (body.subarray(0, 5).toString('latin1') !== '%PDF-') {
            res.status(400).json({ error: 'الملف المرفوع ليس PDF' });
            return;
        }
        const itemCount = Math.max(0, parseInt(String(req.header('x-item-count') || '0'), 10) || 0);
        const signature = String(req.header('x-signature') || '').slice(0, 128);
        const date = new Date().toISOString().slice(0, 10);
        const { result, dbIndex } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => getPricelistPdfModel(connection).create({
            data: body,
            fileName: `قائمة-اسعار-الحسين-${date}.pdf`,
            sizeBytes: body.length,
            itemCount,
            signature,
            dbIndex,
        }), 'pricelist-pdf');
        // Keep only the newest PDF: delete every other document on every database.
        await Promise.all(getAllConnections().map(async (connection) => {
            try {
                await getPricelistPdfModel(connection).deleteMany({ _id: { $ne: result._id } });
            }
            catch (err) {
                logError('Cleanup old pricelist PDFs', err);
            }
        }));
        logInfo('Pricelist PDF', `Published ${body.length} bytes, ${itemCount} items, db ${dbIndex}`);
        res.json({
            success: true,
            sizeBytes: body.length,
            itemCount,
            signature,
            updatedAt: result.updatedAt,
        });
    }
    catch (error) {
        logError('Publish pricelist PDF', error);
        res.status(500).json({ error: 'حدث خطأ أثناء حفظ ملف PDF' });
    }
});
/** GET /api/pricelist-pdf/meta — tells the UI whether a PDF exists and when it was built. */
router.get('/api/pricelist-pdf/meta', async (_req, res) => {
    try {
        const meta = await findLatestMeta();
        res.set('Cache-Control', 'no-store');
        if (!meta) {
            res.json({ exists: false });
            return;
        }
        res.json({
            exists: true,
            fileName: meta.fileName,
            sizeBytes: meta.sizeBytes,
            itemCount: meta.itemCount,
            signature: meta.signature,
            updatedAt: meta.updatedAt,
        });
    }
    catch (error) {
        logError('Get pricelist PDF meta', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
/** GET /api/pricelist-pdf — public, streams the stored PDF straight from the DB. */
router.get('/api/pricelist-pdf', async (req, res) => {
    try {
        const meta = await findLatestMeta();
        if (!meta) {
            res.status(404).json({ error: 'لم يتم نشر قائمة الأسعار بعد' });
            return;
        }
        const etag = `"${meta._id.toString()}-${meta.sizeBytes}"`;
        if (req.header('if-none-match') === etag) {
            res.status(304).end();
            return;
        }
        const doc = await getPricelistPdfModel(getConnection(meta.dbIndex)).findById(meta._id);
        if (!doc) {
            res.status(404).json({ error: 'لم يتم نشر قائمة الأسعار بعد' });
            return;
        }
        const inline = req.query.inline === '1';
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': String(doc.data.length),
            'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="pricelist.pdf"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
            ETag: etag,
            // Always revalidate so a newly published list shows up immediately;
            // the 304 above keeps repeat downloads instant.
            'Cache-Control': 'public, max-age=0, must-revalidate',
        });
        res.end(doc.data);
    }
    catch (error) {
        logError('Download pricelist PDF', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
