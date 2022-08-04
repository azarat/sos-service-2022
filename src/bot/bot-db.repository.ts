import { BotChat, BotChatDocument } from './schema/bot-chat.schema'

class BotDatabaseRepository {
  public async createRecord(chatId: number): Promise<BotChatDocument> {
    return BotChat.create({
      chatId,
    })
  }

  public async getChatIds(): Promise<number[]> {
    const record = await BotChat.find()
    return record.map(({ chatId }) => chatId)
  }
}
export default new BotDatabaseRepository()
