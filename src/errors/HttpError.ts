import { ILocalizatedError } from './interfaces'

class HttpError {
  static REQUEST_EXIST = {
    INIT: {
      en: 'Request with status INIT already exists',
      ru: 'Запрос со статусом INIT уже существует',
      uk: 'Запит зі статусом INIT вже існує',
    },
    WAITING_FOR_PAY: {
      en: 'Request with status WAITING_FOR_PAY already exists',
      ru: 'Запрос со статусом WAITING_FOR_PAY уже существует',
      uk: 'Запит зі статусом WAITING_FOR_PAY вже існує',
    },
  }
  constructor(
    public message: string | ILocalizatedError,
    public code: number,
  ) {}
}

export default HttpError
