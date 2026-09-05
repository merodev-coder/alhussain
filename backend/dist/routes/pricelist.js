import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { UTApi, UTFile } from 'uploadthing/server';
import { getPricelistModel } from '../models/Pricelist.js';
import { requireAdmin } from '../middleware/auth.js';
import { logError, logInfo } from '../lib/logger.js';
import { DatabaseRouter } from '../lib/db-router.js';
import { withId } from '../lib/json.js';
import { normalizePricelistWithGemini, generatePricelistHtml } from '../lib/gemini.js';
import { getUploadThingTokens } from '../lib/uploadthing-tokens.js';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        const isXlsx = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.originalname?.toLowerCase().endsWith('.xlsx');
        if (isXlsx) {
            cb(null, true);
        }
        else {
            cb(new Error('يجب أن يكون الملف بصيغة Excel (.xlsx) فقط'));
        }
    },
});
/**
 * Parses an Excel buffer into an array of row objects keyed by whatever headers
 * exist in the sheet, without assuming fixed column order or fixed header names.
 */
function parseExcelToRawRows(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error('ملف Excel لا يحتوي على أي صفحات');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!sheetRows || sheetRows.length === 0) {
        throw new Error('ملف Excel فارغ ولا يحتوي على بيانات');
    }
    // Find header row: default to first row with >= 3 non-empty cells
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(sheetRows.length, 12); i++) {
        const row = sheetRows[i];
        if (Array.isArray(row)) {
            const nonEmptyCols = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim().length > 0);
            if (nonEmptyCols.length >= 3) {
                headerRowIndex = i;
                break;
            }
        }
    }
    const rawHeaders = (sheetRows[headerRowIndex] || []).map((h, colIdx) => {
        const str = String(h ?? '').trim();
        return str || `Column_${colIdx + 1}`;
    });
    let currentCategory = '';
    const resultRows = [];
    for (let r = headerRowIndex + 1; r < sheetRows.length; r++) {
        const row = sheetRows[r];
        if (!Array.isArray(row))
            continue;
        const nonBlankCells = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim().length > 0);
        if (nonBlankCells.length === 0)
            continue;
        // Detect category/section divider row (e.g., "Budget Range | الفئة الاقتصادية")
        if (nonBlankCells.length <= 2 && nonBlankCells.length > 0) {
            const text = nonBlankCells.map(c => String(c).trim()).join(' - ');
            if (text && isNaN(Number(text))) {
                currentCategory = text;
                continue;
            }
        }
        const rowObj = {};
        if (currentCategory) {
            rowObj['category'] = currentCategory;
        }
        let hasData = false;
        for (let c = 0; c < rawHeaders.length; c++) {
            const header = rawHeaders[c];
            const val = row[c] !== undefined && row[c] !== null ? row[c] : '';
            rowObj[header] = val;
            if (String(val).trim().length > 0) {
                hasData = true;
            }
        }
        if (hasData) {
            resultRows.push(rowObj);
        }
    }
    return resultRows;
}
/**
 * Uploads the original raw Excel file to UploadThing so it is downloadable.
 */
async function uploadRawExcelToUploadThing(file) {
    try {
        const tokens = getUploadThingTokens();
        const token = tokens[0];
        if (!token) {
            logInfo('UploadThing', 'No UploadThing token found, skipping remote storage');
            return '';
        }
        const utapi = new UTApi({ token });
        const utFile = new UTFile([file.buffer], file.originalname);
        const uploadRes = await utapi.uploadFiles(utFile);
        const uploaded = Array.isArray(uploadRes) ? uploadRes[0] : uploadRes;
        if (uploaded?.data?.ufsUrl || uploaded?.data?.url) {
            return uploaded.data.ufsUrl || uploaded.data.url;
        }
        if (uploaded?.error) {
            logError('UploadThing upload raw excel', uploaded.error);
        }
        return '';
    }
    catch (err) {
        logError('UploadThing raw excel error', err);
        return '';
    }
}
router.get('/api/pricelist', async (_req, res) => {
    try {
        const lists = await DatabaseRouter.readAcrossAllDatabases(async (connection) => getPricelistModel(connection).find({ published: true }).sort({ uploadedAt: -1 }).lean(), 'pricelists');
        const pricelist = lists.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
        if (!pricelist) {
            res.status(404).json({ error: 'لا توجد قائمة أسعار منشورة حالياً' });
            return;
        }
        res.json(withId(pricelist));
    }
    catch (error) {
        logError('Get pricelist', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
router.post('/api/pricelist', requireAdmin, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'الملف مطلوب' });
            return;
        }
        if (!file.originalname?.toLowerCase().endsWith('.xlsx')) {
            res.status(400).json({ error: 'يجب أن يكون الملف بصيغة Excel (.xlsx) فقط' });
            return;
        }
        // 1. Parse sheet into raw rows keyed by whatever headers exist
        logInfo('Pricelist Upload', `Parsing Excel file: ${file.originalname}`);
        const rawRows = parseExcelToRawRows(file.buffer);
        if (rawRows.length === 0) {
            res.status(400).json({ error: 'لم يتم العثور على أي صفوف صالحة في ملف Excel' });
            return;
        }
        // 2. Upload raw Excel file to UploadThing
        logInfo('Pricelist Upload', 'Uploading raw Excel file to UploadThing');
        const rawExcelFileUrl = await uploadRawExcelToUploadThing(file);
        // 3. Normalize + enrich using Gemini 2.5 Flash in batches
        logInfo('Pricelist Upload', `Normalizing ${rawRows.length} rows with Gemini`);
        const structuredItems = await normalizePricelistWithGemini(rawRows);
        // 4. Generate HTML table from structuredItems
        const generatedHtml = generatePricelistHtml(structuredItems);
        // 5. Unpublish previous pricelists
        await DatabaseRouter.readAcrossAllDatabases(async (connection) => {
            await getPricelistModel(connection).updateMany({ published: true }, { published: false });
            return [];
        }, 'pricelists-unpublish');
        // 6. Save new pricelist
        const { result: pricelist } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
            const doc = new (getPricelistModel(connection))({
                sourceFileName: file.originalname,
                rawExcelFileUrl,
                structuredItems,
                generatedHtml,
                parsedHtml: generatedHtml, // Backward compatibility
                uploadedAt: new Date(),
                published: true,
                dbIndex,
            });
            await doc.save();
            return doc;
        }, 'pricelist');
        logInfo('Publish pricelist', `Published Excel pricelist: ${pricelist.sourceFileName} with ${structuredItems.length} items`);
        res.status(201).json(pricelist.toJSON());
    }
    catch (error) {
        logError('Publish pricelist', error);
        const message = error instanceof Error ? error.message : 'حدث خطأ في معالجة قائمة الأسعار';
        res.status(500).json({ error: message });
    }
});
export default router;
