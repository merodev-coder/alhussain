/**
 * Normalizes the VRAM range shown for integrated Intel graphics.
 *
 * Business rule: any Intel-branded (i.e. integrated) GPU string should always
 * display a "1G→2G" VRAM range, regardless of what range was originally
 * parsed/generated (e.g. "0G→2G", "0G→4G", etc.).
 *
 * Dedicated/discrete GPUs (AMD Radeon, N.VIDIA, ...) are left untouched.
 *
 * Examples:
 *   "Intel HD 5500 — 0G→2G"  -> "Intel HD 5500 — 1G→2G"
 *   "Intel UHD 620 — 0G→4G"  -> "Intel UHD 620 — 1G→2G"
 *   "Intel Iris Xe — 0G→8G"  -> "Intel Iris Xe — 1G→2G"
 *   "Intel HD 620"           -> "Intel HD 620 — 1G→2G"
 *   "AMD Radeon R7 M260 — 1G→4G" -> unchanged (not Intel)
 */
export function normalizeIntegratedGpuVram(gpu: string | undefined | null): string {
  if (!gpu) return gpu || ''
  const trimmed = String(gpu).trim()
  if (!trimmed) return trimmed

  const isIntel = /^intel\b/i.test(trimmed)
  if (!isIntel) return trimmed

  // Take everything before an em-dash / hyphen separator as the chip name.
  let chipPart = trimmed.split(/\s*[—–-]\s*(?=\d)/)[0]

  // Safety net: also strip a trailing "NG->NG" / "NG→NG" pattern even if it
  // wasn't preceded by a dash (in case of inconsistent formatting).
  chipPart = chipPart.replace(/\s*\d+\s*G\s*(?:→|->)\s*\d+\s*G\s*$/i, '').trim()
  // Also strip a lone trailing dash left over after removing the range.
  chipPart = chipPart.replace(/[—–-]\s*$/, '').trim()

  return `${chipPart} — 1G→2G`
}

/**
 * Applies normalizeIntegratedGpuVram to every item's `gpu` field, returning a
 * new array (does not mutate the input).
 */
export function normalizeItemsGpuVram<T extends { gpu?: string }>(items: T[]): T[] {
  return items.map(item => ({
    ...item,
    gpu: normalizeIntegratedGpuVram(item.gpu),
  }))
}
