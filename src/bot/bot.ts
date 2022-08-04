/* eslint-disable prettier/prettier */
import { Telegraf } from 'telegraf'
import { Keyboard, Key } from 'telegram-keyboard'

import botDatabaseRepository from './bot-db.repository'
import requestDatabaseRepository from '../requests/request-db.repository'
import sosService from '../requests/request-sos.service'
import config from '../config/config'
import { StatusEnum } from '../requests/enums/status.enum'

const runBot = async (): Promise<void> => {
  const bot = new Telegraf(config.botToken)
  bot.start((ctx) => ctx.reply('Приветствую. Введите пароль'))
  bot.command(`/${config.botPassword}`, async (ctx) => {
    await botDatabaseRepository.createRecord(ctx.chat.id)
    ctx.reply('Успешно авторизировались')
  })

  bot.action('accept', async (ctx) => {
    const {
      callback_query: {
        from: { id, username, first_name, last_name },
        message: { message_id, date },
      },
    } = ctx.update
    const { text } = ctx.update.callback_query.message as any
    const name = first_name + (last_name ? ` ${last_name}` : '')
    await sosService.handleAction(
      StatusEnum.WAITING_FOR_PAY,
      message_id,
      id,
      username,
      name,
      date,
    )
    await editMessageText('ПРИНЯТО', text, message_id)
  })
  bot.action('reject', async (ctx) => {
    const {
      callback_query: {
        from: { id, username, first_name, last_name },
        message: { message_id, date },
      },
    } = ctx.update
    const { text } = ctx.update.callback_query.message as any
    const name = first_name + (last_name ? last_name : '')
    await sosService.handleAction(
      StatusEnum.REJECTED,
      message_id,
      id,
      username,
      name,
      date,
    )
    await editMessageText('ОТКЛОНЕНО', text, message_id)
  })
  bot.launch()

  const editMessageText = async (status, text, message_id): Promise<void> => {
    const chatIds = await botDatabaseRepository.getChatIds()
    const { messageIds } = await requestDatabaseRepository.getByMessageId(
      message_id,
    )
    await Promise.all(
      chatIds.map((chatId) => {
        messageIds.map(async (messageId) => {
          try {
            await bot.telegram.editMessageText(
              chatId,
              messageId,
              '',
              `[${status}]\n\n${text}`,
            )
          } catch (error) { }
        })
      }),
    )
  }
}

export const sendMessage = async (message: string): Promise<number[]> => {
  const bot = new Telegraf(config.botToken)
  const keyboard = Keyboard.make([
    Key.callback('Принять', 'accept'),
    Key.callback('Отклонить', 'reject'),
  ]).inline()
  const chatIds = await botDatabaseRepository.getChatIds()
  const ids = (
    await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const { message_id } = await bot.telegram.sendMessage(
          chatId,
          message,
          keyboard,
        )
        return message_id
      }),
    )
  ).reduce((acc, result) => {
    if (result.status === 'fulfilled') {
      return [...acc, result.value]
    }

    return acc
  }, [])

  return ids
}

export const editMessagePay = async (
  messageIds: number[],
  text: string,
): Promise<void> => {
  const bot = new Telegraf(config.botToken)
  const chatIds = await botDatabaseRepository.getChatIds()
  await Promise.all(
    chatIds.map((chatId) => {
      messageIds.map(async (messageId) => {
        try {
          await bot.telegram.editMessageText(chatId, messageId, '', text)
        } catch (error) { }
      })
    }),
  )
}

export default runBot
