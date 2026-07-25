import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './lib/db.js'
import adminRoutes from './routes/admin.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import specOptionsRoutes from './routes/spec-options.js'
import pricelistRoutes from './routes/pricelist.js'
import dashboardRoutes from './routes/dashboard.js'

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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use(adminRoutes)
app.use(productsRoutes)
app.use(ordersRoutes)
app.use(specOptionsRoutes)
app.use(pricelistRoutes)
app.use(dashboardRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Connect to DB and start server
async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`[v0] Backend server running on port ${PORT}`)
      console.log(`[v0] CORS enabled for: ${FRONTEND_URL}`)
    })
  } catch (error) {
    console.error('[v0] Failed to start server:', error)
    process.exit(1)
  }
}

start()
