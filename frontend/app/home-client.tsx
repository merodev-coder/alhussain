'use client'

import React, { useEffect, useState, useMemo } from 'react'
import StoreLayout from '@/components/store-layout'
import HeroSection from '@/components/Hero/HeroSection'
import CategoryRow from '@/components/CategoryRow/CategoryRow'
import ProductSection from '@/components/ProductSection/ProductSection'
import TrustSection from '@/components/home/trust-section'
import { api } from '@/lib/api'
import type { Product, HeroSlide } from '@/lib/types'

// Curated default products if DB has none for a section
const SAMPLE_PRODUCTS: Record<string, Product[]> = {
  graphics: [
    {
      id: 'g-1',
      name: 'Dell Precision 7550 Workstation',
      price: 34500,
      description: 'أقوى أجهزة الرندر والتصميم الهندسي 3D',
      cpu: 'Core i7-10850H',
      gpu: 'NVIDIA Quadro RTX 4000 (8GB)',
      ram: '32GB DDR4',
      storage: '1TB NVMe SSD',
      photos: [
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'PRO',
      visible: true,
    },
    {
      id: 'g-2',
      name: 'HP ZBook Fury 15 G7',
      price: 38000,
      description: 'محطة عمل متنقلة مخصصة لبرامج أدوبي والمونتاج',
      cpu: 'Core i9-10885H',
      gpu: 'RTX 5000 16GB GDDR6',
      ram: '64GB RAM',
      storage: '1TB SSD M.2',
      photos: [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'TOP',
      visible: true,
    },
    {
      id: 'g-3',
      name: 'Lenovo ThinkPad P15 Gen 2',
      price: 32000,
      description: 'أداء هندسي جبار مع تبريد ثنائي فائق',
      cpu: 'Core i7-11800H',
      gpu: 'RTX A3000 6GB',
      ram: '32GB RAM',
      storage: '512GB SSD',
      photos: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'مميز',
      visible: true,
    },
    {
      id: 'g-4',
      name: 'ASUS ROG Zephyrus G14',
      price: 29500,
      description: 'لابتوب ألعاب وجرافيك خفيف وعالي الأداء',
      cpu: 'Ryzen 7 5800HS',
      gpu: 'RTX 3060 6GB',
      ram: '16GB RAM',
      storage: '1TB SSD',
      photos: [
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'limited',
      badge: 'NEW',
      visible: true,
    },
  ],
  business: [
    {
      id: 'b-1',
      name: 'Lenovo ThinkPad T14s Gen 2',
      price: 18500,
      description: 'لابتوب الأعمال الأول عالمياً بوزن فائق الخفة',
      cpu: 'Core i7-1165G7',
      gpu: 'Intel Iris Xe',
      ram: '16GB RAM',
      storage: '512GB SSD',
      photos: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'الأكثر طلباً',
      visible: true,
    },
    {
      id: 'b-2',
      name: 'Dell Latitude 7420 Carbon',
      price: 17200,
      description: 'هيكل كاربون فايبر وشاشة فائقة الوضوح',
      cpu: 'Core i5-1145G7 vPro',
      gpu: 'Intel Iris Xe',
      ram: '16GB RAM',
      storage: '256GB NVMe',
      photos: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'فرز أول',
      visible: true,
    },
    {
      id: 'b-3',
      name: 'HP EliteBook 840 G8',
      price: 19800,
      description: 'جسم ألومنيوم أنيق وحماية بيانات متقدمة',
      cpu: 'Core i7-1185G7',
      gpu: 'Intel Iris Xe',
      ram: '16GB RAM',
      storage: '512GB SSD',
      photos: [
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'NEW',
      visible: true,
    },
    {
      id: 'b-4',
      name: 'Dell XPS 13 9305',
      price: 21500,
      description: 'شاشة InfinityEdge فائقة الجمال وحجم مدمج',
      cpu: 'Core i7-1165G7',
      gpu: 'Intel Iris Xe',
      ram: '16GB RAM',
      storage: '512GB SSD',
      photos: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'مميز',
      visible: true,
    },
  ],
  accessories: [
    {
      id: 'a-1',
      name: 'Logitech MX Master 3S Wireless',
      price: 3950,
      description: 'ماوس لاسلكي احترافي فائق الدقة وهدوء تام',
      cpu: 'بلوتوث + USB Bolt',
      gpu: '8000 DPI',
      ram: 'شحن Type-C',
      storage: 'بطارية 70 يوم',
      photos: [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'أصلي',
      visible: true,
    },
    {
      id: 'a-2',
      name: 'Dell Thunderbolt 4 Dock WD22TB4',
      price: 7800,
      description: 'دوك ستيشن لتوصيل حتى 4 شاشات بدقة 4K',
      cpu: 'Thunderbolt 4',
      gpu: 'يدعم 4K@60Hz',
      ram: '180W Adapter',
      storage: 'منافذ متعددة',
      photos: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'فرز أول',
      visible: true,
    },
    {
      id: 'a-3',
      name: 'حقيبة لابتوب ThinkPad Professional',
      price: 1250,
      description: 'حقيبة ظهر أصلية مقاومة للماء مع حماية ضد الصدمات',
      cpu: 'تتسع حتى 15.6 بوصة',
      gpu: 'خامات مقاومة للقطع',
      ram: 'مريحة للظهر',
      storage: 'جيوب متعددة',
      photos: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'أصلي',
      visible: true,
    },
  ],
  batteries: [
    {
      id: 'bat-1',
      name: 'بطارية Dell Latitude 7490 الأصلية 60Wh',
      price: 1850,
      description: 'بطارية أصلية استيراد خلايا كورية عالية الكفاءة',
      cpu: 'سعة 60Wh',
      gpu: 'جهد 7.6V',
      ram: 'ضمان 6 شهور',
      storage: 'أصلية 100%',
      photos: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'أصلي',
      visible: true,
    },
    {
      id: 'bat-2',
      name: 'شاشة لابتوب 15.6 بوصة IPS FHD 144Hz',
      price: 3600,
      description: 'شاشة مخصصة للألعاب والمونتاج ألوان sRGB 100%',
      cpu: '15.6 بوصة FHD',
      gpu: '144Hz Refresh',
      ram: '30 Pin eDP',
      storage: 'IPS Panel',
      photos: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'جديد',
      visible: true,
    },
    {
      id: 'bat-3',
      name: 'بطارية ThinkPad T480 الخارجية 72Wh',
      price: 2100,
      description: 'أقصى سعة ممكنة تدوم حتى 14 ساعة عمل',
      cpu: 'سعة 72Wh 6-Cell',
      gpu: 'موديل 61++',
      ram: 'ضمان استبدال',
      storage: 'أصلية',
      photos: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'فرز أول',
      visible: true,
    },
  ],
  storage: [
    {
      id: 's-1',
      name: 'Samsung 980 PRO 1TB NVMe PCIe 4.0',
      price: 4600,
      description: 'سرعة قراءة فائقة تصل إلى 7000 ميجابايت/ثانية',
      cpu: 'PCIe Gen 4.0 x4',
      gpu: 'قراءة 7000 MB/s',
      ram: 'كتابة 5000 MB/s',
      storage: '1TB M.2 2280',
      photos: [
        'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'الأسرع',
      visible: true,
    },
    {
      id: 's-2',
      name: 'Crucial RAM 16GB DDR4 3200MHz Laptop',
      price: 1850,
      description: 'رام لابتوب أصلية لتحسين سرعة واستجابة الجهاز',
      cpu: 'DDR4 SODIMM',
      gpu: 'تردد 3200MHz',
      ram: '16GB Module',
      storage: 'CL22 1.2V',
      photos: [
        'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'أصلي',
      visible: true,
    },
    {
      id: 's-3',
      name: 'Kingston Fury Impact 32GB DDR4 3200MHz',
      price: 3400,
      description: 'رام جيمنج احترافية للمهام الثقيلة والرندر',
      cpu: 'DDR4 SODIMM',
      gpu: 'تردد 3200MHz',
      ram: '32GB Module',
      storage: 'CL20 Gaming',
      photos: [
        'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
      ],
      stockStatus: 'in_stock',
      badge: 'GAMING',
      visible: true,
    },
  ],
}

export default function HomeClient() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  useEffect(() => {
    // Fetch hero slides
    api
      .get_hero_slides()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setSlides(res)
        }
      })
      .catch(() => {})

    // Fetch all products from DB
    api
      .get_products('', 1, 100)
      .then(res => {
        const items = Array.isArray(res) ? res : res.items || []
        setDbProducts(items)
      })
      .catch(() => {})
  }, [])

  // Organize products into the 5 sections
  const sectionProducts = useMemo(() => {
    const result: Record<string, Product[]> = {
      graphics: [],
      business: [],
      accessories: [],
      batteries: [],
      storage: [],
    }

    // 1. First prioritize products explicitly assigned with homeSection
    for (const p of dbProducts) {
      if (p.homeSection && result[p.homeSection]) {
        result[p.homeSection].push(p)
      }
    }

    // 2. Fallback: if any section has fewer than 3 items, fill with matching DB items or curated items
    const keys: Array<keyof typeof result> = [
      'graphics',
      'business',
      'accessories',
      'batteries',
      'storage',
    ]

    for (const key of keys) {
      if (result[key].length < 3) {
        // Find matching products from DB by name/cpu/gpu keywords
        const keywords: Record<string, string[]> = {
          graphics: ['rtx', 'gtx', 'quadro', 'gaming', 'precision', 'zbook', 'workstation'],
          business: ['thinkpad', 'latitude', 'elitebook', 'business', 'xps', 'probook'],
          accessories: ['mouse', 'keyboard', 'dock', 'bag', 'ماوس', 'كيبورد', 'حقيبة'],
          batteries: ['battery', 'screen', 'شاشة', 'بطارية', 'adapter', 'شاحن'],
          storage: ['ssd', 'ram', 'nvme', 'رام', 'هارد', 'تخزين'],
        }

        const matches = dbProducts.filter(p => {
          if (p.homeSection) return false
          const text = `${p.name} ${p.description} ${p.cpu} ${p.gpu}`.toLowerCase()
          return keywords[key].some(kw => text.includes(kw))
        })

        const combined = [...result[key], ...matches]
        // If still fewer than 3, add sample items
        if (combined.length < 3) {
          result[key] = [...combined, ...(SAMPLE_PRODUCTS[key] || [])]
        } else {
          result[key] = combined
        }
      }
    }

    return result
  }, [dbProducts])

  return (
    <StoreLayout>
      {/* 1. Hero Section with Dual-Timer Carousel */}
      <HeroSection slides={slides} />

      {/* 2. Category Quick-Access Section (Below Hero) */}
      <CategoryRow />

      {/* 3. The 5 Product Sections */}
      <ProductSection
        id="section-graphics"
        title="لابتوبات جرافيك"
        sectionKey="graphics"
        categorySlug="graphics"
        products={sectionProducts.graphics}
      />

      <ProductSection
        id="section-business"
        title="لابتوبات بزنس"
        sectionKey="business"
        categorySlug="business"
        products={sectionProducts.business}
      />

      <ProductSection
        id="section-accessories"
        title="إكسسوارات"
        sectionKey="accessories"
        categorySlug="accessories"
        products={sectionProducts.accessories}
      />

      <ProductSection
        id="section-batteries"
        title="بطاريات وشاشات"
        sectionKey="batteries"
        categorySlug="batteries"
        products={sectionProducts.batteries}
      />

      <ProductSection
        id="section-storage"
        title="تخزين ورام"
        sectionKey="storage"
        categorySlug="storage"
        products={sectionProducts.storage}
      />

      {/* 4. Trust & Warranty Section */}
      <TrustSection />
    </StoreLayout>
  )
}
