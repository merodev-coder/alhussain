/**
 * Translates the CPU "generation" wording from English ("5th Gen") to Arabic
 * ("الجيل الخامس"), leaving the rest of the CPU string untouched.
 *
 * Examples:
 *   "Core i5  (5th Gen)"      -> "Core i5  (الجيل الخامس)"
 *   "Core i7 H  (8th Gen)"    -> "Core i7 H  (الجيل الثامن)"
 *   "AMD A10  (8th Gen)"      -> "AMD A10  (الجيل الثامن)"
 *   "Core i7  (4th Gen)"      -> "Core i7  (الجيل الرابع)"
 */

const ARABIC_ORDINALS: Record<number, string> = {
  1: 'الأول',
  2: 'الثاني',
  3: 'الثالث',
  4: 'الرابع',
  5: 'الخامس',
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
  11: 'الحادي عشر',
  12: 'الثاني عشر',
  13: 'الثالث عشر',
  14: 'الرابع عشر',
  15: 'الخامس عشر',
}

export function translateCpuGenerationToArabic(cpu: string | undefined | null): string {
  if (!cpu) return cpu || ''
  const value = String(cpu)

  return value.replace(/(\d{1,2})\s*(st|nd|rd|th)\s*Gen\b/gi, (match, numStr: string) => {
    const num = parseInt(numStr, 10)
    const word = ARABIC_ORDINALS[num]
    return word ? `الجيل ${word}` : match
  })
}
