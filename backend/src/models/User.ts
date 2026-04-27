import mongoose from '../db/mongo.js'
import bcrypt from 'bcryptjs'

export interface IUser extends mongoose.Document {
  username: string
  email: string
  password: string
  avatar: string
  nickname: string
  creditScore: number
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: '',
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    creditScore: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

export const User = mongoose.model<IUser>('User', userSchema)
