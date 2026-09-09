import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'

interface LaptopData {
  name: string
  price: number
  cpu: string
  gpu: string
  ram: string
  storage: string
  visible: boolean
}

// Load the JSON data
const jsonPath = path.resolve(process.cwd(), 'alhussain-laptops (1).json')
if (!fs.existsSync(jsonPath)) {
  console.error(`JSON file not found at: ${jsonPath}`)
  console.error('Please ensure the file is in the backend directory.')
  process.exit(1)
}
const rawData: LaptopData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

// Filter only visible items
const visibleItems = rawData.filter(item => item.visible)

// Extract brand and model from name
function parseLaptopName(name: string): { brand: string; model: string; series: string } {
  const upperName = name.toUpperCase()
  
  let brand = 'OTHER'
  if (upperName.startsWith('HP ')) brand = 'HP'
  else if (upperName.startsWith('DELL ') || upperName.startsWith('DELL')) brand = 'DELL'
  else if (upperName.startsWith('LENOVO ')) brand = 'LENOVO'
  
  // Extract model (everything after brand)
  let model = name
  if (brand !== 'OTHER') {
    model = name.substring(brand.length).trim()
  }
  
  // Determine series based on model patterns
  let series = 'OTHER'
  const upperModel = model.toUpperCase()
  
  if (upperModel.includes('ZBOOK')) {
    series = 'ZBOOK'
  } else if (upperModel.match(/^\d{3}/)) {
    // Models starting with 3 digits (e.g., 3470, 5400, 7480)
    const firstDigit = upperModel.charAt(0)
    if (firstDigit === '3') series = '3XX'
    else if (firstDigit === '4') series = '4XX'
    else if (firstDigit === '5') series = '5XX'
    else if (firstDigit === '6') series = '6XX'
    else if (firstDigit === '7') series = '7XX'
    else if (firstDigit === '8') series = '8XX'
    else series = 'OTHER'
  } else if (upperModel.match(/^\d{3}/)) {
    series = 'OTHER'
  } else if (upperModel.includes('M')) {
    series = 'M-SERIES'
  } else if (upperModel.includes('65')) {
    series = '65X'
  } else if (upperModel.includes('84')) {
    series = '84X'
  } else if (upperModel.includes('85')) {
    series = '85X'
  }
  
  return { brand, model, series }
}

// Parse all items with brand/series info
const parsedItems = visibleItems.map(item => {
  const { brand, model, series } = parseLaptopName(item.name)
  return {
    ...item,
    brand,
    model,
    series,
    originalIndex: visibleItems.indexOf(item)
  }
})

// Brand priority order
const BRAND_PRIORITY = ['HP', 'DELL', 'LENOVO']

// Series priority within each brand (you can customize this)
const SERIES_PRIORITY: Record<string, string[]> = {
  'HP': ['ZBOOK', '65X', '84X', '85X', '6XX', '8XX', '4XX', '2XX', 'OTHER'],
  'DELL': ['M-SERIES', '3XX', '4XX', '5XX', '7XX', 'OTHER'],
  'LENOVO': ['THINKPAD', 'IDEAPAD', 'OTHER']
}

// Sort items by brand priority, then series priority, then original order
function sortItems(items: any[]) {
  return items.sort((a, b) => {
    // Sort by brand priority
    const aBrandIdx = BRAND_PRIORITY.indexOf(a.brand) !== -1 ? BRAND_PRIORITY.indexOf(a.brand) : 999
    const bBrandIdx = BRAND_PRIORITY.indexOf(b.brand) !== -1 ? BRAND_PRIORITY.indexOf(b.brand) : 999
    
    if (aBrandIdx !== bBrandIdx) {
      return aBrandIdx - bBrandIdx
    }
    
    // Same brand, sort by series priority
    const aSeriesPriority = SERIES_PRIORITY[a.brand] || []
    const bSeriesPriority = SERIES_PRIORITY[b.brand] || []
    
    const aSeriesIdx = aSeriesPriority.indexOf(a.series) !== -1 ? aSeriesPriority.indexOf(a.series) : 999
    const bSeriesIdx = bSeriesPriority.indexOf(b.series) !== -1 ? bSeriesPriority.indexOf(b.series) : 999
    
    if (aSeriesIdx !== bSeriesIdx) {
      return aSeriesIdx - bSeriesIdx
    }
    
    // Same brand and series, preserve original order
    return a.originalIndex - b.originalIndex
  })
}

const sortedItems = sortItems(parsedItems)

// Create Excel workbook
const wb = new ExcelJS.Workbook()
wb.creator = 'AlHussain Laptop'
wb.created = new Date()

const ws = wb.addWorksheet('Price List')

// Set column widths
ws.columns = [
  { key: 'brand', width: 12 },
  { key: 'model', width: 20 },
  { key: 'cpu', width: 25 },
  { key: 'hard', width: 15 },
  { key: 'ram', width: 10 },
  { key: 'vga', width: 25 },
  { key: 'monitor', width: 12 },
  { key: 'price', width: 12 },
]

// Define styles
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
}

// ROW 1: Header with store name, date, and phone
const row1 = ws.getRow(1)
row1.height = 30

// Yellow cell in top-left (A1)
const cellA1 = ws.getCell('A1')
cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
cellA1.border = thinBorder

// Merged store name banner in center (B1:E1)
ws.mergeCells('B1:E1')
const cellB1 = ws.getCell('B1')
cellB1.value = 'الحسين للاب توب'
cellB1.font = { name: 'Arial', bold: true, size: 16, color: { argb: 'FF008000' } }
cellB1.alignment = { horizontal: 'center', vertical: 'middle' }
cellB1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
cellB1.border = thinBorder

// Date in plain cell (F1)
const cellF1 = ws.getCell('F1')
const today = new Date()
cellF1.value = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
cellF1.font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } }
cellF1.alignment = { horizontal: 'center', vertical: 'middle' }
cellF1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
cellF1.border = thinBorder

// Phone number in green-filled box (G1:H1 merged)
ws.mergeCells('G1:H1')
const cellG1 = ws.getCell('G1')
cellG1.value = '01060169569'
cellG1.font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
cellG1.alignment = { horizontal: 'center', vertical: 'middle' }
cellG1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF008000' } }
cellG1.border = thinBorder

// ROW 2: Column headers
const row2 = ws.getRow(2)
row2.height = 25
const headers = ['BRAND', 'MODEL', 'C.P.U', 'HARD', 'RAM', 'VGA', 'MONITOR', 'PRICE']

headers.forEach((header, idx) => {
  const cell = row2.getCell(idx + 1)
  cell.value = header
  cell.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF000000' } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border = thinBorder
})

// DATA ROWS
let currentRow = 3
let currentBrand = ''
let currentSeries = ''

for (const item of sortedItems) {
  // Check if we need to insert blank row between series/brands
  if (currentBrand && (item.brand !== currentBrand || item.series !== currentSeries)) {
    // Insert blank row
    const blankRow = ws.getRow(currentRow)
    blankRow.height = 15
    for (let c = 1; c <= 8; c++) {
      const cell = blankRow.getCell(c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      // No border for blank row
    }
    currentRow++
  }
  
  currentBrand = item.brand
  currentSeries = item.series
  
  const row = ws.getRow(currentRow)
  row.height = 20
  
  // BRAND column - yellow fill
  const cellBrand = row.getCell(1)
  cellBrand.value = item.brand
  cellBrand.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellBrand.alignment = { horizontal: 'left', vertical: 'middle' }
  cellBrand.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
  cellBrand.border = thinBorder
  
  // MODEL column - white fill
  const cellModel = row.getCell(2)
  cellModel.value = item.model
  cellModel.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellModel.alignment = { horizontal: 'left', vertical: 'middle' }
  cellModel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  cellModel.border = thinBorder
  
  // CPU column - white fill
  const cellCpu = row.getCell(3)
  cellCpu.value = item.cpu
  cellCpu.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellCpu.alignment = { horizontal: 'left', vertical: 'middle' }
  cellCpu.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  cellCpu.border = thinBorder
  
  // HARD (storage) column - white fill
  const cellHard = row.getCell(4)
  cellHard.value = item.storage
  cellHard.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellHard.alignment = { horizontal: 'left', vertical: 'middle' }
  cellHard.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  cellHard.border = thinBorder
  
  // RAM column - white fill
  const cellRam = row.getCell(5)
  cellRam.value = item.ram
  cellRam.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellRam.alignment = { horizontal: 'left', vertical: 'middle' }
  cellRam.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  cellRam.border = thinBorder
  
  // VGA column - white fill
  const cellVga = row.getCell(6)
  cellVga.value = item.gpu
  cellVga.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellVga.alignment = { horizontal: 'left', vertical: 'middle' }
  cellVga.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  cellVga.border = thinBorder
  
  // MONITOR column - white fill (extract from description or leave empty)
  const cellMonitor = row.getCell(7)
  // Try to extract screen size from description
  const screenMatch = item.name?.match(/(\d+\.?\d*)"/) || 
                      item.name?.match(/(\d+\.?\d*)\.?\d*\s*(inch|\""|\"|in)/i)
  if (screenMatch) {
    cellMonitor.value = `${screenMatch[1]}"`
  } else {
    cellMonitor.value = ''
  }
  cellMonitor.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } }
  cellMonitor.alignment = { horizontal: 'left', vertical: 'middle' }
  cellMonitor.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  cellMonitor.border = thinBorder
  
  // PRICE column - pink/salmon fill, bold, right-aligned, plain integer
  const cellPrice = row.getCell(8)
  cellPrice.value = item.price
  cellPrice.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF000000' } }
  cellPrice.alignment = { horizontal: 'right', vertical: 'middle' }
  cellPrice.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC0CB' } } // Salmon/pink
  cellPrice.border = thinBorder
  cellPrice.numFmt = '0' // Plain integer format
  
  currentRow++
}

// Auto-fit column widths for better content display
ws.columns.forEach((column) => {
  if (column.eachCell) {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : ''
      const length = value.length
      if (length > maxLength) {
        maxLength = length
      }
    })
    // Set minimum width and add some padding
    column.width = Math.max(Math.min(maxLength + 2, 30), 10)
  }
})

// Save the workbook
const outputPath = path.resolve(process.cwd(), 'AlHussein_PriceList_Custom.xlsx')
await wb.xlsx.writeFile(outputPath)

console.log(`Excel file generated successfully: ${outputPath}`)
console.log(`Total items: ${sortedItems.length}`)
console.log(`Brands: ${[...new Set(sortedItems.map(i => i.brand))].join(', ')}`)
console.log(`Series groups: ${[...new Set(sortedItems.map(i => `${i.brand}-${i.series}`))].join(', ')}`)