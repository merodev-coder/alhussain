/**
 * Builds a safe MongoDB filter for free-text store search.
 *
 * - Escapes regex special characters (so "Core i7 (" or "c++" never crash the query)
 * - Splits the text into words; EVERY word must match at least one field,
 *   so "hp i7 16gb" finds a laptop whose name has "hp" and whose cpu/ram match the rest
 * - Understands Arabic-Indic digits (٣٠٠٠٠ -> 30000)
 */
const ARABIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeSearchText(text: string): string {
  return text
    .replace(/[٠-٩]/g, d => ARABIC_DIGITS[d] ?? d)
    .replace(/[\u064B-\u065F\u0640]/g, '') // Arabic diacritics / tatweel
    .trim()
    .slice(0, 100)
}

export function buildSearchFilter(
  rawSearch: string,
  fields: string[],
  options: { numericField?: string } = {}
): Record<string, unknown> | null {
  const normalized = normalizeSearchText(rawSearch)
  if (!normalized) return null

  const words = normalized.split(/\s+/).filter(Boolean).slice(0, 8)
  if (words.length === 0) return null

  const perWord = words.map(word => {
    const or: Record<string, unknown>[] = fields.map(field => ({
      [field]: { $regex: escapeRegex(word), $options: 'i' },
    }))
    const num = Number(word.replace(/,/g, ''))
    if (options.numericField && Number.isFinite(num) && num > 0) {
      or.push({ [options.numericField]: num })
    }
    return { $or: or }
  })

  return perWord.length === 1 ? perWord[0] : { $and: perWord }
}
