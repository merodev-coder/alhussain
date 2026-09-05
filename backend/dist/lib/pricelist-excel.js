import ExcelJS from 'exceljs';
export const CATEGORY_DEFINITIONS = [
    { pattern: /budget|اقتصاد/i, priority: 1, defaultBanner: 'Budget Range  |  الفئة الاقتصادية' },
    { pattern: /business|أعمال|اعمال/i, priority: 2, defaultBanner: 'Business Range  |  فئة الأعمال' },
    { pattern: /mid|متوسط/i, priority: 3, defaultBanner: 'Mid Range  |  الفئة المتوسطة' },
    { pattern: /gam|ألعاب|العاب|جيمن/i, priority: 4, defaultBanner: 'Gaming Range  |  فئة الألعاب' },
    { pattern: /premium|high|متميز|عليا/i, priority: 5, defaultBanner: 'Premium Range  |  الفئة المتميزة' },
];
export function getCategoryInfo(cat) {
    const normalized = (cat || '').trim();
    for (const def of CATEGORY_DEFINITIONS) {
        if (def.pattern.test(normalized)) {
            return {
                priority: def.priority,
                banner: normalized.includes('|') ? normalized : def.defaultBanner,
            };
        }
    }
    return {
        priority: normalized ? 50 : 99,
        banner: normalized || 'أجهزة أخرى',
    };
}
/**
 * Builds an ExcelJS Workbook matching AlHussein_Laptops_Clean.xlsx reference design:
 * - Row 2: Merged A2:H2 header "الحسين للاب توب", Arial 22pt bold #2C3E50
 * - Row 3: Merged A3:D3 contact line + Merged E3:H3 current date, Arial 10pt #7F8C8D
 * - Row 6: Frozen table header row, Arial 10pt bold white on #2C3E50, height ~40
 * - Category rows: Merged A:H banner, Arial 10pt bold #1A5276, fill #D6EAF8, height 30
 * - Data rows: Banded white / #F5F8FA, Arial 10pt #2C3E50, height 36, thin borders
 * - Price column: Arial 11pt bold #1A5276, fill #EBF5FB, format `#,##0" EGP"`
 * - Exact column widths: # = 6, Model = 20, CPU = 22, RAM = 9, Storage = 12, Screen = 10, GPU = 26, Price = 14
 */
export async function buildPricelistExcelWorkbook(items, uploadedAt) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AlHussain Laptop';
    wb.created = new Date();
    const ws = wb.addWorksheet('Price List', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 6, topLeftCell: 'A7', activeCell: 'A7' }],
    });
    // Set column widths matching reference file
    ws.columns = [
        { key: 'num', width: 6 },
        { key: 'model', width: 20 },
        { key: 'cpu', width: 22 },
        { key: 'ram', width: 9 },
        { key: 'storage', width: 12 },
        { key: 'screen', width: 10 },
        { key: 'gpu', width: 26 },
        { key: 'price', width: 14 },
    ];
    const thinBorder = {
        top: { style: 'thin', color: { argb: 'FFD5D8DC' } },
        bottom: { style: 'thin', color: { argb: 'FFD5D8DC' } },
        left: { style: 'thin', color: { argb: 'FFD5D8DC' } },
        right: { style: 'thin', color: { argb: 'FFD5D8DC' } },
    };
    const headerBorder = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
    // Row 1: empty spacer
    ws.getRow(1).height = 13.5;
    // Row 2: Title "الحسين للاب توب"
    const row2 = ws.getRow(2);
    row2.height = 43.5;
    ws.mergeCells('A2:H2');
    const cellA2 = ws.getCell('A2');
    cellA2.value = 'الحسين للاب توب';
    cellA2.font = { name: 'Arial', bold: true, size: 22, color: { argb: 'FF2C3E50' } };
    cellA2.alignment = { horizontal: 'center', vertical: 'middle' };
    // Row 3: Subtitle - Contact info & Date
    const row3 = ws.getRow(3);
    row3.height = 24;
    ws.mergeCells('A3:D3');
    const cellA3 = ws.getCell('A3');
    cellA3.value = 'شركة الحسين  |  رزق صالح  |  01060169569  |  01003021210';
    cellA3.font = { name: 'Arial', size: 10, color: { argb: 'FF7F8C8D' } };
    cellA3.alignment = { horizontal: 'center', vertical: 'middle' };
    const d = uploadedAt ? new Date(uploadedAt) : new Date();
    const dateStr = `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()}`;
    ws.mergeCells('E3:H3');
    const cellE3 = ws.getCell('E3');
    cellE3.value = dateStr;
    cellE3.font = { name: 'Arial', size: 10, color: { argb: 'FF7F8C8D' } };
    cellE3.alignment = { horizontal: 'center', vertical: 'middle' };
    // Rows 4 and 5 spacers
    ws.getRow(4).height = 3.75;
    ws.getRow(5).height = 9.75;
    // Row 6: Table Headers
    const row6 = ws.getRow(6);
    row6.height = 39.75;
    const headers = [
        '#',
        'Model',
        'Processor  /  CPU',
        'RAM',
        'Storage',
        'Screen',
        'Graphics Card  /  VGA',
        'Price (EGP)',
    ];
    headers.forEach((hdr, idx) => {
        const colNumber = idx + 1;
        const cell = row6.getCell(colNumber);
        cell.value = hdr;
        cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2C3E50' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = headerBorder;
    });
    // Group items by category in the specified order:
    // 1. الفئة الاقتصادية, 2. فئة الأعمال, 3. الفئة المتوسطة, 4. فئة الألعاب, 5. الفئة العليا
    const categoryMap = new Map();
    items.forEach(item => {
        const info = getCategoryInfo(item.category);
        const key = info.banner;
        if (!categoryMap.has(key)) {
            categoryMap.set(key, { banner: info.banner, priority: info.priority, items: [] });
        }
        categoryMap.get(key).items.push(item);
    });
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
        if (a.priority !== b.priority)
            return a.priority - b.priority;
        return a.banner.localeCompare(b.banner, 'ar');
    });
    let currentRowIdx = 7;
    let globalItemIdx = 1;
    let isBanded = false;
    for (const catGroup of sortedCategories) {
        // Sort items within this category by price ascending
        catGroup.items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        // Merged Category Banner Row
        const catRow = ws.getRow(currentRowIdx);
        catRow.height = 30;
        ws.mergeCells(currentRowIdx, 1, currentRowIdx, 8);
        for (let c = 1; c <= 8; c++) {
            const cell = catRow.getCell(c);
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD6EAF8' },
            };
            cell.border = thinBorder;
        }
        const catCell = catRow.getCell(1);
        catCell.value = catGroup.banner;
        catCell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF1A5276' } };
        catCell.alignment = { horizontal: 'center', vertical: 'middle' };
        currentRowIdx++;
        // Data rows for this category
        for (const item of catGroup.items) {
            const row = ws.getRow(currentRowIdx);
            row.height = 36;
            const rowBg = isBanded ? 'FFF5F8FA' : 'FFFFFFFF';
            isBanded = !isBanded;
            // Col 1: #
            const c1 = row.getCell(1);
            c1.value = globalItemIdx;
            c1.font = { name: 'Arial', size: 10, color: { argb: 'FF7F8C8D' } };
            c1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c1.border = thinBorder;
            // Col 2: Model
            const c2 = row.getCell(2);
            c2.value = item.name || `${item.brand || ''} ${item.model || ''}`.trim();
            c2.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF2C3E50' } };
            c2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
            c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c2.border = thinBorder;
            // Col 3: Processor / CPU
            const c3 = row.getCell(3);
            c3.value = item.cpu || '';
            c3.font = { name: 'Arial', size: 10, color: { argb: 'FF2C3E50' } };
            c3.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
            c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c3.border = thinBorder;
            // Col 4: RAM
            const c4 = row.getCell(4);
            c4.value = item.ram || '';
            c4.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF2C3E50' } };
            c4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c4.border = thinBorder;
            // Col 5: Storage
            const c5 = row.getCell(5);
            c5.value = item.storage || '';
            c5.font = { name: 'Arial', size: 10, color: { argb: 'FF2C3E50' } };
            c5.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c5.border = thinBorder;
            // Col 6: Screen
            const c6 = row.getCell(6);
            c6.value = item.screen || '';
            c6.font = { name: 'Arial', size: 10, color: { argb: 'FF2C3E50' } };
            c6.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c6.border = thinBorder;
            // Col 7: Graphics Card / VGA
            const c7 = row.getCell(7);
            c7.value = item.gpu || '';
            c7.font = { name: 'Arial', size: 10, color: { argb: 'FF2C3E50' } };
            c7.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
            c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            c7.border = thinBorder;
            // Col 8: Price (EGP)
            const c8 = row.getCell(8);
            const numPrice = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
            c8.value = numPrice;
            c8.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF1A5276' } };
            c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FB' } };
            c8.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c8.numFmt = '#,##0" EGP"';
            c8.border = thinBorder;
            currentRowIdx++;
            globalItemIdx++;
        }
    }
    return wb;
}
