// Central mapping from a category/section slug (as used across the homepage
// category tiles and product sections) to the page it should link to.
//
// All 8 home sections (laptops, bags, mice, ram, storage, batteries,
// chargers, monitors) live on the same `Product` model via `homeSection`,
// and the single `/laptops` route already lists every `Product` document
// (its name is historical — it predates the wider category set). The
// separate `/accessories` page is backed by an entirely different
// `Accessory` model managed independently in the dashboard, so it must
// never be used as a destination for these categories.
export function getCategoryHref(_slug: string): string {
  return '/laptops'
}
