# PROJECT_CONTEXT.md — AlHussain Laptops

Read this fully before making any changes. This is the map of the project: what exists, how it's structured, what conventions to follow, and what's already known to be broken (see the linked audit). Do not assume standard Next.js full-stack conventions apply — this project deliberately splits frontend and backend into two separately-deployed services.

## What this project is

An Arabic-language (RTL) e-commerce site selling laptops (custom-spec configurable) in Egypt, with a public storefront and a hidden admin dashboard at `/rezq-admin`. Customers browse laptops, add to cart, and check out with either home delivery or in-store pickup; payment is currently manual (bank transfer / InstaPay number shown, customer uploads a receipt screenshot for admin review).

## Architecture

```
alhussain-main/
├── frontend/        Next.js 16 (App Router), deployed to Vercel
│   ├── app/          pages, layouts, API routes (uploadthing only)
│   ├── components/   shared UI (shadcn/ui based)
│   ├── lib/           api.ts (backend fetch wrapper), cart-context.tsx, types.ts
│   └── public/
└── backend/          Express + TypeScript, deployed to Render
    ├── src/
    │   ├── index.ts        Express app entry, route mounting, DB connect
    │   ├── lib/             db.ts (Mongoose connect), auth.ts (JWT), validators.ts (zod)
    │   ├── middleware/      auth.ts (requireAdmin — CURRENTLY UNUSED ANYWHERE, see audit)
    │   ├── models/          Mongoose schemas: Product, Order, SpecOption, Pricelist
    │   └── routes/          admin.ts, products.ts, orders.ts, spec-options.ts, pricelist.ts, dashboard.ts
```

**Critical fact:** the frontend has NO direct database access. It talks to the backend exclusively via `frontend/lib/api.ts`, which wraps `fetch()` calls to `process.env.NEXT_PUBLIC_API_URL` with `credentials: 'include'` for cookie-based auth. Never add Mongoose or direct DB calls to the frontend — always add a backend route and call it through `lib/api.ts`.

## Auth model

- Admin logs in via `POST /admin/login` (username/password from env vars) → backend signs a JWT (using `jose`) → sets it as an httpOnly cookie `ah_admin_session`.
- `backend/src/middleware/auth.ts` exports `requireAdmin`, which is meant to protect admin-only routes by verifying that cookie. **As of the current codebase, this middleware is not applied to any route — this is a known critical bug, see PROMPTS_AND_AUDIT.md Prompt 1, section 1.**
- File uploads (product photos) go through UploadThing (`frontend/app/api/uploadthing/core.ts`), which is meant to check the admin session server-side before allowing an upload — currently this check is commented out (also a known bug).

## Data models (current, before Prompt 2 additions)

- **Product**: name, price, description, cpu, gpu, ram, storage, photos[], stockStatus (`in_stock`/`limited`/`out_of_stock`), discountBadge, visible.
- **Order**: orderNumber (auto-generated `ORD-{timestamp}`), customerName, phone (Egyptian format validated), address, governorate (free string, no cost logic), deliveryMethod (`shipping`/`pickup`), depositPhotoUrl, items[] (productId/name/price/qty — currently trusts client-submitted price, known bug), total (also client-trusted, known bug), status (`pending`/`confirmed`/`declined`/`shipped`/`completed`).
- **SpecOption**: type (`cpu`/`gpu`/`ram`/`storage`), value, active — powers admin-managed dropdown options used when building product specs.
- **Pricelist**: an uploaded `.docx` parsed via Mammoth into HTML and shown on a public pricelist page; only one can be `published` at a time.

Models Prompt 2 will add: `Addon` (attachable extras like extra RAM/SSD tied to a laptop purchase), `ShippingRate` (cost per محافظة), `Accessory` (standalone sellable items like bags/mice, independent of laptops), `InventoryLog` (audit trail for جرد/stock adjustments).

## Conventions to follow

- **Language/RTL**: All customer-facing and admin UI text is Arabic, right-to-left. Match existing phrasing style (see error messages in `validators.ts` and route handlers — they're all Arabic).
- **Component style**: shadcn/ui components (`components/ui/*`), Tailwind for styling, existing brand color is a teal accent (`#0FC7C1` appears repeatedly) — don't introduce new design tokens without checking `app/globals.css` first.
- **Admin dashboard pattern**: Each admin feature is a "tab" component (e.g. `products-tab.tsx`, `pricelist-tab.tsx`) rendered inside `admin-dashboard.tsx`. New admin features (Addons, Shipping, Accessories, جرد) should follow this same tab pattern — a table/grid view with a modal or inline form for create/edit, matching `products-tab.tsx` as the reference implementation since it's the most complete CRUD example in the codebase.
- **Validation**: All backend input validation uses `zod` schemas in `backend/src/lib/validators.ts`. Add new schemas there, don't inline validation in route handlers.
- **IDs**: MongoDB `_id` is always transformed to `id` (string) in `toJSON`/`toObject` — frontend code should only ever reference `.id`, never `._id`.
- **File uploads**: Always via UploadThing, never store files directly on the Express server's filesystem (Render's filesystem is ephemeral).

## Known bugs (full detail in PROMPTS_AND_AUDIT.md — do not silently "fix" these unless the active prompt asks for it, to keep changes scoped and reviewable)

1. `requireAdmin` middleware unused — all write/admin routes are public.
2. `cookie-parser` missing — session cookie is never actually read by the backend.
3. Order `price`/`total` trusted from client, never recalculated server-side.
4. UploadThing admin auth check commented out on `productPhotos` router.
5. Plaintext password comparison, hardcoded fallback admin credentials.
6. No rate limiting anywhere despite `express-rate-limit` being installed.
7. No pagination on products/orders list endpoints.
8. Cart is in-memory React state only, lost on refresh.
9. Governorate has no associated shipping cost.
10. No addons, accessories, inventory, or multi-DB failover systems exist yet.

## Deployment

- Frontend → Vercel, env var `NEXT_PUBLIC_API_URL` points to the backend's Render URL.
- Backend → Render, `backend/vercel.json` exists but the README/RESTRUCTURING.md confirm backend actually deploys to Render, not Vercel (double check this if it's ambiguous when you look — the file naming is inconsistent with the stated deployment target).
- CORS on the backend is locked to a single `FRONTEND_URL` origin via `cors({ origin: FRONTEND_URL, credentials: true })`.

## Before you start any prompt

- Rotate all secrets found in any `.env` file included in the project archive — a live `.env` (not `.env.example`) was found committed, which means MongoDB URI, JWT secret, admin password, and UploadThing token should all be treated as already compromised.
- Read `RESTRUCTURING.md` in the project root for the original frontend/backend split rationale if you need more history on why the architecture is shaped this way.
