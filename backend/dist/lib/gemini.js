import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { logError, logInfo } from './logger.js';
export const StructuredLaptopItemSchema = z.object({
    index: z.number().optional(),
    brand: z.string().trim().default(''),
    model: z.string().trim().default(''),
    name: z.string().trim().min(1, 'اسم الجهاز مطلوب'),
    cpu: z.string().trim().default(''),
    ram: z.string().trim().default(''),
    storage: z.string().trim().default(''),
    screen: z.string().trim().default(''),
    gpu: z.string().trim().default(''),
    price: z.coerce.number().nonnegative().default(0),
    category: z.string().trim().optional().default(''),
    flagged: z.boolean().default(false),
    flagReason: z.string().trim().optional().default(''),
});
/**
 * Normalizes an array of raw row objects parsed from an Excel sheet
 * using Gemini 2.5 Flash in batches of ~40 rows.
 */
export async function normalizePricelistWithGemini(rawRows) {
    if (!rawRows || rawRows.length === 0) {
        return [];
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('مفتاح GEMINI_API_KEY غير مهيأ في الخادم. يرجى إضافته في ملف الإعدادات البيئية.');
    }
    const BATCH_SIZE = 40;
    const allStructuredItems = [];
    logInfo('Gemini Normalization', `Starting normalization for ${rawRows.length} rows in batches of ${BATCH_SIZE}`);
    for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
        const batch = rawRows.slice(i, i + BATCH_SIZE);
        const startIndex = i + 1;
        logInfo('Gemini Normalization', `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)`);
        const batchResults = await processBatchWithGemini(batch, startIndex, apiKey);
        allStructuredItems.push(...batchResults);
    }
    logInfo('Gemini Normalization', `Successfully normalized ${allStructuredItems.length} items`);
    return allStructuredItems;
}
/**
 * Process a single batch with Gemini 2.5 Flash with fallback handling.
 */
async function processBatchWithGemini(batchRows, startIndex, apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert laptop hardware specialist and data engineer for "Al-Hussain Laptops" (شركة الحسين للابتوبات) in Egypt.
Your task is to take raw rows parsed from an uploaded Excel pricelist and normalize them into a strictly typed, clean JSON array of laptop items.

### Target Schema per Laptop Item:
{
  "index": number (sequence row number, starting from ${startIndex}),
  "brand": string (Standardized brand: "HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "MSI", "Fujitsu", "Toshiba", etc.),
  "model": string (Clean model name, e.g. "EliteBook 840 G1", "Latitude 5580", "ThinkPad T480", "ZBook 15 G2", "645 G1"),
  "name": string (Full clean title: Brand + Model, e.g. "HP EliteBook 840 G1"),
  "cpu": string (Standardized processor name, e.g. "Intel Core i5-4300U (4th Gen)", "AMD A10-5300 (5th Gen)", "Intel Core i7-7820HQ"),
  "ram": string (Standardized RAM capacity, e.g. "8GB", "16GB", "32GB"),
  "storage": string (Standardized storage, e.g. "500GB HDD", "256GB SSD", "512GB NVMe SSD"),
  "screen": string (Standardized screen size, e.g. "14.1\"", "15.6\"", "17.3\"", "13.3\""),
  "gpu": string (Standardized graphics card, e.g. "Intel HD Graphics 620", "AMD Radeon HD 8470M - 2GB", "NVIDIA Quadro K1000M - 2GB"),
  "price": number (Clean numeric price in EGP, e.g. 5500. Must be a pure number, no text or currency symbols),
  "category": string (Section/tier header if present or implied, e.g. "الفئة الاقتصادية", "الفئة المتوسطة", "فئة الأعمال والجيمنج", or empty string ""),
  "flagged": boolean (Set to true IF AND ONLY IF critical data was missing, price is 0/invalid, or specs could not be reliably inferred),
  "flagReason": string (Arabic explanation if flagged, e.g. "السعر غير محدد" or "تم استنتاج كارت الشاشة والشاشة بحاجة لمراجعة", or empty string "" if all good)
}

### Strict Rules:
1. Normalization:
   - Normalize brand capitalization ("Hp", "hp" -> "HP", "DELL" -> "Dell", "lenovo" -> "Lenovo").
   - Strip messy symbols or duplicated specs from model names.
2. Inferences for Screen and GPU:
   - If "screen" or "gpu" is missing or empty in the raw row, use your extensive laptop catalog knowledge to infer the accurate standard screen size and GPU for that laptop model.
   - If you are confident in your inference, fill the inferred value and keep "flagged": false.
   - If you are genuinely uncertain or the model name is ambiguous, fill with your best estimate, set "flagged": true, and explain in "flagReason" (in Arabic).
3. Price:
   - Parse into a pure number. If price cannot be determined or is 0, set "price": 0, "flagged": true, "flagReason": "السعر مفقود أو غير صالح".
4. Output:
   - Return ONLY a JSON array with exactly ${batchRows.length} elements corresponding to the input rows.

Input Raw Rows:
${JSON.stringify(batchRows, null, 2)}
`;
    let responseText = '';
    try {
        // Attempt with search grounding enabled
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }],
            },
        });
        responseText = response.text || '';
    }
    catch (searchError) {
        logError('Gemini search grounding call failed, falling back to direct prompt', searchError);
        // Fallback without search grounding tool in case tools + json mode conflict
        const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        responseText = fallbackResponse.text || '';
    }
    if (!responseText) {
        throw new Error('لم يتم استلام استجابة صالحة من نموذج Gemini');
    }
    let cleanedJson = responseText.trim();
    if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    }
    else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    let rawList;
    try {
        rawList = JSON.parse(cleanedJson);
        if (!Array.isArray(rawList)) {
            if (rawList && typeof rawList === 'object' && Array.isArray(rawList.items)) {
                rawList = rawList.items;
            }
            else {
                throw new Error('الاستجابة الناتجة ليست مصفوفة JSON صالحة');
            }
        }
    }
    catch (err) {
        logError('Failed to parse Gemini JSON output', err);
        throw new Error('فشل قراءة استجابة الذكاء الاصطناعي كـ JSON');
    }
    // Validate each item with Zod schema and handle validation failures gracefully
    const validatedItems = [];
    for (let idx = 0; idx < rawList.length; idx++) {
        const rawItem = rawList[idx];
        const fallbackRow = batchRows[idx] || {};
        const rowIndex = startIndex + idx;
        const parseResult = StructuredLaptopItemSchema.safeParse(rawItem);
        if (parseResult.success) {
            const item = parseResult.data;
            item.index = item.index || rowIndex;
            // If name is empty, construct from brand + model
            if (!item.name) {
                item.name = `${item.brand} ${item.model}`.trim() || `لابتوب صف ${rowIndex}`;
            }
            validatedItems.push(item);
        }
        else {
            // Row failed validation: flag it instead of silently dropping
            const validationMessages = parseResult.error.issues.map(iss => iss.message).join('، ');
            logInfo('Gemini row validation flagged', `Row ${rowIndex} flagged: ${validationMessages}`);
            validatedItems.push({
                index: rowIndex,
                brand: String(rawItem?.brand || fallbackRow.brand || fallbackRow.Brand || fallbackRow['الماركة'] || '').trim(),
                model: String(rawItem?.model || fallbackRow.model || fallbackRow.Model || fallbackRow['الموديل'] || '').trim(),
                name: String(rawItem?.name || rawItem?.model || fallbackRow.Model || fallbackRow['الموديل'] || `صف ${rowIndex}`).trim(),
                cpu: String(rawItem?.cpu || fallbackRow.cpu || fallbackRow.CPU || fallbackRow['المعالج'] || '').trim(),
                ram: String(rawItem?.ram || fallbackRow.ram || fallbackRow.RAM || fallbackRow['الرام'] || '').trim(),
                storage: String(rawItem?.storage || fallbackRow.storage || fallbackRow.Storage || fallbackRow['التخزين'] || '').trim(),
                screen: String(rawItem?.screen || fallbackRow.screen || fallbackRow.Screen || fallbackRow['الشاشة'] || '').trim(),
                gpu: String(rawItem?.gpu || fallbackRow.gpu || fallbackRow.GPU || fallbackRow['كارت الشاشة'] || '').trim(),
                price: Number(rawItem?.price || fallbackRow.price || fallbackRow.Price || fallbackRow['السعر'] || 0),
                category: String(rawItem?.category || fallbackRow.category || '').trim(),
                flagged: true,
                flagReason: `فشل التحقق من البيانات: ${validationMessages}`,
            });
        }
    }
    return validatedItems;
}
/**
 * Builds a clean HTML table from structured laptop items with RTL styling
 * compatible with the public storefront page.
 */
export function generatePricelistHtml(items) {
    if (!items || items.length === 0) {
        return '<p class="text-center py-6 text-ink-muted">لا توجد عناصر في قائمة الأسعار</p>';
    }
    let html = '<div class="pricelist-table-wrapper overflow-x-auto"><table dir="rtl" class="pricelist-table w-full text-right border-collapse">';
    html += '<thead><tr>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">#</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">الموديل</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">المعالج (CPU)</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">الذاكرة (RAM)</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">التخزين (Storage)</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">الشاشة</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">كارت الشاشة (GPU)</th>';
    html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">السعر (جنيه)</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    let currentCategory = '';
    items.forEach((item, idx) => {
        if (item.category && item.category !== currentCategory) {
            currentCategory = item.category;
            html += `<tr><td colspan="8" style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.6rem 0.75rem; background-color: var(--surface-2, #ececec); font-weight: 700; color: #0FC7C1;">${escapeHtml(currentCategory)}</td></tr>`;
        }
        const rowNum = item.index ?? idx + 1;
        const priceFormatted = Number(item.price || 0).toLocaleString('ar-EG');
        html += '<tr>';
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; font-weight: 500;">${rowNum}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; font-weight: 600;">${escapeHtml(item.name || `${item.brand} ${item.model}`.trim())}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.cpu || '-')}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.ram || '-')}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.storage || '-')}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.screen || '-')}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.gpu || '-')}</td>`;
        html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; font-weight: 700; color: #0FC7C1; white-space: nowrap;">${priceFormatted} ج.م</td>`;
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
