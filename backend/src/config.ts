export const config = {
  port: parseInt(process.env.PORT || '3000'),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/campus_market',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'campus_market_jwt_secret_key_2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxImagesPerProduct: 6,
}
