import ExcelJS from 'exceljs'
import type { StructuredLaptopItem } from '../models/Pricelist.js'
import { getCategoryInfo } from './pricelist-excel.js'
import { normalizeIntegratedGpuVram } from './gpu-normalize.js'
import { translateCpuGenerationToArabic } from './cpu-normalize.js'

const TABLE_ROW_HEIGHT = 70

const NAVY = 'FF2C3E50'
const MUTED = 'FF7F8C8D'
const BANNER_BG = 'FFD6EAF8'
const BANNER_TEXT = 'FF1A5276'
const PRICE_BG = 'FFEBF5FB'
const ROW_ALT_BG = 'FFF5F8FA'
const WHITE = 'FFFFFFFF'
const BORDER_COLOR = 'FFD5D8DC'

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
}

const headerBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: WHITE } },
  bottom: { style: 'thin', color: { argb: WHITE } },
  left: { style: 'thin', color: { argb: WHITE } },
  right: { style: 'thin', color: { argb: WHITE } },
}

/**
 * Builds an ExcelJS Workbook in the "catalog" style pricelist format:
 * - Store name banner, tagline + date
 * - Dark navy column header row: # | Model | Processor/CPU | RAM | Storage | Screen | Graphics Card/VGA | Price (EGP)
 * - Light-blue category divider rows (Budget/Mid/Gaming/Premium/Business)
 * - Alternating row backgrounds, price column highlighted
 * - Integrated Intel GPU VRAM ranges are normalized to "1G→2G"
 */
export async function buildPricelistExcelWorkbookV2(
  items: StructuredLaptopItem[],
  uploadedAt?: Date | string,
  storeName: string = 'الحسين للاب توب',
  tagline: string = 'شركة الحسين  |  رزق صالح  |  01060169569  |  01003021210'
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AlHussain Laptop'
  wb.created = new Date()

  const ws = wb.addWorksheet('Price List', {
    views: [{ rightToLeft: false, showGridLines: true }],
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  ws.columns = [
    { key: 'index', width: 6 },
    { key: 'model', width: 26.57 },
    { key: 'cpu', width: 22 },
    { key: 'ram', width: 10 },
    { key: 'storage', width: 12 },
    { key: 'screen', width: 10 },
    { key: 'gpu', width: 26 },
    { key: 'price', width: 14 },
  ]

  // ROW 1: spacer
  ws.getRow(1).height = 18

  // ROW 2: store name banner
  ws.mergeCells('A2:H2')
  const titleCell = ws.getCell('A2')
  titleCell.value = storeName
  titleCell.font = { name: 'Arial', bold: true, size: 22, color: { argb: NAVY } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(2).height = 40

  // ROW 3: tagline + date
  ws.mergeCells('A3:D3')
  const taglineCell = ws.getCell('A3')
  taglineCell.value = tagline
  taglineCell.font = { name: 'Arial', size: 10, color: { argb: MUTED } }
  taglineCell.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells('E3:H3')
  const dateCell = ws.getCell('E3')
  const today = uploadedAt ? new Date(uploadedAt) : new Date()
  dateCell.value = `${today.getDate()} / ${today.getMonth() + 1} / ${today.getFullYear()}`
  dateCell.font = { name: 'Arial', size: 10, color: { argb: MUTED } }
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(3).height = 22

  // ROW 4: spacer
  ws.getRow(4).height = 10

  // ROW 5: column headers
  const headerRowIdx = 5
  const headerRow = ws.getRow(headerRowIdx)
  headerRow.height = TABLE_ROW_HEIGHT
  const headers = ['#', 'Model', 'Processor  /  CPU', 'RAM', 'Storage', 'Screen', 'Graphics Card  /  VGA', 'Price (EGP)']
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = header
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: WHITE } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = headerBorder
  })

  // Normalize integrated Intel GPU VRAM ranges and translate CPU generation to Arabic
  const normalizedItems = items.map(it => ({
    ...it,
    gpu: normalizeIntegratedGpuVram(it.gpu),
    cpu: translateCpuGenerationToArabic(it.cpu),
  }))

  let currentRow = headerRowIdx + 1
  let currentCategory: string | null = null
  let rowNumber = 0
  let stripe = 0

  for (const item of normalizedItems) {
    const catInfo = getCategoryInfo(item.category)
    if (currentCategory === null || catInfo.banner !== currentCategory) {
      currentCategory = catInfo.banner
      ws.mergeCells(`A${currentRow}:H${currentRow}`)
      const bannerCell = ws.getCell(`A${currentRow}`)
      bannerCell.value = catInfo.banner
      bannerCell.font = { name: 'Arial', bold: true, size: 10, color: { argb: BANNER_TEXT } }
      bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER_BG } }
      bannerCell.alignment = { horizontal: 'center', vertical: 'middle' }
      for (let c = 1; c <= 8; c++) {
        ws.getCell(currentRow, c).border = thinBorder
      }
      ws.getRow(currentRow).height = TABLE_ROW_HEIGHT
      currentRow++
      stripe = 0
    }

    rowNumber++
    const row = ws.getRow(currentRow)
    row.height = TABLE_ROW_HEIGHT
    const bg = stripe % 2 === 0 ? WHITE : ROW_ALT_BG
    stripe++

    const cellIndex = row.getCell(1)
    cellIndex.value = rowNumber
    cellIndex.font = { name: 'Arial', size: 10, color: { argb: MUTED } }
    cellIndex.alignment = { horizontal: 'center', vertical: 'middle' }
    cellIndex.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellIndex.border = thinBorder

    const cellModel = row.getCell(2)
    cellModel.value = item.name || `${item.brand || ''} ${item.model || ''}`.trim()
    cellModel.font = { name: 'Arial', bold: true, size: 10, color: { argb: NAVY } }
    cellModel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    cellModel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellModel.border = thinBorder

    const cellCpu = row.getCell(3)
    cellCpu.value = item.cpu || ''
    cellCpu.font = { name: 'Arial', size: 10, color: { argb: NAVY } }
    cellCpu.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true }
    cellCpu.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellCpu.border = thinBorder

    const cellRam = row.getCell(4)
    cellRam.value = item.ram || ''
    cellRam.font = { name: 'Arial', bold: true, size: 10, color: { argb: NAVY } }
    cellRam.alignment = { horizontal: 'center', vertical: 'middle' }
    cellRam.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellRam.border = thinBorder

    const cellStorage = row.getCell(5)
    cellStorage.value = item.storage || ''
    cellStorage.font = { name: 'Arial', size: 10, color: { argb: NAVY } }
    cellStorage.alignment = { horizontal: 'center', vertical: 'middle' }
    cellStorage.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellStorage.border = thinBorder

    const cellScreen = row.getCell(6)
    cellScreen.value = item.screen || ''
    cellScreen.font = { name: 'Arial', size: 10, color: { argb: NAVY } }
    cellScreen.alignment = { horizontal: 'center', vertical: 'middle' }
    cellScreen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellScreen.border = thinBorder

    const cellGpu = row.getCell(7)
    cellGpu.value = item.gpu || ''
    cellGpu.font = { name: 'Arial', size: 10, color: { argb: NAVY } }
    cellGpu.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true }
    cellGpu.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cellGpu.border = thinBorder

    const cellPrice = row.getCell(8)
    const numPrice = typeof item.price === 'number' ? item.price : Number(item.price) || 0
    cellPrice.value = numPrice
    cellPrice.font = { name: 'Arial', bold: true, size: 11, color: { argb: BANNER_TEXT } }
    cellPrice.alignment = { horizontal: 'center', vertical: 'middle' }
    cellPrice.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRICE_BG } }
    cellPrice.border = thinBorder
    cellPrice.numFmt = '#,##0" EGP"'

    currentRow++
  }

  return wb
}
