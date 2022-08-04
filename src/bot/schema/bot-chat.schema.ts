import { Document, Schema, model } from 'mongoose'

export interface BotChatDocument extends Document {
  chatId: number
}

export const BotChatSchema = new Schema({
  chatId: {
    type: Number,
    required: true,
  },
})

export const BotChat = model<BotChatDocument>('BotChat', BotChatSchema)
