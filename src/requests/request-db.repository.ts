import HttpError from '../errors/HttpError'
import { RequestSosDTO } from './dto/request-sos.dto'
import { StatusEnum } from './enums/status.enum'
import { Request, RequestDocument } from './schemas/request.schema'

class RequestDatabaseRepository {
  public async createRequest(
    body: RequestSosDTO,
    user: string,
  ): Promise<RequestDocument> {
    const record = await Request.findOne({
      user,
      $or: [
        { status: StatusEnum.WAITING_FOR_PAY },
        { status: StatusEnum.INIT },
      ],
    })

    if (record) throw new HttpError(HttpError.REQUEST_EXIST[record.status], 409)
    return Request.create({
      ...body,
      status: StatusEnum.INIT,
      user,
    })
  }

  public async getActiveRequest(user: string): Promise<RequestDocument> {
    return Request.findOne({ user, status: StatusEnum.WAITING_FOR_PAY })
  }

  public async getById(id: string): Promise<RequestDocument> {
    return Request.findById(id)
  }

  public async getByMessageId(messageId: number): Promise<RequestDocument> {
    return Request.findOne({ messageIds: messageId })
  }

  public async addMessageInfo(id: string, messageIds: number[]): Promise<void> {
    await Request.findByIdAndUpdate(id, { messageIds })
  }

  public async changeStatus(
    id: string,
    status: StatusEnum,
    managerId: number,
    managerUsername: string,
    managerName: string,
    date: Date,
  ): Promise<RequestDocument> {
    return Request.findByIdAndUpdate(id, {
      status,
      date,
      manager: {
        telegramId: managerId,
        username: managerUsername,
        name: managerName,
      },
    })
  }

  public async payRequest(id: string, status: StatusEnum): Promise<void> {
    await Request.findByIdAndUpdate(id, { status })
  }

  public async rejectRequest(user: string): Promise<void> {
    await Request.findOneAndUpdate(
      { user, status: StatusEnum.WAITING_FOR_PAY },
      {
        status: StatusEnum.REJECTED,
      },
    )
  }
}

export default new RequestDatabaseRepository()
