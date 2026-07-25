# Project Restructuring Guide

This document explains the restructuring from a monolithic Next.js app to a dual-deployment architecture with a separate backend.

## Architecture Overview

### Directory Structure
```
project-root/
├── frontend/           # Next.js app (deployed to Vercel)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/            # Express API (deployed to Render)
│   ├── src/
│   ├── package.json
│   └── .env.example
└── README.md / RESTRUCTURING.md
```

### Before
- Single Next.js app on Vercel
- All API routes in `/app/api/`
- Database logic in Next.js route handlers
- Auth handled in Next.js

### After
- **Frontend** (`/frontend`): Next.js on Vercel (no database access, no Mongoose)
- **Backend** (`/backend`): Express.js on Render (MongoDB, auth, business logic)
- Communication via HTTP REST API with cookie-based JWT auth

## Key Changes

### Frontend Changes

#### 1. API Wrapper (`lib/api.ts`)
All API calls now go through a centralized wrapper that:
- Points to backend via `NEXT_PUBLIC_API_URL`
- Includes cookies for JWT auth
- Provides typed function signatures

```typescript
// Before (local API call)
const res = await fetch('/api/products')

// After (backend API call)
const products = await api.get_products()
```

#### 2. Removed Frontend Files
These files have been removed or replaced:
- ✅ `middleware.ts` (backend auth now handles JWT verification)
- ✅ `lib/db.ts` (database access moved to backend only)
- ✅ `models/` directory (models moved to backend)
- ✅ API routes in `/app/api/` (all moved to backend):
  - `/app/api/admin/login/route.ts`
  - `/app/api/admin/logout/route.ts`
  - `/app/api/products/route.ts`
  - `/app/api/products/[id]/route.ts`
  - `/app/api/spec-options/route.ts`
  - `/app/api/spec-options/[id]/route.ts`
  - `/app/api/pricelist/route.ts`

#### 3. Kept API Routes
These routes remain in the frontend (file uploads only):
- `app/api/uploadthing/core.ts`
- `app/api/uploadthing/route.ts`

#### 4. Updated Dependencies
Frontend `package.json` now excludes:
- `mongoose` (database access removed)
- `mammoth` (pricelist parsing moved to backend)
- `jose` (JWT verification moved to backend middleware)

#### 4. Updated Components
**Checkout** (`app/checkout/checkout-client.tsx`):
- `handleSubmit()` now calls `api.create_order()` instead of just clearing cart
- Uploads deposit photo, then creates order with backend

**Admin Dashboard** (`app/rezq-admin/admin-dashboard.tsx`):
- `DashboardTab` fetches stats via `api.get_dashboard_stats()`
- `OrdersTab` fetches orders via `api.get_orders()` and updates status via `api.update_order_status()`
- `PricelistTab` allows admins to upload `.docx` files and preview parsed HTML
- Logout calls `api.logout()`

**Pricelist Management** (Admin and Public):
- Admin `PricelistTab` (`app/rezq-admin/pricelist-tab.tsx`): File input for `.docx`, uploads via `api.upload_pricelist(file)`
- Backend parses with Mammoth, stores as HTML, unpublishes previous pricelist
- Public page (`app/pricelist/page.tsx`): Fetches via `api.get_pricelist()`, renders `parsedHtml` with `dangerouslySetInnerHTML`
- Only one pricelist is published at a time; 404 with "لا توجد قائمة أسعار منشورة حالياً" if none exist

### Backend Structure (`/backend`)

```
backend/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── lib/
│   │   ├── auth.ts           # JWT token generation & verification
│   │   ├── db.ts             # MongoDB connection
│   │   └── validators.ts     # Zod schemas (copied from frontend)
│   ├── middleware/
│   │   └── auth.ts           # Express middleware for admin auth
│   ├── models/               # Mongoose models (copied from frontend)
│   │   ├── Product.ts
│   │   ├── Order.ts
│   │   ├── SpecOption.ts
│   │   └── Pricelist.ts
│   └── routes/               # API route handlers
│       ├── admin.ts          # Login/logout/session
│       ├── products.ts       # Product CRUD
│       ├── orders.ts         # Order CRUD
│       ├── spec-options.ts   # Spec option CRUD
│       ├── pricelist.ts      # Pricelist management
│       └── dashboard.ts      # Dashboard stats
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001  # Backend URL (local dev)
```

### Backend (`backend/.env.local`)
```
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/al-hussein

# Auth
JWT_SECRET=<generate with: openssl rand -base64 32>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000

# File uploads
UPLOADTHING_TOKEN=sk_live_...

# Server
PORT=3001
NODE_ENV=development
```

## Local Development

### Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   pnpm install
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   pnpm install
   ```

3. **Configure environment**
   - Copy `frontend/.env.example` → `frontend/.env.local` (frontend)
   - Copy `backend/.env.example` → `backend/.env.local` (backend)
   - Fill in required variables (especially `MONGODB_URI`, `JWT_SECRET`)

### Running

**Terminal 1 - Frontend**
```bash
cd frontend
pnpm dev
# Runs on http://localhost:3000
```

**Terminal 2 - Backend**
```bash
cd backend
pnpm dev
# Runs on http://localhost:3001
```

### Testing

1. Open http://localhost:3000/laptops
2. Add a product to cart
3. Go to checkout and submit order
4. Go to http://localhost:3000/rezq-admin
5. Login with credentials from `.env.local`
6. Check orders, update status

## Deployment

### Frontend (Vercel)

1. Ensure `NEXT_PUBLIC_API_URL` is set to backend URL
   - Development: `http://localhost:3001` (for local testing)
   - Production: `https://your-backend.render.com` (after backend deploys)

2. Deploy to Vercel (auto-deployed from git push)

3. Update `NEXT_PUBLIC_API_URL` env var in Vercel project settings

### Backend (Render)

1. **Create Web Service on Render**
   - Connect GitHub repository
   - Set root directory to `backend/`
   - Set build command: `pnpm install && pnpm build`
   - Set start command: `pnpm start`

2. **Set environment variables** (Settings → Environment)
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `UPLOADTHING_TOKEN`
   - `FRONTEND_URL` (point to Vercel frontend URL)
   - `NODE_ENV=production`

3. **Deploy** (Render auto-deploys on git push to the backend directory)

4. **Get backend URL** (e.g., `https://al-hussein-backend.onrender.com`)

5. **Update frontend** `NEXT_PUBLIC_API_URL` env var on Vercel

## API Communication Details

### Authentication Flow

1. Frontend: `POST /admin/login` with username/password
2. Backend: Validates credentials, generates JWT, sets httpOnly cookie
3. Frontend: Automatically includes cookie in subsequent requests (due to `credentials: 'include'`)
4. Backend: Verifies JWT in cookie, allows/denies request

### CORS Policy

- **Origin**: Only `FRONTEND_URL` (set in backend `.env`)
- **Credentials**: `true` (allows cookies)
- **Methods**: GET, POST, PATCH, DELETE
- **Headers**: Content-Type

### Error Handling

Frontend API wrapper:
- Catches non-200 responses
- Parses error JSON
- Throws with error message
- Components can `try/catch` or handle with loading state

## Database Migration

No database migration needed! The Mongoose models are identical on both frontend and backend.

### Models
- `Product` - Laptop models and specifications
- `Order` - Customer orders with items and status tracking
- `SpecOption` - Selectable options (CPU/GPU/RAM/Storage)
- `Pricelist` - Published price lists in HTML format

## Testing Checklist

- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] Can fetch products from checkout
- [ ] Can submit order (uploads photo + creates order)
- [ ] Can login to admin dashboard
- [ ] Dashboard displays order stats
- [ ] Can view orders list and filter by status
- [ ] Can update order status
- [ ] Can create/edit products
- [ ] Logout works correctly
- [ ] Frontend deployable to Vercel
- [ ] Backend deployable to Render

## Troubleshooting

### "Failed to fetch" when submitting order
1. Check backend is running on correct port (3001)
2. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
3. Check browser console for CORS errors
4. Verify backend `.env` has correct `FRONTEND_URL`

### "Unauthorized" error in admin dashboard
1. Make sure you're logged in (check cookies)
2. Check backend `.env` has correct `JWT_SECRET`
3. Verify token hasn't expired (7 days)
4. Try logging in again

### "MONGODB_URI is not set"
1. Check backend `.env.local` exists
2. Verify MongoDB connection string is correct
3. Make sure network access is allowed in MongoDB Atlas

### "Cannot find module" errors in backend
1. Run `pnpm install` in `backend/` directory
2. Check `backend/tsconfig.json` is correct
3. Verify import paths use `.js` extensions in ES modules

## Architectural Guarantees

After restructuring, the following are guaranteed:

### Frontend (`/frontend`) 
- ✅ **Zero database access**: No Mongoose, no `lib/db.ts`, no direct MongoDB connections
- ✅ **No mock data fallbacks**: Components show clear error states on API failures, never silently use fake data
- ✅ **All data from backend**: Every component fetches from the API via `lib/api.ts` wrapper
- ✅ **No JWT verification code**: Token verification happens only on the backend

### Backend (`/backend`)
- ✅ **Owns all data logic**: All Mongoose models, database access, business logic
- ✅ **Handles auth**: JWT generation, verification, and session management
- ✅ **CORS protected**: Only accepts requests from the configured `FRONTEND_URL`

### UI/Styling (Unchanged)
No visual changes were made. All components retain:
- ✅ Tailwind classes and styling
- ✅ Component layout and structure
- ✅ Button styles and interactions
- ✅ Form styling and validation messages
- ✅ Loading and error state displays

Only data-fetching logic was refactored to use the backend API.

## Next Steps

After restructuring is complete:
1. Test thoroughly in local development
2. Deploy backend to Render first
3. Update frontend `NEXT_PUBLIC_API_URL` env var
4. Deploy frontend to Vercel
5. Monitor logs for any issues
6. Set up error tracking (Sentry/etc) if needed

## Additional Resources

- Backend README: `backend/README.md`
- API Wrapper: `lib/api.ts`
- Checkout Flow: `app/checkout/checkout-client.tsx`
- Admin Dashboard: `app/rezq-admin/admin-dashboard.tsx`
- Express Framework: https://expressjs.com/
- Render Deployment: https://render.com/
- MongoDB: https://www.mongodb.com/
