import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { config } from '../config.js'
import { Product } from '../models/Product.js'
import mongoose from '../db/mongo.js'

const upload = new Hono()

const uploadDir = config.uploadDir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  },
})

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件'))
  }
}

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

upload.use('/images', serveStatic({ root: uploadDir }))

upload.use(authMiddleware)

upload.post('/product/:productId', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const productId = c.req.param('productId')

    const product = await Product.findOne({
      _id: productId,
      sellerId: userId,
    })

    if (!product) {
      return c.json({ error: '商品不存在或无权限' }, 404)
    }

    if (product.images.length >= 6) {
      return c.json({ error: '最多只能上传6张图片' }, 400)
    }

    const formData = await c.req.formData()
    const files = formData.getAll('images') as File[]

    if (files.length === 0) {
      return c.json({ error: '请选择要上传的图片' }, 400)
    }

    if (product.images.length + files.length > 6) {
      return c.json({ error: `最多还能上传 ${6 - product.images.length} 张图片` }, 400)
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      const ext = file.type.split('/')[1] || 'jpg'
      const filename = `${uuidv4()}.${ext}`
      const filePath = path.join(uploadDir, filename)

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      fs.writeFileSync(filePath, buffer)

      const url = `/api/upload/images/${filename}`
      uploadedUrls.push(url)
    }

    product.images = [...product.images, ...uploadedUrls]
    await product.save()

    return c.json({
      message: '上传成功',
      images: product.images,
    })
  } catch (error) {
    console.error('上传图片错误:', error)
    return c.json({ error: '上传图片失败' }, 500)
  }
})

upload.delete('/product/:productId/:imageIndex', async (c) => {
  try {
    const userId = c.get('userId') as mongoose.Types.ObjectId
    const productId = c.req.param('productId')
    const imageIndex = parseInt(c.req.param('imageIndex'))

    const product = await Product.findOne({
      _id: productId,
      sellerId: userId,
    })

    if (!product) {
      return c.json({ error: '商品不存在或无权限' }, 404)
    }

    if (imageIndex < 0 || imageIndex >= product.images.length) {
      return c.json({ error: '图片索引无效' }, 400)
    }

    const imageUrl = product.images[imageIndex]
    const filename = imageUrl.split('/').pop()

    if (filename) {
      const filePath = path.join(uploadDir, filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    product.images.splice(imageIndex, 1)
    await product.save()

    return c.json({
      message: '删除成功',
      images: product.images,
    })
  } catch (error) {
    console.error('删除图片错误:', error)
    return c.json({ error: '删除图片失败' }, 500)
  }
})

export default upload
