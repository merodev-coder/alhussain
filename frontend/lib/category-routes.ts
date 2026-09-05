// Central mapping from a category/section slug (as used across the homepage
// category tiles and product sections) to the page it should link to.
//
// Laptop-related sections (graphics, business) route to the full laptops
// catalog, while everything else (accessories, batteries & screens,
// storage & RAM) routes to the accessories catalog.
const LAPTOP_SECTION_SLUGS = new Set(['graphics', 'business', 'laptops'])

export function getCategoryHref(slug: string): string {
  if (LAPTOP_SECTION_SLUGS.has(slug)) return '/laptops'
  return '/accessories'
}
