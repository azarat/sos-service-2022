/* eslint-disable prettier/prettier */
import axios from 'axios'
import * as userSdk from '@day-drive/user-sdk/lib/cjs'
import Payment from '@day-drive/liqpay-sdk/lib/cjs'

import HttpError from '../errors/HttpError'
import config from '../config/config'
import requestDatabaseRepository from './request-db.repository'
import { RequestSosDTO } from './dto/request-sos.dto'
import { sendMessage, editMessagePay } from '../bot/bot'
import { StatusEnum } from './enums/status.enum'
import { ResponseRequestDTO } from './dto/response-request.dto'

class SosService {
  private static SOS_WAITIG_FOR_PAY = 'SOS_WAITIG_FOR_PAY'
  private static SOS_PAYED_SUCCEEDED = 'SOS_PAYED_SUCCEEDED'
  private static SOS_PAYED_REJECT = 'SOS_PAYED_REJECT'
  private static SOS_PAYED_ERROR = 'SOS_PAYED_ERROR'

  public async createRequest(
    body: RequestSosDTO,
    token: string,
  ): Promise<RequestSosDTO> {
    const user = await this.verifyToken(token)
    const { _id } = await requestDatabaseRepository.createRequest(body, user)
    const { name, phone, position, comment, vehicle, address } = body
    const message = `Id: ${_id}\nИмя: ${name}\nТелефон: ${phone}\nМестоположение: ${position
      ? `http://www.google.com/maps/place/${position.lat},${position.lng}`
      : address
      }\nТранспортное средство: ${vehicle}\nКомментарий: ${comment}`
    const messageIds = await sendMessage(message)
    await requestDatabaseRepository.addMessageInfo(_id, messageIds)
    return { id: _id, name, phone, position, comment, vehicle }
  }

  public async getActiveRequest(
    token: string,
    userAgent: string,
  ): Promise<ResponseRequestDTO | []> {
    const user = await this.verifyToken(token)
    const request = await requestDatabaseRepository.getActiveRequest(user)
    if (!request) return []
    const { _id, name, phone, position, comment, vehicle, address } = request
    const { publicKey, privateKey } = this.getKeys(userAgent)
    const paymentLink = new Payment(
      publicKey,
      _id,
      config.franchiseAmount,
      'DayDrive LLC',
      `http://${config.apiHost}/pay`,
    ).createPayment(privateKey)

    return { id: _id, name, phone, position, comment, vehicle, address, paymentLink }
  }

  public async rejectRequest(token: string): Promise<void> {
    const user = await this.verifyToken(token)
    await requestDatabaseRepository.rejectRequest(user)
  }

  public async handleAction(
    status: StatusEnum,
    messageId: number,
    managerId: number,
    managerUsername: string | undefined,
    managerName: string,
    date: number,
  ): Promise<void> {
    const res = await requestDatabaseRepository.getByMessageId(messageId)
    const { user } = await requestDatabaseRepository.changeStatus(
      res._id,
      status,
      managerId,
      managerUsername,
      managerName,
      new Date(date),
    )
    const { text, type } = {
      WAITING_FOR_PAY: {
        text: 'Оплатите пожалуйста',
        type: SosService.SOS_WAITIG_FOR_PAY,
      },
      REJECTED: {
        text: 'Менеджер отклонил ваш запрос',
        type: SosService.SOS_PAYED_REJECT,
      },
    }[status]
    await this.pushNotification(text, user, type)
  }

  public async handleLiqpayRequest(token: string): Promise<void> {
    const { order_id, status } = JSON.parse(
      Buffer.from(token, 'base64').toString(),
    )
    const {
      _id,
      name,
      phone,
      position,
      vehicle,
      comment,
      messageIds,
      address,
      status: requestStatus,
      user,
    } = await requestDatabaseRepository.getById(order_id)
    const isSuccess = ['success', 'wait_accept'].includes(status.toLowerCase())
    if (isSuccess && requestStatus === StatusEnum.WAITING_FOR_PAY) {
      const message = `[ОПЛАЧЕНО]\n\nId: ${_id}\nИмя: ${name}\nТелефон: ${phone}\nМестоположение: ${position
        ? `http://www.google.com/maps/place/${position.lat},${position.lng}`
        : address
        }\nТранспортное средство: ${vehicle}\nКомментарий: ${comment}`
      await editMessagePay(messageIds, message)
      await requestDatabaseRepository.payRequest(order_id, StatusEnum.PAYED)
      await this.pushNotification(
        'Оплата прошла успешно',
        user,
        SosService.SOS_PAYED_SUCCEEDED,
      )
    } else if (isSuccess) {
      await requestDatabaseRepository.payRequest(order_id, StatusEnum.ERROR)
      await this.pushNotification(
        'Что-то пошло не так',
        SosService.SOS_PAYED_ERROR,
        user,
      )
    }
  }

  private async verifyToken(token: string): Promise<string> {
    if (!token) throw new HttpError('Provide a token', 401)
    try {
      const { id } = await userSdk.verifyUser(
        config.userSdkUrl,
        config.userSdkSecret,
        token as string,
      )
      return id
    } catch (error) {
      throw new HttpError('Token is invalid', 401)
    }
  }

  private async pushNotification(
    body: string,
    userId: string,
    type: string,
  ): Promise<void> {
    const { deviceToken } = await userSdk.getUserById(
      config.userSdkUrl,
      config.userSdkSecret,
      userId,
    )

    await axios.post(
      config.pushNotificationsUri,
      {
        tokens: deviceToken,
        notification: {
          title: 'Сервис SOS',
          body,
        },
        data: {
          id: userId,
          type,
        },
      },
      {
        headers: {
          token: config.pushLambdaSecret,
        },
      },
    )
  }

  private getKeys(userAgent: string) {
    const device = ['android', 'ios'].includes(userAgent)
      ? userAgent
      : 'android'
    return {
      ios: {
        publicKey: config.liqpayIosPublicKey,
        privateKey: config.liqpayIosPrivateKey,
      },
      android: {
        publicKey: config.liqpayAndroidPublicKey,
        privateKey: config.liqpayAndroidPrivateKey,
      },
    }[device]
  }
}

export default new SosService()
