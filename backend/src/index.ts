import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { logger, logError, logInfo, logWarn } from './lib/logger.js'
import 'dotenv/config'
import { connectDB } from './lib/db.js'
import { seedShippingRatesIfEmpty } from './lib/seed-shipping.js'
import adminRoutes from './routes/admin.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import specOptionsRoutes from './routes/spec-options.js'
import pricelistRoutes from './routes/pricelist.js'
import dashboardRoutes from './routes/dashboard.js'
import addonsRoutes from './routes/addons.js'
import accessoriesRoutes from './routes/accessories.js'
import shippingRatesRoutes from './routes/shipping-rates.js'
import inventoryRoutes from './routes/inventory.js'
import debugRoutes from './routes/debug.js'
import settingsRoutes from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Global rate limiter: 100 requests per 15 minutes per IP
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', globalRateLimit)

// Routes
app.use(adminRoutes)
app.use(productsRoutes)
app.use(ordersRoutes)
app.use(specOptionsRoutes)
app.use(pricelistRoutes)
app.use(dashboardRoutes)
app.use(addonsRoutes)
app.use(accessoriesRoutes)
app.use(shippingRatesRoutes)
app.use(inventoryRoutes)
app.use('/api/debug', debugRoutes)
app.use(settingsRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Global error handler (must be after all routes)
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('Unhandled error', err)
  res.status(500).json({ error: 'حدث خطأ في الخادم' })
})

// Connect to DB and start server
async function start() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

    // For testing: warn but don't fail if admin credentials missing
    // (TODO: Re-enable strict validation for production)
    if (!adminUsername || !adminPasswordHash) {
      logWarn('Server start', 'ADMIN_USERNAME or ADMIN_PASSWORD_HASH missing - admin routes will not work')
    } else {
      logInfo('Server start', `Using admin username: ${adminUsername}`)
    }

    await connectDB()
    await seedShippingRatesIfEmpty()
    app.listen(PORT, () => {
      logInfo('Server start', `Backend server running on port ${PORT}`)
      logInfo('Server start', `CORS enabled for: ${FRONTEND_URL}`)
    })
  } catch (error) {
    logError('Failed to start server', error)
    process.exit(1)
  }
}

start()
