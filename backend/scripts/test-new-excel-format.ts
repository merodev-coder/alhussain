import fs from 'fs'
import path from 'path'
import { buildPricelistExcelWorkbook } from '../src/lib/pricelist-excel.js'

// Mock data similar to what would come from the database
const mockItems = [
  {
    id: '1',
    index: 1,
    name: 'HP 645 G1',
    brand: 'HP',
    model: '645 G1',
    cpu: 'AMD A10-5300 (5th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '14.1"',
    gpu: 'AMD 7620 - Up to 8GB',
    price: 4500,
    category: 'Budget Range | الفئة الاقتصادية'
  },
  {
    id: '2',
    index: 2,
    name: 'HP 255 G3',
    brand: 'HP',
    model: '255 G3',
    cpu: 'AMD A4-53007 (5th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '14.1"',
    gpu: 'AMD 7620 - Up to 8GB',
    price: 4500,
    category: 'Budget Range | الفئة الاقتصادية'
  },
  {
    id: '3',
    index: 3,
    name: 'HP 840 G1',
    brand: 'HP',
    model: '840 G1',
    cpu: 'Core i5 (4th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '15.6"',
    gpu: 'AMD HD 8470M - 1GB إلى 8GB',
    price: 5500,
    category: 'Budget Range | الفئة الاقتصادية'
  },
  {
    id: '4',
    index: 4,
    name: 'DELL 3470',
    brand: 'DELL',
    model: '3470',
    cpu: 'Core i5 (6th Gen)',
    ram: '8GB',
    storage: '256GB SSD',
    screen: '14.1"',
    gpu: 'Intel HD 620 - 1GB إلى 2GB',
    price: 6500,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '5',
    index: 5,
    name: 'DELL M4800',
    brand: 'DELL',
    model: 'M4800',
    cpu: 'Core i7 (4th Gen)',
    ram: '8GB',
    storage: '500GB HDD',
    screen: '15.6"',
    gpu: 'N.VIDIA K1000 - 2GB إلى 20GB',
    price: 7000,
    category: 'Mid Range | الفئة المتوسطة'
  },
  {
    id: '6',
    index: 6,
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
  }
]

async function testNewFormat() {
  console.log('Generating Excel file with new format...')
  
  const wb = await buildPricelistExcelWorkbook(mockItems, new Date())
  const buffer = await wb.xlsx.writeBuffer()
  
  const outputPath = path.resolve(process.cwd(), 'test_new_format.xlsx')
  fs.writeFileSync(outputPath, Buffer.from(buffer))
  
  console.log(`Excel file generated: ${outputPath}`)
  console.log('Please open this file and compare it with the reference image.')
}

testNewFormat().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})