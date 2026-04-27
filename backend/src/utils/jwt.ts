import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface JwtPayload {
  userId: string
  username: string
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    return null
  }
}
