import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { connectMongo } from './db/mongo.js'
import { config } from './config.js'

import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import negotiationsRoutes from './routes/negotiations.js'
import ordersRoutes from './routes/orders.js'
import reviewsRoutes from './routes/reviews.js'
import notificationsRoutes from './routes/notifications.js'
import favoritesRoutes from './routes/favorites.js'
import usersRoutes from './routes/users.js'
import uploadRoutes from './routes/upload.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/api/auth', authRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/negotiations', negotiationsRoutes)
app.route('/api/orders', ordersRoutes)
app.route('/api/reviews', reviewsRoutes)
app.route('/api/notifications', notificationsRoutes)
app.route('/api/favorites', favoritesRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/upload', uploadRoutes)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: '服务器内部错误' }, 500)
})

app.notFound((c) => {
  return c.json({ error: '接口不存在' }, 404)
})

async function startServer() {
  await connectMongo()

  console.log(`Server is running on port ${config.port}`)
  serve(
    {
      fetch: app.fetch,
      port: config.port,
    },
    (info) => {
      console.log(`Listening on http://localhost:${info.port}`)
    }
  )
}

startServer()
