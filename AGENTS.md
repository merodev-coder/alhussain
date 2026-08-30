# AlHussain Laptops - Agent Documentation

## Project Overview
Arabic-language (RTL) e-commerce site selling laptops in Egypt with a public storefront and hidden admin dashboard at `/rezq-admin`. Next.js 16 frontend (Vercel) + Express/TypeScript backend (Render) + MongoDB (Mongoose) + UploadThing for file storage.

## Architecture
- **Frontend**: Next.js 16 (App Router), deployed to Vercel
- **Backend**: Express + TypeScript, deployed to Render
- **Database**: MongoDB via Mongoose
- **File Storage**: UploadThing
- **Auth**: JWT-in-httpOnly-cookie

## Project Structure
```
alhussain-main/
├── frontend/        Next.js 16 (App Router)
│   ├── app/          pages, layouts, API routes (uploadthing only)
│   ├── components/   shared UI (shadcn/ui based)
│   ├── lib/           api.ts (backend fetch wrapper), cart-context.tsx, types.ts
│   └── public/
└── backend/          Express + TypeScript
    ├── src/
    │   ├── index.ts        Express app entry, route mounting, DB connect
    │   ├── lib/             db.ts (Mongoose connect), auth.ts (JWT), validators.ts (zod)
    │   ├── middleware/      auth.ts (requireAdmin)
    │   ├── models/          Mongoose schemas: Product, Order, SpecOption, Pricelist
    │   └── routes/          admin.ts, products.ts, orders.ts, spec-options.ts, pricelist.ts, dashboard.ts
    └── scripts/             generate-password-hash.ts
```

## Build Commands

### Backend
```bash
cd backend
npm run build  # TypeScript compilation
npm run dev    # Development with watch mode
npm start      # Production (runs dist/index.js)
```

### Frontend
```bash
cd frontend
npm run build  # Next.js build
npm run dev    # Development server
```

## Verification Steps
1. Run backend build: `cd backend && npm run build`
2. Check for TypeScript errors
3. Test authentication flows
4. Verify rate limiting is working
5. Test pagination on products and orders endpoints
6. Verify cart persistence across page refreshes

## Security Notes
- All admin routes now protected with `requireAdmin` middleware
- Passwords stored as bcrypt hashes (use `npx tsx scripts/generate-password-hash.ts` to generate)
- Rate limiting implemented:
  - Global: 100 requests per 15 minutes per IP
  - Login: 5 attempts per 15 minutes per IP
  - Orders: 10 per hour per IP
- Order prices calculated server-side from DB, never trusted from client
- Cart persisted to localStorage with SSR guards

## Environment Variables (Backend)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (generate new one)
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of admin password (use script to generate)
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port (default 3001)
- `NODE_ENV` - Environment (development/production)
- `UPLOADTHING_TOKEN` - UploadThing API token

## Critical Security Actions Required
Since a live `.env` file was found committed, you MUST rotate these secrets before deployment:
1. Generate new `JWT_SECRET` (e.g., `openssl rand -base64 32`)
2. Generate new `ADMIN_PASSWORD_HASH` using `npx tsx scripts/generate-password-hash.ts`
3. Rotate `MONGODB_URI` (change MongoDB password)
4. Rotate `UPLOADTHING_TOKEN` (get new token from UploadThing dashboard)

## Pagination Implementation
- Products endpoint: `GET /api/products?page=1&limit=24` (default 24, max 100)
- Orders endpoint: `GET /api/orders?page=1&limit=20` (default 20, max 100)
- Response shape: `{ items: [], total: number, page: number, pages: number }`
- Frontend updated to handle new paginated response shape

## Database Indexes
- Product: `{ visible: 1, createdAt: -1 }` and text index on `name`/`description`
- Order: `{ status: 1, createdAt: -1 }` and unique index on `orderNumber`

## Code Conventions
- All user-facing text is Arabic (RTL)
- shadcn/ui components with Tailwind styling
- Brand color: teal accent `#0FC7C1`
- Validation using zod schemas in `backend/src/lib/validators.ts`
- IDs: MongoDB `_id` transformed to `id` (string) in `toJSON`/`toObject`
- File uploads always via UploadThing

## API Response Changes
After security fixes, some endpoints now return paginated responses:
- `GET /api/products` now returns `{ items, total, page, pages }`
- `GET /api/orders` now returns `{ items, total, page, pages }`
- Frontend code updated to handle both old array responses and new paginated objects for backward compatibility during transition
