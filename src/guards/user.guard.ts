import { FastifyRequest } from 'fastify'
import * as userSdk from '@day-drive/user-sdk/lib/cjs'

import HttpError from '../errors/HttpError'
import config from '../config/config'

export const userGuard = async (req: FastifyRequest): Promise<void> => {
  const { token } = req.headers
  if (!token) {
    throw new HttpError('Provide a token', 401)
  }
  try {
    await userSdk.verifyUser(
      config.userSdkUrl,
      config.userSdkSecret,
      token as string,
    )
  } catch (err) {
    throw new HttpError('Token is invalid', 401)
  }
}
