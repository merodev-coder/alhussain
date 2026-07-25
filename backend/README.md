# Al-Hussein Laptop Backend

Express.js API server for the Al-Hussein Laptop e-commerce platform.

## Setup

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (generate with: `openssl rand -base64 32`)
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password
- `UPLOADTHING_TOKEN` - UploadThing API token
- `FRONTEND_URL` - Frontend URL (for CORS) — default: http://localhost:3000

### 3. Run Development Server

```bash
pnpm dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

All endpoints are prefixed with `/api/` or `/admin/`

### Products
- `GET /api/products` - List all products (with optional `search` query)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PATCH /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List all orders (admin only, with optional `status` query)
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id` - Update order status (admin only)

### Spec Options
- `GET /api/spec-options` - List all spec options (with optional `type` query)
- `POST /api/spec-options` - Create spec option (admin only)
- `PATCH /api/spec-options/:id` - Update spec option (admin only)
- `DELETE /api/spec-options/:id` - Delete spec option (admin only)

### Pricelist
- `GET /api/pricelist` - Get current pricelist
- `POST /api/pricelist` - Publish new pricelist (admin only)

### Dashboard
- `GET /api/dashboard-stats` - Get dashboard statistics (admin only)

### Admin Auth
- `POST /admin/login` - Login with username/password
- `POST /admin/logout` - Logout
- `GET /admin/session` - Check current session

## Authentication

Admin endpoints use JWT-based authentication with httpOnly cookies.

1. POST to `/admin/login` with `username` and `password`
2. Backend sets `ah_admin_session` cookie with JWT token
3. Frontend must send requests with `credentials: 'include'` to include the cookie
4. Token expires after 7 days

## CORS

CORS is configured to allow requests only from the frontend URL specified in `FRONTEND_URL` environment variable. All admin requests require cookies to be included.

## Database Models

- **Product** - Laptop models with specifications
- **Order** - Customer orders with items and status
- **SpecOption** - CPU/GPU/RAM/Storage options for filtering
- **Pricelist** - Published price lists in HTML format

## Deployment

### Render

1. Push backend code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables (copy from `.env.example`)
5. Set start command: `pnpm start` (or `npm start`)
6. Deploy

Update the frontend's `NEXT_PUBLIC_API_URL` to point to the Render backend URL after deployment.

## Troubleshooting

### "MONGODB_URI is not set"
Make sure `.env.local` is created and has the correct MongoDB connection string.

### "JWT_SECRET is not set"
Generate a secret: `openssl rand -base64 32` and add it to `.env.local`.

### CORS errors
Make sure `FRONTEND_URL` in backend matches the actual frontend URL, and the frontend is sending requests with `credentials: 'include'`.

### Orders not appearing
Make sure you're authenticated (have valid JWT cookie) when fetching orders as admin.
