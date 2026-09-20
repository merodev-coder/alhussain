// Central mapping from a category/section slug (as used across the homepage
// category tiles and product sections) to the page it should link to.
//
// "laptops" is the only slug backed by the `Product` model — every Product
// in this store is a laptop by design (cpu/gpu/ram/storage fields), so it
// keeps using the full `/laptops` catalog page with its spec filters.
//
// The other 7 slugs (bags, mice, ram, storage, batteries, chargers,
// monitors) are standalone items backed by the `Accessory` model, tagged
// with a matching `homeSection`. They each get their own page at
// `/category/[slug]`, which fetches only accessories tagged for that
// section — so "شاشات" only ever shows monitors, never a laptop.
export function getCategoryHref(slug: string): string {
  if (slug === 'laptops') return '/laptops'
  if (CATEGORY_PAGE_SLUGS.includes(slug as CategoryPageSlug)) {
    return `/category/${slug}`
  }
  return '/laptops'
}

export const CATEGORY_PAGE_SLUGS = [
  'bags',
  'mice',
  'ram',
  'storage',
  'batteries',
  'chargers',
  'monitors',
] as const

export type CategoryPageSlug = (typeof CATEGORY_PAGE_SLUGS)[number]

export const CATEGORY_PAGE_META: Record<
  CategoryPageSlug,
  { title: string; description: string }
> = {
  bags: {
    title: 'شنط اللابتوب',
    description: 'شنط وحقائب لحماية جهازك أثناء التنقل، بخامات متينة ومقاسات تناسب كل الأجهزة',
  },
  mice: {
    title: 'الماوسات',
    description: 'ماوسات سلكية ولاسلكية للألعاب والاستخدام اليومي بدقة تتبع عالية',
  },
  ram: {
    title: 'الرامات',
    description: 'ذاكرة رام لترقية أداء جهازك وتشغيل البرامج الثقيلة بسلاسة',
  },
  storage: {
    title: 'الهاردات ووحدات التخزين',
    description: 'هاردات SSD وفلاشات وذاكرات تخزين بمساحات تكفي كل احتياجاتك',
  },
  batteries: {
    title: 'بطاريات اللابتوب',
    description: 'بطاريات أصلية وبديلة متوافقة مع مختلف موديلات اللابتوب',
  },
  chargers: {
    title: 'الشواحن',
    description: 'شواحن أصلية وبديلة بمعدلات شحن آمنة لكل أنواع اللابتوب',
  },
  monitors: {
    title: 'الشاشات',
    description: 'شاشات لابتوب بديلة وشاشات خارجية بجودة عرض عالية',
  },
}
