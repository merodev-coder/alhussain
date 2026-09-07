import { z } from 'zod'
import type { StructuredLaptopItem } from '../models/Pricelist.js'
import { logError, logInfo } from './logger.js'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

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
 * using Groq in sequential batches of ~40 rows.
 * If any batch fails, an error is thrown immediately to prevent partial publishing.
 */
export async function normalizePricelistWithGroq(
  rawRows: Record<string, any>[]
): Promise<StructuredLaptopItem[]> {
  if (!rawRows || rawRows.length === 0) {
    return []
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('مفتاح GROQ_API_KEY غير مهيأ في الخادم. يرجى إضافته في ملف الإعدادات البيئية.')
  }

  const BATCH_SIZE = 40
  const allStructuredItems: StructuredLaptopItem[] = []

  logInfo(
    'Groq Normalization',
    `Starting sequential normalization for ${rawRows.length} rows in batches of ${BATCH_SIZE}`
  )

  for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
    const batch = rawRows.slice(i, i + BATCH_SIZE)
    const startIndex = i + 1
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(rawRows.length / BATCH_SIZE)

    logInfo(
      'Groq Normalization',
      `Processing batch ${batchNumber}/${totalBatches} (${batch.length} rows) sequentially`
    )

    try {
      const batchResults = await processBatchWithGroq(batch, startIndex, apiKey)
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

  logInfo('Groq Normalization', `Successfully normalized all ${allStructuredItems.length} items`)
  return allStructuredItems
}

/**
 * Process a single batch using Groq with model fallback:
 * Primary: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
 * Fallback chain: qwen/qwen3.6-27b, openai/gpt-oss-120b, openai/gpt-oss-20b, groq/compound, groq/compound-mini
 * No external search grounding tool is used; relies purely on internal knowledge.
 */
async function processBatchWithGroq(
  batchRows: Record<string, any>[],
  startIndex: number,
  apiKey: string
): Promise<StructuredLaptopItem[]> {
  const primaryModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'

  const prompt = `
You are an expert laptop hardware specialist and data engineer for "Al-Hussain Laptops" (شركة الحسين للابتوبات) in Egypt.
Your task is to take raw rows parsed from an uploaded Excel pricelist and normalize them into a strictly typed JSON array, matching EXACTLY the format used in the company's official clean pricelist template.

### Target Schema per Laptop Item (return ONLY these keys):
{
  "index": number (sequence row number, starting from ${startIndex}),
  "model": string (Brand + model merged into ONE string, brand first, e.g. "HP 645 G1", "DELL 5590", "HP ZBOOK G5 17". Brand must be normalized: "HP" (not "Hp"/"hp"), "DELL" (not "Dell"/"dell"), "Lenovo", "Asus", "Acer", "MSI", "Apple", "Toshiba", "Fujitsu"),
  "cpu": string (Format EXACTLY as "Family Suffix  (Nth Gen)" with TWO spaces before the parenthesis, e.g. "Core i5  (4th Gen)", "Core i7 HQ  (6th Gen)", "Xeon E3-1505M  (7th Gen)", "AMD A10-5300  (5th Gen)", "Ryzen 5  (10th Gen)". Use "Core i3/i5/i7/i9" for Intel consumer chips, "Xeon <model>" for workstation chips, "AMD A-series/Ryzen" for AMD),
  "ram": string (Number + capital "G" ONLY, no "B", e.g. "8G", "16G", "32G" — never "8GB"),
  "storage": string (Format "NNN GB TYPE" e.g. "500 GB HDD", "256 GB SSD", "512 GB SSD". If two drives are listed combine as "256+500 GB" with no type suffix),
  "screen": string (Size in inches with a trailing double-quote character, e.g. "14.1\\"", "15.6\\"", "17.3\\"", "13.3\\""),
  "gpu": string (Format "Brand Chip — MinG→MaxG" using an em dash " — " and arrow "→", e.g. "Intel HD 620 — 1G→2G", "N.VIDIA M1000 — 2G→20G", "AMD HD R7 — 2G→12G", "Intel UHD — 1G→2G". Use "N.VIDIA" (not "NVIDIA"/"Nvidia") for Nvidia chips. MinG is the base/shared VRAM, MaxG is the max shared/dedicated VRAM this chip can use — infer both from your internal knowledge of the exact chip),
  "price": number (Pure numeric EGP price, no symbols or text),
  "category": string (Exactly one of: "Budget Range | الفئة الاقتصادية", "Mid Range | الفئة المتوسطة", "Premium Range | الفئة المتميزة" — choose based on price tier and overall spec level, do not invent other category names),
  "flagged": boolean (true ONLY if critical data was missing, price is 0/invalid, or specs could not be reliably inferred),
  "flagReason": string (Arabic explanation if flagged, e.g. "السعر غير محدد" or "تم استنتاج كارت الشاشة بحاجة لمراجعة", else "")
}

### Strict Rules:
1. Model normalization:
   - Merge brand + model into a single "model" field exactly as shown in the schema examples above — do NOT output brand and model as separate fields.
   - Strip duplicated specs, extra symbols, or stray whitespace from the model string.
2. CPU / GPU inference:
   - If CPU generation, GPU chip, or screen size is missing or ambiguous in the raw row, use your internal laptop hardware knowledge to infer the correct standard value for that exact model.
   - If confident, fill the value and keep "flagged": false.
   - If genuinely uncertain, fill your best estimate, set "flagged": true, and explain in Arabic in "flagReason".
3. Price:
   - Parse into a pure integer. If price cannot be determined or is 0, set "price": 0, "flagged": true, "flagReason": "السعر مفقود أو غير صالح".
4. Category assignment:
   - Assign category per item based on price/spec tier, using the exact three category strings above — do not leave category empty and do not create new tiers.
5. Output:
   - Return ONLY valid JSON — no markdown fences, no commentary.
   - Return a JSON object of the shape {"items": [...]} containing exactly ${batchRows.length} elements, one per input row, in the same order.
   - IMPORTANT: Your response must be valid JSON only. Do not include any text before or after the JSON.

Input Raw Rows:
${JSON.stringify(batchRows, null, 2)}

Respond with JSON only:
`

  let responseText = ''

  // List of fallback models to try in order
  const fallbackModels = [
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'groq/compound',
    'groq/compound-mini'
  ]

  try {
    responseText = await callGroq(primaryModel, prompt, apiKey)
  } catch (primaryError: any) {
    logError(
      `Primary model (${primaryModel}) failed. Error: ${primaryError?.message || primaryError}. Attempting fallback models.`,
      primaryError
    )

    // Try each fallback model
    for (const fallbackModel of fallbackModels) {
      if (fallbackModel === primaryModel) continue
      
      try {
        logError(`Attempting fallback to ${fallbackModel}`, null)
        responseText = await callGroq(fallbackModel, prompt, apiKey)
        logError(`Successfully used fallback model ${fallbackModel}`, null)
        break
      } catch (fallbackError: any) {
        logError(`Fallback model ${fallbackModel} also failed: ${fallbackError?.message || fallbackError}`, fallbackError)
        continue
      }
    }

    if (!responseText) {
      throw primaryError
    }
  }

  if (!responseText) {
    throw new Error('لم يتم استلام استجابة صالحة من نموذج Groq')
  }

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
    logError('Failed to parse Groq JSON output', err)
    logError('Raw response that failed to parse', responseText.substring(0, 500))
    throw new Error('فشل قراءة استجابة الذكاء الاصطناعي كـ JSON')
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
      logInfo('Groq row validation flagged', `Row ${rowIndex} flagged: ${validationMessages}`)

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
 * Calls the Groq OpenAI-compatible chat completions endpoint and returns
 * the raw text content of the response.
 */
async function callGroq(model: string, prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Groq API error (${res.status}): ${errBody || res.statusText}`)
  }

  const data: any = await res.json()
  return data?.choices?.[0]?.message?.content || ''
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
