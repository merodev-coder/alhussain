import fs from 'node:fs'
import path from 'node:path'
import { buildPricelistExcelWorkbook } from '../src/lib/pricelist-excel.js'

// Mock data similar to what would come from the database
const mockItems = [
  {
    id: '1',
    index: 1,
    name: 'HP ProBook 450 G1',
    brand: 'HP',
    model: 'ProBook 450 G1',
    cpu: 'Core i5 (4th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '15.6"',
    gpu: 'AMD HD 8470M - 1GB إلى 8GB',
    price: 5500,
    category: 'Budget Range | الفئة الاقتصادية'
  },
  {
    id: '2',
    index: 2,
    name: 'HP ProBook 440 G5',
    brand: 'HP',
    model: 'ProBook 440 G5',
    cpu: 'Core i5 (8th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '14"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 8000,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '3',
    index: 3,
    name: 'HP ProBook 455 G5',
    brand: 'HP',
    model: 'ProBook 455 G5',
    cpu: 'AMD A9-9410 (9th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '15.6"',
    gpu: 'AMD HD R6 - 1GB إلى 8GB',
    price: 7500,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '4',
    index: 4,
    name: 'HP ZBOOK G2',
    brand: 'HP',
    model: 'ZBOOK G2',
    cpu: 'Core i7 MQ (4th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '15.6"',
    gpu: 'N.VIDIA K1000 - 2GB إلى 20GB',
    price: 7500,
    category: 'Premium Range | الفئة المتميزة'
  },
  {
    id: '5',
    index: 5,
    name: 'HP ZBOOK G3',
    brand: 'HP',
    model: 'ZBOOK G3',
    cpu: 'Core i5 HQ (6th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '15.6"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 9000,
    category: 'Premium Range | الفئة المتميزة'
  },
  {
    id: '6',
    index: 6,
    name: 'HP ZBOOK G5',
    brand: 'HP',
    model: 'ZBOOK G5',
    cpu: 'Core i7 H (8th Gen)',
    ram: '16GB',
    storage: '512GB SSD',
    screen: '15.6"',
    gpu: 'N.VIDIA P2000 - 4GB إلى 20GB',
    price: 22000,
    category: 'Premium Range | الفئة المتميزة'
  },
  {
    id: '7',
    index: 7,
    name: 'DELL Latitude 3470',
    brand: 'DELL',
    model: 'Latitude 3470',
    cpu: 'Core i5 (6th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '14.1"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 6500,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '8',
    index: 8,
    name: 'DELL Latitude 5480',
    brand: 'DELL',
    model: 'Latitude 5480',
    cpu: 'Core i5 (7th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '14.1"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 7500,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '9',
    index: 9,
    name: 'DELL Latitude 5590',
    brand: 'DELL',
    model: 'Latitude 5590',
    cpu: 'Core i5 (8th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '15.6"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 10000,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '10',
    index: 10,
    name: 'DELL Precision M4800',
    brand: 'DELL',
    model: 'Precision M4800',
    cpu: 'Core i7 (4th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '15.6"',
    gpu: 'N.VIDIA K1000 - 2GB إلى 20GB',
    price: 7000,
    category: 'Premium Range | الفئة المتميزة'
  },
  {
    id: '11',
    index: 11,
    name: 'DELL Precision 7510',
    brand: 'DELL',
    model: 'Precision 7510',
    cpu: 'Xeon E3-1505M (7th Gen)',
    ram: '16GB',
    storage: '512GB SSD',
    screen: '15.6"',
    gpu: 'N.VIDIA M1000 - 2GB إلى 20GB',
    price: 13500,
    category: 'Premium Range | الفئة المتميزة'
  },
  {
    id: '12',
    index: 12,
    name: 'DELL Precision 7530',
    brand: 'DELL',
    model: 'Precision 7530',
    cpu: 'Core i5 H (8th Gen)',
    ram: '16GB',
    storage: '256GB SSD',
    screen: '15.6"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 13000,
    category: 'Premium Range | الفئة المتميزة'
  }
]

async function testNewFormat() {
  console.log('Generating Excel file with new format (ProBook, Latitude, ZBook, Precision grouping)...')
  
  // Debug: Parse each item to see what series it gets
  console.log('\n=== Debugging Series Detection ===')
  mockItems.forEach(item => {
    const itemName = item.name
    const upperName = itemName.toUpperCase()
    
    let brand = 'OTHER'
    if (upperName.startsWith('HP ')) brand = 'HP'
    else if (upperName.startsWith('DELL ') || upperName.startsWith('DELL')) brand = 'DELL'
    else if (upperName.startsWith('LENOVO ')) brand = 'LENOVO'
    
    let model = itemName
    if (brand !== 'OTHER') {
      model = itemName.substring(brand.length).trim()
    }
    
    let series = 'OTHER'
    const upperModel = model.toUpperCase()
    
    // HP Series
    if (upperName.includes('PROBOOK')) {
      series = 'PROBOOK'
    } else if (upperName.includes('ZBOOK')) {
      series = 'ZBOOK'
    } else if (upperName.includes('ELITEBOOK')) {
      series = 'ELITEBOOK'
    } else if (upperModel.match(/^\d{3}/)) {
      const firstDigit = upperModel.charAt(0)
      if (firstDigit === '3') series = '3XX'
      else if (firstDigit === '4') series = '4XX'
      else if (firstDigit === '5') series = '5XX'
      else if (firstDigit === '6') series = '6XX'
      else if (firstDigit === '7') series = '7XX'
      else if (firstDigit === '8') series = '8XX'
      else series = 'OTHER'
    } else if (upperModel.includes('65')) {
      series = '65X'
    } else if (upperModel.includes('84')) {
      series = '84X'
    } else if (upperModel.includes('85')) {
      series = '85X'
    }
    
    // Dell Series
    if (brand === 'DELL') {
      if (upperName.includes('LATITUDE')) {
        series = 'LATITUDE'
      } else if (upperName.includes('PRECISION')) {
        series = 'PRECISION'
      } else if (upperName.includes('OPTIPLEX')) {
        series = 'OPTIPLEX'
      } else if (upperName.includes('XPS')) {
        series = 'XPS'
      } else if (upperName.includes('INSPIRON')) {
        series = 'INSPIRON'
      } else if (upperName.includes('G-SERIES')) {
        series = 'G-SERIES'
      } else if (upperName.includes('VOSTRO')) {
        series = 'VOSTRO'
      } else if (upperModel.match(/^M\d+/)) {
        if (!upperName.includes('PRECISION')) {
          series = 'M-SERIES'
        }
      }
    }
    
    console.log(`${itemName} -> Brand: ${brand}, Model: ${model}, Series: ${series}`)
  })
  console.log('=== End Debug ===\n')
  
  const wb = await buildPricelistExcelWorkbook(mockItems, new Date())
  const buffer = await wb.xlsx.writeBuffer()
  
  const outputPath = path.resolve(process.cwd(), 'test_series_grouping.xlsx')
  fs.writeFileSync(outputPath, Buffer.from(buffer))
  
  console.log(`Excel file generated: ${outputPath}`)
  console.log('Grouping order should be: HP ProBook -> HP ZBook -> Dell Latitude -> Dell Precision')
  console.log('Please open this file to verify the series grouping.')
}

testNewFormat().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})