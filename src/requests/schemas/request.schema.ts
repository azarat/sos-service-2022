import { Document, Schema, model } from 'mongoose'
import { StatusEnum } from '../enums/status.enum'

export interface RequestDocument extends Document {
  user: string
  name: string
  phone: string
  address: string
  position: {
    lat: number
    lng: number
  }
  comment: string
  vehicle: string
  status: string
  updatedAt: Date
  messageIds: number[]
  manager: {
    telegramId: number
    username: string
    name: string
  }
}

export const RequestSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  position: {
    type: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  comment: {
    type: String,
    required: true,
  },
  vehicle: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: StatusEnum,
    required: true,
  },
  updatedAt: {
    type: Date,
  },
  messageIds: { type: [Number] },
  manager: {
    telegramId: { type: Number },
    username: { type: String },
    name: { type: String },
  },
})

export const Request = model<RequestDocument>('Request', RequestSchema)
