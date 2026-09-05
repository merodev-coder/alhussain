import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import dotenv from 'dotenv'

// Load .env if present
dotenv.config()

import { normalizePricelistWithGemini, generatePricelistHtml } from '../src/lib/gemini.js'

function parseExcelToRawRows(buffer: Buffer): Record<string, any>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('ملف Excel لا يحتوي على أي صفحات')
  }

  let selectedSheetName = ''
  let selectedSheetRows: any[][] = []
  let detectedHeaderIndex = -1

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
    if (!rows || rows.length < 2) continue

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i]
      if (Array.isArray(row)) {
        const nonEmptyCols = row.filter(
          cell => cell !== undefined && cell !== null && String(cell).trim().length > 0
        )
        if (nonEmptyCols.length >= 3) {
          const hasDataRow = rows.slice(i + 1).some(
            r =>
              Array.isArray(r) &&
              r.some(c => c !== undefined && c !== null && String(c).trim().length > 0)
          )
          if (hasDataRow) {
            selectedSheetName = sheetName
            selectedSheetRows = rows
            detectedHeaderIndex = i
            break
          }
        }
      }
    }

    if (selectedSheetName) break
  }

  if (!selectedSheetName || detectedHeaderIndex === -1) {
    throw new Error('لم يتم العثور على أي صفحة تحتوي على جدول بيانات ومواصفات صالح في ملف Excel')
  }

  console.log(`[Excel] Using sheet "${selectedSheetName}" (Header row at index ${detectedHeaderIndex})`)

  const rawHeaders = (selectedSheetRows[detectedHeaderIndex] || []).map((h, colIdx) => {
    const str = String(h ?? '').trim()
    return str || `Column_${colIdx + 1}`
  })

  console.log('[Excel] Detected headers:', rawHeaders)

  let currentCategory = ''
  const resultRows: Record<string, any>[] = []

  for (let r = detectedHeaderIndex + 1; r < selectedSheetRows.length; r++) {
    const row = selectedSheetRows[r]
    if (!Array.isArray(row)) continue

    const nonBlankCells = row.filter(
      cell => cell !== undefined && cell !== null && String(cell).trim().length > 0
    )
    if (nonBlankCells.length === 0) continue

    if (nonBlankCells.length <= 2 && nonBlankCells.length > 0) {
      const text = nonBlankCells.map(c => String(c).trim()).join(' - ')
      if (text && isNaN(Number(text))) {
        currentCategory = text
        continue
      }
    }

    const rowObj: Record<string, any> = {}
    if (currentCategory) {
      rowObj['category'] = currentCategory
    }

    let hasData = false
    for (let c = 0; c < rawHeaders.length; c++) {
      const header = rawHeaders[c]
      const val = row[c] !== undefined && row[c] !== null ? row[c] : ''
      rowObj[header] = val
      if (String(val).trim().length > 0) {
        hasData = true
      }
    }

    if (hasData) {
      resultRows.push(rowObj)
    }
  }

  return resultRows
}

async function runTest() {
  const samplePath = path.resolve(process.cwd(), '../AlHussein_Laptops_Clean.xlsx')
  if (!fs.existsSync(samplePath)) {
    console.error(`Sample file not found at ${samplePath}`)
    process.exit(1)
  }

  const fileBuffer = fs.readFileSync(samplePath)
  const rawRows = parseExcelToRawRows(fileBuffer)
  console.log(`[Excel] Extracted ${rawRows.length} raw laptop rows.`)

  // Test on first 3 rows for fast live verification
  const sampleSlice = rawRows.slice(0, 3)
  console.log('\n[Sample Raw Rows for Gemini]:', JSON.stringify(sampleSlice, null, 2))

  if (!process.env.GEMINI_API_KEY) {
    console.log('\n[NOTE] GEMINI_API_KEY environment variable is not set in this terminal session.')
    console.log('To run live Gemini normalization test:')
    console.log('GEMINI_API_KEY=your_key npx tsx scripts/test-excel-pipeline.ts')
    return
  }

  console.log('\n[Gemini] Calling Gemini normalization on sample rows...')
  const normalized = await normalizePricelistWithGemini(sampleSlice)
  console.log('\n[Gemini Structured Output]:\n', JSON.stringify(normalized, null, 2))

  const html = generatePricelistHtml(normalized)
  console.log('\n[HTML Generated Preview]:\n', html.substring(0, 300) + '...')
}

runTest().catch(err => {
  console.error('[Test Error]:', err)
  process.exit(1)
})
