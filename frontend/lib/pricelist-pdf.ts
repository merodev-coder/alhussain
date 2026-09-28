/**
 * Builds the price list PDF in the browser. It is called ONLY from the admin
 * dashboard ("نشر قائمة الأسعار"); the resulting file is uploaded to the backend
 * and customers download the stored copy instantly.
 *
 * Layout (left → right): photo · name · CPU · RAM · storage · screen · GPU · price
 */
import { splitCpu, splitGpu, formatPrice } from './pricelist-format'

export interface PricelistPdfItem {
  id: string
  name: string
  price: number
  photo: string | null
  cpu: string
  ram: string
  storage: string
  screen?: string
  gpu: string
}

/** Bump when the layout changes; shown in the admin dashboard after publishing. */
export const PDF_LAYOUT_VERSION = 'v4 · 15 لكل صفحة · مع حجم الشاشة'

// --- Page geometry (px are laid out at 1000px wide, then scaled to A4 width) ---
const PAGE_PX_WIDTH = 1000
// Page maths (A4, 6mm top/bottom margins, 10mm sides, 1000px == 190mm => 0.19mm per px):
//   usable height 285mm = 1500px
//   header 44px + 15 rows x 96px = 1484px  -> exactly 15 laptops per page
//   page 1: the title block is one row tall (96px) -> 14 laptops + title
const ROW_HEIGHT = 96
const HEADER_ROW_HEIGHT = 44
const TITLE_HEIGHT = ROW_HEIGHT
const COLUMNS = '170px 160px 140px 65px 100px 75px 170px 120px' // = 1000px
const PHOTO_W = 130
const PHOTO_H = 78

const HEADERS = ['الصورة', 'اسم الجهاز', 'المعالج', 'الرام', 'التخزين', 'حجم الشاشة', 'كارت الشاشة', 'السعر (ج.م)']

/** Fetch an image, downscale it and return a small JPEG data URL (keeps the PDF light). */
async function toSmallDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const bitmapUrl = URL.createObjectURL(blob)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = bitmapUrl
      })
      const maxW = PHOTO_W * 2
      const maxH = PHOTO_H * 2
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio))
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.82)
    } finally {
      URL.revokeObjectURL(bitmapUrl)
    }
  } catch {
    return null
  }
}

function el(tag: string, css: Partial<CSSStyleDeclaration> = {}, text?: string): HTMLDivElement {
  const node = document.createElement(tag) as HTMLDivElement
  Object.assign(node.style, css)
  if (text !== undefined) node.textContent = text
  return node
}

function textCell(lines: Array<{ text: string; rtl?: boolean; muted?: boolean; bold?: boolean }>): HTMLDivElement {
  const cell = el('div', {
    padding: '0 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // vertical centre
    alignItems: 'center', // horizontal centre
    gap: '4px',
    height: '100%',
    textAlign: 'center',
    overflow: 'hidden',
  })
  const visible = lines.filter(l => l.text)
  if (visible.length === 0) visible.push({ text: '—', muted: true })
  visible.forEach(l => {
    const line = el(
      'div',
      {
        fontSize: l.muted ? '12px' : '14px',
        fontWeight: l.bold ? '700' : '500',
        color: l.muted ? '#64748b' : '#1e293b',
        lineHeight: '1.35',
        direction: l.rtl ? 'rtl' : 'ltr',
        textAlign: 'center',
        alignSelf: 'stretch',
      },
      l.text
    )
    cell.appendChild(line)
  })
  return cell
}

export async function buildPricelistPdf(
  items: PricelistPdfItem[],
  updatedAt: Date,
  onProgress?: (done: number, total: number, phase: 'render' | 'assemble') => void
): Promise<{ blob: Blob; pages: number }> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas-pro'),
  ])

  const photoDataUrls = await Promise.all(
    items.map(item => (item.photo ? toSmallDataUrl(item.photo) : Promise.resolve(null)))
  )

  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(updatedAt)

  // Off-screen stage
  const stage = el('div', {
    position: 'fixed',
    top: '0',
    left: '-99999px',
    zIndex: '-1',
    width: `${PAGE_PX_WIDTH}px`,
    background: '#ffffff',
    color: '#0f172a',
    fontFamily: "'Cairo', 'Tajawal', Arial, sans-serif",
    direction: 'ltr',
  })
  document.body.appendChild(stage)

  try {
    // Title block (compact so page 1 still gets 11 laptops)
    const title = el('div', {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      direction: 'rtl',
      padding: '0 4px',
      height: `${TITLE_HEIGHT}px`,
      borderBottom: '2px solid #e2e8f0',
      boxSizing: 'border-box',
    })
    const titleRight = el('div')
    titleRight.appendChild(el('div', { fontSize: '26px', fontWeight: '800', color: '#0f172a' }, 'الحسين للاب توب'))
    titleRight.appendChild(
      el('div', { fontSize: '13px', color: '#64748b', marginTop: '4px' }, `تاريخ التحديث: ${formattedDate}`)
    )
    title.appendChild(titleRight)
    title.appendChild(
      el(
        'div',
        {
          background: '#0f766e1a',
          color: '#0f766e',
          fontWeight: '700',
          fontSize: '13px',
          padding: '6px 14px',
          borderRadius: '999px',
        },
        'قائمة الأسعار المحدثة'
      )
    )
    stage.appendChild(title)

    // Table header (photo → price, left to right)
    const headerRow = el('div', {
      display: 'grid',
      gridTemplateColumns: COLUMNS,
      alignItems: 'center',
      height: `${HEADER_ROW_HEIGHT}px`,
      background: '#0f172a',
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '14px',
      borderRadius: '14px 14px 0 0',
      overflow: 'hidden',
      direction: 'ltr',
    })
    HEADERS.forEach((label, i) => {
      const cell = el(
        'div',
        {
          padding: '0 10px',
          direction: 'rtl',
          textAlign: 'center',
        },
        label
      )
      headerRow.appendChild(cell)
    })
    stage.appendChild(headerRow)

    // Product rows (fixed height => predictable rows per page)
    const rowElements: HTMLDivElement[] = items.map((item, idx) => {
      const isLast = idx === items.length - 1
      const row = el('div', {
        display: 'grid',
        gridTemplateColumns: COLUMNS,
        alignItems: 'stretch',
        height: `${ROW_HEIGHT}px`,
        boxSizing: 'border-box',
        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        direction: 'ltr',
        borderRadius: isLast ? '0 0 14px 14px' : '0',
        overflow: 'hidden',
      })

      // Photo — wider, shorter, with side margins
      const photoCell = el('div', {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      })
      const box = el('div', {
        width: `${PHOTO_W}px`,
        height: `${PHOTO_H}px`,
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: '0',
      })
      const dataUrl = photoDataUrls[idx]
      if (dataUrl) {
        const img = document.createElement('img')
        img.src = dataUrl
        Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'contain' })
        box.appendChild(img)
      }
      photoCell.appendChild(box)
      row.appendChild(photoCell)

      // Name
      row.appendChild(textCell([{ text: item.name, bold: true }]))

      // CPU (name, then Arabic generation underneath)
      const cpu = splitCpu(item.cpu)
      row.appendChild(textCell([{ text: cpu.name }, { text: cpu.generation, rtl: true, muted: true }]))

      // RAM / Storage
      row.appendChild(textCell([{ text: item.ram }]))
      row.appendChild(textCell([{ text: item.storage }]))

      // Screen size
      row.appendChild(textCell([{ text: item.screen || '' }]))

      // GPU: name on the first line, VRAM under it
      const gpu = splitGpu(item.gpu)
      row.appendChild(textCell([{ text: gpu.name }, { text: gpu.vram, muted: true }]))

      // Price (English digits)
      const priceCell = el(
        'div',
        {
          background: '#0f766e14',
          color: '#0f766e',
          fontWeight: '800',
          fontSize: '17px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        formatPrice(item.price)
      )
      row.appendChild(priceCell)

      stage.appendChild(row)
      return row
    })

    if (document.fonts?.ready) await document.fonts.ready

    const shot = (node: HTMLElement) =>
      html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })

    const titleCanvas = await shot(title)
    const headerCanvas = await shot(headerRow)
    const rowCanvases: HTMLCanvasElement[] = []
    for (let i = 0; i < rowElements.length; i++) {
      rowCanvases.push(await shot(rowElements[i]))
      onProgress?.(i + 1, rowElements.length, 'render')
    }

    // Let the UI repaint before the (synchronous) assembly step starts.
    onProgress?.(rowElements.length, rowElements.length, 'assemble')
    await new Promise(r => setTimeout(r, 30))

    // --- Paginate whole rows; repeat the table header on every page ---
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const marginX = 10
    const marginTop = 6
    const marginBottom = 6
    const usableWidth = pageWidth - marginX * 2
    const usableBottom = pageHeight - marginBottom
    const mmH = (c: HTMLCanvasElement) => (c.height * usableWidth) / c.width
    const add = (c: HTMLCanvasElement, y: number) =>
      pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', marginX, y, usableWidth, mmH(c))

    let y = marginTop
    add(titleCanvas, y)
    y += mmH(titleCanvas)
    add(headerCanvas, y)
    y += mmH(headerCanvas)

    rowCanvases.forEach(c => {
      const h = mmH(c)
      if (y + h > usableBottom + 0.05) {
        pdf.addPage()
        y = marginTop
        add(headerCanvas, y)
        y += mmH(headerCanvas)
      }
      add(c, y)
      y += h
    })

    pdf.setProperties({ title: 'قائمة أسعار الحسين', subject: `layout ${PDF_LAYOUT_VERSION}` })
    return { blob: pdf.output('blob'), pages: pdf.getNumberOfPages() }
  } finally {
    stage.remove()
  }
}
