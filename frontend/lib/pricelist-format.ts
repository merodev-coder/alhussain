/**
 * Shared formatting rules for the price list (on-screen table and PDF).
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

/**
 * "Core i5 (5th Gen)" -> { name: "Core i5", generation: "الجيل الخامس" }
 * Anything without a recognisable generation keeps its text and an empty generation.
 */
export function splitCpu(cpu: string | undefined | null): { name: string; generation: string } {
  const raw = String(cpu || '').replace(/\s+/g, ' ').trim()
  if (!raw) return { name: '', generation: '' }

  const genRegex = /\(?\s*(\d{1,2})\s*(?:st|nd|rd|th)\s*Gen(?:eration)?\s*\)?/i
  const match = raw.match(genRegex)
  if (!match) return { name: raw, generation: '' }

  const num = parseInt(match[1], 10)
  const word = ARABIC_ORDINALS[num]
  const name = raw.replace(genRegex, '').replace(/\s+/g, ' ').trim()
  return { name, generation: word ? `الجيل ${word}` : match[0].replace(/[()]/g, '').trim() }
}

const INTEGRATED_GPU = /^intel\b|\buhd\b|\biris\b|\bhd graphics\b|\bradeon graphics\b|\bvega\s*\d+\b/i

/**
 * Splits a GPU string into the chip name (line 1) and its VRAM (line 2).
 * Integrated GPUs always show "1GB - 2GB".
 *
 *   "Intel HD 5500 — 0G→2G"        -> { name: "Intel HD 5500", vram: "1GB - 2GB" }
 *   "AMD HD 8470M - 1GB إلى 8 GB"  -> { name: "AMD HD 8470M",  vram: "1GB - 8GB" }
 *   "AMD 7620 - Up to 8GB"         -> { name: "AMD 7620",      vram: "Up to 8GB" }
 *   "NVIDIA Quadro K2200 4GB"      -> { name: "NVIDIA Quadro K2200", vram: "4GB" }
 */
export function splitGpu(gpu: string | undefined | null): { name: string; vram: string } {
  const raw = String(gpu || '').replace(/\s+/g, ' ').trim()
  if (!raw) return { name: '', vram: '' }

  const integrated = INTEGRATED_GPU.test(raw)

  // Range: "0G→2G", "1GB إلى 8 GB", "1GB-4GB", "1GB to 4GB"
  const range = /(\d+)\s*G(?:B)?\s*(?:→|->|—|–|-|إلى|الى|to)\s*(\d+)\s*G(?:B)?/i
  const upTo = /up\s*to\s*(\d+)\s*G(?:B)?/i
  const single = /(\d+)\s*G(?:B)?\b/i

  let vram = ''
  let cut = raw

  const r = raw.match(range)
  const u = raw.match(upTo)
  const s = raw.match(single)
  if (r) {
    vram = `${r[1]}GB - ${r[2]}GB`
    cut = raw.slice(0, r.index)
  } else if (u) {
    vram = `Up to ${u[1]}GB`
    cut = raw.slice(0, u.index)
  } else if (s) {
    vram = `${s[1]}GB`
    cut = raw.slice(0, s.index)
  }

  const name = cut.replace(/[\s—–\-→,]+$/g, '').trim() || raw

  if (integrated) vram = '1GB - 2GB'
  return { name, vram }
}

/** English digits with thousands separators: 4500 -> "4,500" */
export function formatPrice(price: number | undefined | null): string {
  return Number(price || 0).toLocaleString('en-US')
}
