import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/genai'
import type { StructuredLaptopItem } from '../models/Pricelist.js'
import { logError, logInfo } from './logger.js'

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
})

/**
 * Normalizes an array of raw row objects parsed from an Excel sheet
 * using Gemini in sequential batches of ~40 rows.
 * If any batch fails, an error is thrown immediately to prevent partial publishing.
 */
export async function normalizePricelistWithGemini(
  rawRows: Record<string, any>[]
): Promise<StructuredLaptopItem[]> {
  if (!rawRows || rawRows.length === 0) {
    return []
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('مفتاح GEMINI_API_KEY غير مهيأ في الخادم. يرجى إضافته في ملف الإعدادات البيئية.')
  }

  const BATCH_SIZE = 40
  const allStructuredItems: StructuredLaptopItem[] = []

  logInfo(
    'Gemini Normalization',
    `Starting sequential normalization for ${rawRows.length} rows in batches of ${BATCH_SIZE}`
  )

  for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
    const batch = rawRows.slice(i, i + BATCH_SIZE)
    const startIndex = i + 1
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(rawRows.length / BATCH_SIZE)

    logInfo(
      'Gemini Normalization',
      `Processing batch ${batchNumber}/${totalBatches} (${batch.length} rows) sequentially`
    )

    try {
      const batchResults = await processBatchWithGemini(batch, startIndex, apiKey)
      allStructuredItems.push(...batchResults)
    } catch (batchErr) {
      logError(`Failed in batch ${batchNumber}`, batchErr)
      const detail = batchErr instanceof Error ? batchErr.message : 'خطأ غير معروف'
      throw new Error(`فشلت معالجة الدفعة ${batchNumber} من قائمة الأسعار: ${detail}`)
    }

    // Delay 500ms between batches to stay comfortably within rate limits
    if (i + BATCH_SIZE < rawRows.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  logInfo('Gemini Normalization', `Successfully normalized all ${allStructuredItems.length} items`)
  return allStructuredItems
}

/**
 * Process a single batch using Gemini with model fallback:
 * Primary: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
 * Fallback: 'gemini-2.5-flash-lite'
 */
async function processBatchWithGemini(
  batchRows: Record<string, any>[],
  startIndex: number,
  apiKey: string
): Promise<StructuredLaptopItem[]> {
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const fallbackModel = 'gemini-2.5-flash-lite'

  const prompt = `
You are an expert laptop hardware specialist and data engineer for "Al-Hussain Laptops" (شركة الحسين للابتوبات) in Egypt.
Your task is to take raw rows parsed from an uploaded Excel pricelist and normalize them into a strictly typed JSON array, matching EXACTLY the format used in the company's official clean pricelist template.

### Target Schema per Laptop Item (return ONLY these keys):
{
  "index": number (sequence row number, starting from ${startIndex}),
  "model": string (Brand + model merged into ONE string, brand first, e.g. "HP 645 G1", "DELL 5590". Normalize brand: "HP", "DELL", "Lenovo", "Asus", "Acer", "MSI", "Apple", "Toshiba", "Fujitsu"),
  "cpu": string (Format EXACTLY as "Family Suffix  (Nth Gen)" with TWO spaces before the parenthesis, e.g. "Core i5  (4th Gen)", "Xeon E3-1505M  (7th Gen)", "AMD A10-5300  (5th Gen)", "Ryzen 5  (10th Gen)"),
  "ram": string (Number + capital "G" only, no "B", e.g. "8G", "16G" — never "8GB"),
  "storage": string ("NNN GB TYPE" e.g. "500 GB HDD", "256 GB SSD". Two drives: "256+500 GB"),
  "screen": string (Inches with trailing double-quote, e.g. "14.1\"", "15.6\""),
  "gpu": string (Format "Brand Chip — MinG→MaxG" with em dash and arrow, e.g. "Intel HD 620 — 1G→2G", "N.VIDIA M1000 — 2G→20G". Use "N.VIDIA" not "NVIDIA"/"Nvidia"),
  "price": number (Pure integer EGP, no symbols),
  "category": string (Exactly one of: "Budget Range | الفئة الاقتصادية", "Mid Range | الفئة المتوسطة", "Premium Range | الفئة المتميزة"),
  "flagged": boolean (true only if critical data missing/unreliable),
  "flagReason": string (Arabic explanation if flagged, else "")
}

### Handling placeholder / ambiguous GPU values:
Raw rows may contain a placeholder instead of a real GPU name — e.g. "vg", "VGA", "vg4", "vg 6g", "vg 8g". These mean "this laptop has a dedicated (non-integrated) graphics card," not a real chip name.
When you see one of these:
1. Identify the exact laptop model and CPU generation from the row.
2. Use your internal knowledge of that model's spec sheet to determine which dedicated GPU it actually ships with.
3. If the placeholder includes a VRAM number (e.g. "vg 6g", "vg4" = 4G), use it to pick the correct variant among the model's known dedicated GPU options.
4. Output the resolved chip in the normal "Brand Chip — MinG→MaxG" format.
5. If it truly cannot be narrowed down even with the VRAM hint, output your single best guess, set "flagged": true, and explain in Arabic in "flagReason".
6. Never output the literal placeholder text as the final GPU value.
7. Plain "INTEL" or "AMD" with no VRAM hint means integrated graphics — infer the correct integrated GPU generation from the CPU as usual.

### Strict Rules:
1. Merge brand + model into a single "model" field — do NOT output brand and model as separate fields.
2. If CPU generation, GPU chip, or screen size is missing or ambiguous, infer from internal knowledge; if genuinely uncertain, best-guess + flag + Arabic reason.
3. Price: pure integer; if 0/invalid, set price 0, flagged true, flagReason "السعر مفقود أو غير صالح".
4. Assign category using exactly the three strings above based on price/spec tier.
5. Return ONLY valid JSON — no markdown fences, no commentary. Return {"items": [...]} with exactly ${batchRows.length} elements, one per input row, in order.

Input Raw Rows:
${JSON.stringify(batchRows, null, 2)}
`

  let responseText = ''

  try {
    responseText = await callGemini(primaryModel, prompt, apiKey)
  } catch (primaryError: any) {
    logError(
      `Primary model (${primaryModel}) failed. Error: ${primaryError?.message || primaryError}. Attempting fallback to ${fallbackModel}`,
      primaryError
    )

    if (primaryModel !== fallbackModel) {
      responseText = await callGemini(fallbackModel, prompt, apiKey)
    } else {
      throw primaryError
    }
  }

  if (!responseText) {
    throw new Error('لم يتم استلام استجابة صالحة من نموذج Gemini')
  }

  // Log the raw response for debugging
  logInfo('Raw Gemini response length', `${responseText.length} characters`)
  logInfo('Raw Gemini response preview', responseText.substring(0, 200))

  let cleanedJson = responseText.trim()
  
  // Try to extract JSON from markdown code blocks
  if (cleanedJson.startsWith('```json')) {
    cleanedJson = cleanedJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  } else if (cleanedJson.startsWith('```')) {
    cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  
  // Try to find JSON object boundaries in case of extra text
  const firstBrace = cleanedJson.indexOf('{')
  const lastBrace = cleanedJson.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1)
  }

  // Try to find JSON array boundaries if object extraction didn't work
  if (cleanedJson === responseText.trim()) {
    const firstBracket = cleanedJson.indexOf('[')
    const lastBracket = cleanedJson.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanedJson = cleanedJson.substring(firstBracket, lastBracket + 1)
    }
  }

  logInfo('Cleaned JSON for parsing', cleanedJson.substring(0, 200))

  let rawList: any[]
  try {
    const parsed = JSON.parse(cleanedJson)
    if (Array.isArray(parsed)) {
      rawList = parsed
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).items)) {
      rawList = (parsed as any).items
    } else {
      throw new Error('الاستجابة الناتجة ليست مصفوفة JSON صالحة')
    }
  } catch (err) {
    logError('Failed to parse Gemini JSON output', err)
    logError('Full raw response that failed to parse', responseText)
    logError('Cleaned JSON that failed to parse', cleanedJson)
    
    // Fallback: create basic items from raw rows if JSON parsing fails
    logInfo('Using fallback to create basic items from raw rows', `Processing ${batchRows.length} rows`)
    rawList = batchRows.map((row, idx) => ({
      index: startIndex + idx,
      model: String(row.model || row.Model || row['الموديل'] || 'Unknown').trim(),
      cpu: String(row.cpu || row.CPU || row['المعالج'] || '').trim(),
      ram: String(row.ram || row.RAM || row['الرام'] || '').trim(),
      storage: String(row.storage || row.Storage || row['التخزين'] || '').trim(),
      screen: String(row.screen || row.Screen || row['الشاشة'] || '').trim(),
      gpu: String(row.gpu || row.GPU || row['كارت الشاشة'] || '').trim(),
      price: Number(row.price || row.Price || row['السعر'] || 0),
      category: String(row.category || row.Category || '').trim(),
      flagged: true,
      flagReason: 'فشل معالجة الذكاء الاصطناعي - البيانات الأولية'
    }))
  }

  // Validate each item with Zod schema and handle validation failures gracefully
  const validatedItems: StructuredLaptopItem[] = []

  for (let idx = 0; idx < rawList.length; idx++) {
    const rawItem = rawList[idx]
    const fallbackRow = batchRows[idx] || {}
    const rowIndex = startIndex + idx

    // The AI now returns a merged "model" string only; derive brand/name for
    // backward compatibility with the rest of the app (Pricelist model, etc.)
    const mergedModel = String(rawItem?.model || '').trim()
    const derivedBrand = mergedModel.split(/\s+/)[0] || ''
    const normalizedItem = {
      ...rawItem,
      brand: rawItem?.brand || derivedBrand,
      model: mergedModel,
      name: rawItem?.name || mergedModel,
    }

    const parseResult = StructuredLaptopItemSchema.safeParse(normalizedItem)
    if (parseResult.success) {
      const item = parseResult.data
      item.index = item.index || rowIndex
      if (!item.name) {
        item.name = `${item.brand} ${item.model}`.trim() || `لابتوب صف ${rowIndex}`
      }
      validatedItems.push(item)
    } else {
      const validationMessages = parseResult.error.issues.map(iss => iss.message).join('، ')
      logInfo('Gemini row validation flagged', `Row ${rowIndex} flagged: ${validationMessages}`)

      const fbBrand =
        String(fallbackRow.brand || fallbackRow.Brand || fallbackRow['الماركة'] || '').trim() ||
        derivedBrand
      const fbModel =
        mergedModel ||
        String(fallbackRow.model || fallbackRow.Model || fallbackRow['الموديل'] || '').trim()

      validatedItems.push({
        index: rowIndex,
        brand: fbBrand,
        model: fbModel,
        name: fbModel || `صف ${rowIndex}`,
        cpu: String(rawItem?.cpu || fallbackRow.cpu || fallbackRow.CPU || fallbackRow['المعالج'] || '').trim(),
        ram: String(rawItem?.ram || fallbackRow.ram || fallbackRow.RAM || fallbackRow['الرام'] || '').trim(),
        storage: String(rawItem?.storage || fallbackRow.storage || fallbackRow.Storage || fallbackRow['التخزين'] || '').trim(),
        screen: String(rawItem?.screen || fallbackRow.screen || fallbackRow.Screen || fallbackRow['الشاشة'] || '').trim(),
        gpu: String(rawItem?.gpu || fallbackRow.gpu || fallbackRow.GPU || fallbackRow['كارت الشاشة'] || '').trim(),
        price: Number(rawItem?.price || fallbackRow.price || fallbackRow.Price || fallbackRow['السعر'] || 0),
        category: String(rawItem?.category || fallbackRow.category || '').trim(),
        flagged: true,
        flagReason: `فشل التحقق من البيانات: ${validationMessages}`,
      })
    }
  }

  return validatedItems
}

/**
 * Calls the Gemini API and returns the raw text content of the response.
 */
async function callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel({ 
    model,
    generationConfig: {
      responseMimeType: 'application/json',
    }
  })

  const result = await geminiModel.generateContent(prompt)
  const response = result.response
  return response.text()
}

/**
 * Builds a clean HTML table from structured laptop items with RTL styling
 * compatible with the public storefront page.
 */
export function generatePricelistHtml(items: StructuredLaptopItem[]): string {
  if (!items || items.length === 0) {
    return '<p class="text-center py-6 text-ink-muted">لا توجد عناصر في قائمة الأسعار</p>'
  }

  let html = '<div class="pricelist-table-wrapper overflow-x-auto"><table dir="rtl" class="pricelist-table w-full text-right border-collapse">'
  html += '<thead><tr>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">#</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">الموديل</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">المعالج (CPU)</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">الذاكرة (RAM)</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">التخزين (Storage)</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">الشاشة</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">كارت الشاشة (GPU)</th>'
  html += '<th style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; background-color: var(--surface-color, #f5f5f5); font-weight: 600;">السعر (جنيه)</th>'
  html += '</tr></thead>'
  html += '<tbody>'

  let currentCategory = ''

  items.forEach((item, idx) => {
    if (item.category && item.category !== currentCategory) {
      currentCategory = item.category
      html += `<tr><td colspan="8" style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.6rem 0.75rem; background-color: var(--surface-2, #ececec); font-weight: 700; color: #0FC7C1;">${escapeHtml(currentCategory)}</td></tr>`
    }

    const rowNum = item.index ?? idx + 1
    const priceFormatted = Number(item.price || 0).toLocaleString('ar-EG')

    html += '<tr>'
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; font-weight: 500;">${rowNum}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; font-weight: 600;">${escapeHtml(item.name || `${item.brand} ${item.model}`.trim())}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.cpu || '-')}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.ram || '-')}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.storage || '-')}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.screen || '-')}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem;">${escapeHtml(item.gpu || '-')}</td>`
    html += `<td style="border: 1px solid var(--hairline-color, #e0e0e0); padding: 0.75rem; font-weight: 700; color: #0FC7C1; white-space: nowrap;">${priceFormatted} ج.م</td>`
    html += '</tr>'
  })

  html += '</tbody></table></div>'
  return html
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}