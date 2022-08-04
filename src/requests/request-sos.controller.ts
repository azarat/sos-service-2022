import { FastifyInstance } from 'fastify'

import { Headers, Body } from '../types'
import { RequestHeaderDTO } from './dto/request-header.dto'
import { RequestSosDTO } from './dto/request-sos.dto'
import {
  getRequestSchema,
  rejectRequestSchema,
  RequestSchema,
} from './schemas/swagger.schema'
import sosService from './request-sos.service'
import { LiqpayRequestDTO } from './dto/liqpay-request.dto'
import { userGuard } from '../guards/user.guard'

const sosController = (server: FastifyInstance, _, done): void => {
  server.post<Headers<RequestHeaderDTO> & Body<RequestSosDTO>>(
    '/',
    { schema: RequestSchema, preValidation: userGuard },
    async (req) => {
      const {
        headers: { token },
        body,
      } = req
      return sosService.createRequest(body, token)
    },
  )

  server.get<Headers<RequestHeaderDTO>>(
    '/',
    { schema: getRequestSchema, preValidation: userGuard },
    async (req) => {
      const { token } = req.headers
      return sosService.getActiveRequest(token, req.headers['user-agent'])
    },
  )

  server.patch<Headers<RequestHeaderDTO>>(
    '/reject',
    { schema: rejectRequestSchema, preValidation: userGuard },
    async (req, res) => {
      const {
        headers: { token },
      } = req
      await sosService.rejectRequest(token)
      res.code(200).send()
    },
  )

  server.post<Body<LiqpayRequestDTO>>(
    '/pay',
    { schema: { hide: true } },
    async (req) => {
      await sosService.handleLiqpayRequest(req.body.data)
    },
  )

  done()
}

export default sosController
