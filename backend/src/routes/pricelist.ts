import { Router, Request, Response } from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { UTApi, UTFile } from 'uploadthing/server'
import { getPricelistModel, type StructuredLaptopItem } from '../models/Pricelist.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withId } from '../lib/json.js'
import { normalizePricelistWithGemini, generatePricelistHtml } from '../lib/gemini.js'
import { getUploadThingTokens } from '../lib/uploadthing-tokens.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const isXlsx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname?.toLowerCase().endsWith('.xlsx')

    if (isXlsx) {
      cb(null, true)
    } else {
      cb(new Error('يجب أن يكون الملف بصيغة Excel (.xlsx) فقط'))
    }
  },
})

// Priority order for categories: Budget first, Mid second, Premium last
const CATEGORY_PRIORITIES: Array<{ pattern: RegExp; priority: number }> = [
  { pattern: /budget|اقتصاد/i, priority: 1 },
  { pattern: /mid|متوسط/i, priority: 2 },
  { pattern: /business|أعمال|اعمال/i, priority: 3 },
  { pattern: /gam|ألعاب|العاب|جيمن/i, priority: 4 },
  { pattern: /premium|high|متميز|عليا/i, priority: 5 },
]

function getCategoryPriority(cat?: string): number {
  if (!cat) return 99
  for (const item of CATEGORY_PRIORITIES) {
    if (item.pattern.test(cat)) {
      return item.priority
    }
  }
  return 50
}

/**
 * Sorts structured laptop items:
 * 1. By category priority (Budget -> Mid -> Premium)
 * 2. Within each category, by price ascending (cheapest first)
 * 3. Renumbers `index` sequentially (1, 2, 3...)
 */
export function sortStructuredItems(items: StructuredLaptopItem[]): StructuredLaptopItem[] {
  return [...items]
    .sort((a, b) => {
      const priorityA = getCategoryPriority(a.category)
      const priorityB = getCategoryPriority(b.category)
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      const catA = (a.category || '').trim()
      const catB = (b.category || '').trim()
      if (catA !== catB) {
        return catA.localeCompare(catB, 'ar')
      }

      const priceA = Number(a.price) || 0
      const priceB = Number(b.price) || 0
      if (priceA !== priceB) {
        return priceA - priceB
      }

      return (a.name || '').localeCompare(b.name || '', 'ar')
    })
    .map((item, idx) => ({
      ...item,
      id: item.id || `item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      index: idx + 1,
    }))
}

/**
 * Parses an Excel buffer into an array of row objects keyed by whatever headers
 * exist in the sheet, scanning all sheets to find the first sheet with valid data.
 */
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

    if (selectedSheetName) {
      break
    }
  }

  if (!selectedSheetName || detectedHeaderIndex === -1) {
    throw new Error('لم يتم العثور على أي صفحة تحتوي على جدول بيانات ومواصفات صالح في ملف Excel')
  }

  logInfo(
    'Pricelist Upload',
    `Found valid data in sheet "${selectedSheetName}" with header at row index ${detectedHeaderIndex}`
  )

  const rawHeaders = (selectedSheetRows[detectedHeaderIndex] || []).map((h, colIdx) => {
    const str = String(h ?? '').trim()
    return str || `Column_${colIdx + 1}`
  })

  let currentCategory = ''
  const resultRows: Record<string, any>[] = []

  for (let r = detectedHeaderIndex + 1; r < selectedSheetRows.length; r++) {
    const row = selectedSheetRows[r]
    if (!Array.isArray(row)) continue

    const nonBlankCells = row.filter(
      cell => cell !== undefined && cell !== null && String(cell).trim().length > 0
    )
    if (nonBlankCells.length === 0) continue

    // Detect category/section divider row (e.g., "Budget Range | الفئة الاقتصادية")
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

/**
 * Uploads the original raw Excel file to UploadThing so it is downloadable by admins.
 */
async function uploadRawExcelToUploadThing(file: Express.Multer.File): Promise<string> {
  try {
    const tokens = getUploadThingTokens()
    const token = tokens[0]
    if (!token) {
      logInfo('UploadThing', 'No UploadThing token found, skipping remote storage')
      return ''
    }

    const utapi = new UTApi({ token })
    const utFile = new UTFile([file.buffer], file.originalname)

    const uploadRes = await utapi.uploadFiles(utFile)
    const uploaded = Array.isArray(uploadRes) ? uploadRes[0] : uploadRes
    if (uploaded?.data?.ufsUrl || uploaded?.data?.url) {
      return uploaded.data.ufsUrl || uploaded.data.url
    }
    if (uploaded?.error) {
      logError('UploadThing upload raw excel', uploaded.error)
    }
    return ''
  } catch (err) {
    logError('UploadThing raw excel error', err)
    return ''
  }
}

/**
 * Public, unauthenticated endpoint:
 * Returns the currently published pricelist with structuredItems and generatedHtml.
 * SECURITY: rawExcelFileUrl is strictly stripped from this response.
 */
router.get('/api/pricelist', async (_req: Request, res: Response): Promise<void> => {
  try {
    const lists = await DatabaseRouter.readAcrossAllDatabases(
      async connection =>
        getPricelistModel(connection).find({ published: true }).sort({ uploadedAt: -1 }).lean(),
      'pricelists'
    )
    const pricelist = lists.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]
    if (!pricelist) {
      res.status(404).json({ error: 'لا توجد قائمة أسعار منشورة حالياً' })
      return
    }

    // Security fix: do NOT expose rawExcelFileUrl to public unauthenticated visitors
    const sanitized = withId(pricelist)
    delete (sanitized as any).rawExcelFileUrl

    res.json(sanitized)
  } catch (error) {
    logError('Get pricelist', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

/**
 * Admin-only endpoint to fetch current pricelist with rawExcelFileUrl included.
 */
router.get('/api/pricelist/admin', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const lists = await DatabaseRouter.readAcrossAllDatabases(
      async connection =>
        getPricelistModel(connection).find().sort({ uploadedAt: -1 }).lean(),
      'pricelists-admin'
    )
    const pricelist = lists[0]
    if (!pricelist) {
      res.status(404).json({ error: 'لا توجد أي قائمة أسعار مسجلة' })
      return
    }
    res.json(withId(pricelist))
  } catch (error) {
    logError('Get admin pricelist', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

/**
 * Upload new pricelist:
 * 1. Parses sheet into raw rows.
 * 2. Uploads raw .xlsx to UploadThing for admin storage.
 * 3. Normalizes with Gemini sequentially.
 * 4. Sorts structuredItems by category & price ascending.
 * 5. Saves atomically (unpublishes old, saves new).
 */
router.post(
  '/api/pricelist',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'الملف مطلوب' })
        return
      }
      if (!file.originalname?.toLowerCase().endsWith('.xlsx')) {
        res.status(400).json({ error: 'يجب أن يكون الملف بصيغة Excel (.xlsx) فقط' })
        return
      }

      // 1. Parse sheet into raw rows
      logInfo('Pricelist Upload', `Parsing Excel file: ${file.originalname}`)
      const rawRows = parseExcelToRawRows(file.buffer)

      if (rawRows.length === 0) {
        res.status(400).json({ error: 'لم يتم العثور على أي صفوف صالحة في ملف Excel' })
        return
      }

      // 2. Upload raw Excel file to UploadThing
      logInfo('Pricelist Upload', 'Uploading raw Excel file to UploadThing')
      const rawExcelFileUrl = await uploadRawExcelToUploadThing(file)

      // 3. Normalize + enrich using Gemini (sequential with delay)
      logInfo('Pricelist Upload', `Normalizing ${rawRows.length} rows with Gemini`)
      const rawStructuredItems = await normalizePricelistWithGemini(rawRows)

      // 4. Sort structured items by category and price ascending
      const structuredItems = sortStructuredItems(rawStructuredItems)

      // 5. Generate fallback HTML table from sorted structuredItems
      const generatedHtml = generatePricelistHtml(structuredItems)

      // 6. Unpublish previous pricelists
      await DatabaseRouter.readAcrossAllDatabases(async connection => {
        await getPricelistModel(connection).updateMany({ published: true }, { published: false })
        return []
      }, 'pricelists-unpublish')

      // 7. Save new pricelist
      const { result: pricelist } = await DatabaseRouter.createWithFailover(
        async (connection, dbIndex) => {
          const doc = new (getPricelistModel(connection))({
            sourceFileName: file.originalname,
            rawExcelFileUrl,
            structuredItems,
            generatedHtml,
            parsedHtml: generatedHtml,
            uploadedAt: new Date(),
            published: true,
            dbIndex,
          })
          await doc.save()
          return doc
        },
        'pricelist'
      )

      logInfo(
        'Publish pricelist',
        `Published Excel pricelist: ${pricelist.sourceFileName} with ${structuredItems.length} sorted items`
      )
      res.status(201).json(pricelist.toJSON())
    } catch (error) {
      logError('Publish pricelist', error)
      const message = error instanceof Error ? error.message : 'حدث خطأ في معالجة قائمة الأسعار'
      res.status(500).json({ error: message })
    }
  }
)

/**
 * PATCH /api/pricelist/:id/items/:itemId
 * Updates a single laptop entry inside structuredItems, re-sorts by price, and saves.
 */
router.patch(
  '/api/pricelist/:id/items/:itemId',
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, itemId } = req.params
      const updates = req.body

      // Find pricelist across databases
      const pricelists = await DatabaseRouter.readAcrossAllDatabases(
        async connection => {
          const doc = await getPricelistModel(connection).findById(id)
          return doc ? [doc] : []
        },
        'find-pricelist-by-id'
      )
      const pricelist = pricelists[0]

      if (!pricelist) {
        res.status(404).json({ error: 'قائمة الأسعار غير موجودة' })
        return
      }


      const items = (pricelist.structuredItems || []) as StructuredLaptopItem[]
      const itemIndex = items.findIndex(
        it => it.id === itemId || String(it.index) === String(itemId)
      )

      if (itemIndex === -1) {
        res.status(404).json({ error: 'العنصر المطلوب غير موجود في قائمة الأسعار' })
        return
      }

      const current = items[itemIndex]
      const updatedItem: StructuredLaptopItem = {
        ...current,
        name: updates.name !== undefined ? String(updates.name).trim() : current.name,
        brand: updates.brand !== undefined ? String(updates.brand).trim() : current.brand,
        model: updates.model !== undefined ? String(updates.model).trim() : current.model,
        cpu: updates.cpu !== undefined ? String(updates.cpu).trim() : current.cpu,
        ram: updates.ram !== undefined ? String(updates.ram).trim() : current.ram,
        storage: updates.storage !== undefined ? String(updates.storage).trim() : current.storage,
        screen: updates.screen !== undefined ? String(updates.screen).trim() : current.screen,
        gpu: updates.gpu !== undefined ? String(updates.gpu).trim() : current.gpu,
        price: updates.price !== undefined ? Number(updates.price) : current.price,
        category: updates.category !== undefined ? String(updates.category).trim() : current.category,
      }

      // If user provided flagged update or all critical fields exist, update flag
      if (updates.flagged !== undefined) {
        updatedItem.flagged = Boolean(updates.flagged)
        updatedItem.flagReason = updates.flagReason || ''
      } else if (updatedItem.price > 0 && updatedItem.name && updatedItem.cpu) {
        // Clear flag once verified/edited
        updatedItem.flagged = false
        updatedItem.flagReason = ''
      }

      items[itemIndex] = updatedItem

      // Re-sort items by category and price ascending
      const sortedItems = sortStructuredItems(items)
      pricelist.structuredItems = sortedItems
      pricelist.generatedHtml = generatePricelistHtml(sortedItems)
      pricelist.parsedHtml = pricelist.generatedHtml
      pricelist.markModified('structuredItems')

      await pricelist.save()

      logInfo('Update pricelist item', `Updated item ${itemId} in pricelist ${id}`)
      res.json(pricelist.toJSON())
    } catch (error) {
      logError('Update pricelist item', error)
      const message = error instanceof Error ? error.message : 'حدث خطأ في تحديث العنصر'
      res.status(500).json({ error: message })
    }
  }
)

/**
 * GET /api/pricelist/:id/export
 * Exports the current state of structuredItems as an Excel file.
 */
router.get('/api/pricelist/:id/export', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pricelists = await DatabaseRouter.readAcrossAllDatabases(
      async connection => {
        const doc = await getPricelistModel(connection).findById(id).lean()
        return doc ? [doc] : []
      },
      'find-pricelist-by-id'
    )
    const pricelist = pricelists[0]

    if (!pricelist) {
      res.status(404).json({ error: 'قائمة الأسعار غير موجودة' })
      return
    }

    const items = (pricelist.structuredItems || []) as StructuredLaptopItem[]
    const sortedItems = sortStructuredItems(items)

    // Build worksheet data
    const wsData: (string | number)[][] = [
      ['#', 'الموديل', 'المعالج', 'الرام', 'التخزين', 'الشاشة', 'كارت الشاشة', 'السعر', 'الفئة']
    ];

    sortedItems.forEach((item, index) => {
      wsData.push([
        index + 1,
        item.name || `${item.brand} ${item.model}`.trim(),
        item.cpu || '',
        item.ram || '',
        item.storage || '',
        item.screen || '',
        item.gpu || '',
        item.price || 0,
        item.category || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pricelist');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="pricelist_exported_${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    logError('Export pricelist', error)
    res.status(500).json({ error: 'حدث خطأ في تصدير قائمة الأسعار' })
  }
});

/**
 * DELETE /api/pricelist/:id/items/:itemId
 * Deletes a single laptop entry.
 */
router.delete('/api/pricelist/:id/items/:itemId', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    
    // Find pricelist across databases
    const pricelists = await DatabaseRouter.readAcrossAllDatabases(
      async connection => {
        const doc = await getPricelistModel(connection).findById(id)
        return doc ? [doc] : []
      },
      'find-pricelist-by-id'
    )
    const pricelist = pricelists[0]

    if (!pricelist) {
      res.status(404).json({ error: 'قائمة الأسعار غير موجودة' })
      return
    }

    const items = (pricelist.structuredItems || []) as StructuredLaptopItem[]
    const itemIndex = items.findIndex(
      it => it.id === itemId || String(it.index) === String(itemId)
    )

    if (itemIndex === -1) {
      res.status(404).json({ error: 'العنصر المطلوب غير موجود' })
      return
    }

    items.splice(itemIndex, 1)

    const sortedItems = sortStructuredItems(items)
    pricelist.structuredItems = sortedItems
    pricelist.generatedHtml = generatePricelistHtml(sortedItems)
    pricelist.parsedHtml = pricelist.generatedHtml
    pricelist.markModified('structuredItems')

    await pricelist.save()

    logInfo('Delete pricelist item', `Deleted item ${itemId} from pricelist ${id}`)
    res.json(pricelist.toJSON())
  } catch (error) {
    logError('Delete pricelist item', error)
    res.status(500).json({ error: 'حدث خطأ في حذف العنصر' })
  }
});

/**
 * DELETE /api/pricelist/:id/items
 * Deletes all items from the pricelist.
 */
router.delete('/api/pricelist/:id/items', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find pricelist across databases
    const pricelists = await DatabaseRouter.readAcrossAllDatabases(
      async connection => {
        const doc = await getPricelistModel(connection).findById(id)
        return doc ? [doc] : []
      },
      'find-pricelist-by-id'
    )
    const pricelist = pricelists[0]

    if (!pricelist) {
      res.status(404).json({ error: 'قائمة الأسعار غير موجودة' })
      return
    }

    pricelist.structuredItems = []
    pricelist.generatedHtml = generatePricelistHtml([])
    pricelist.parsedHtml = pricelist.generatedHtml
    pricelist.markModified('structuredItems')

    await pricelist.save()

    logInfo('Delete all pricelist items', `Deleted all items from pricelist ${id}`)
    res.json(pricelist.toJSON())
  } catch (error) {
    logError('Delete all pricelist items', error)
    res.status(500).json({ error: 'حدث خطأ في حذف العناصر' })
  }
});

export default router
