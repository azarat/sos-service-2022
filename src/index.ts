import fastify from 'fastify'
import swagger from 'fastify-swagger'
import mongoose from 'mongoose'
import fastifyFormbody from 'fastify-formbody'

import runBot from './bot/bot'
import config from './config/config'
import HttpError from './errors/HttpError'
import sosController from './requests/request-sos.controller'
import { LanguagesEnum } from './errors/languages.enum'

const app = fastify({
  logger: true,
})

app.register(fastifyFormbody)

app.get(`/${config.apiEnv}/SosService/health`, async () => 'Hello World')
app.register(swagger, {
  exposeRoute: true,
  routePrefix: '/docs',
  swagger: {
    host: config.apiHost,
    info: {
      title: 'Sos service API',
      version: 'v1',
    },
  },
})
app.register(sosController, { prefix: `/${config.apiEnv}/SosService` })
app.setErrorHandler((err, req, res) => {
  app.log.error(err)
  const message = err.message
  if (err instanceof HttpError) {
    const language = req.headers['accept-language']
    const errorLanguage = Object.keys(LanguagesEnum).includes(language)
      ? language
      : LanguagesEnum.uk
    const errorMessage =
      typeof message === 'string' ? message : message[errorLanguage]
    res.status(err.code).send(errorMessage)
  } else {
    res.status(500).send(message)
  }
})

const start = async (): Promise<void> => {
  try {
    await config.init()
    await mongoose.connect(config.mongoUri)
    await app.listen(config.port, '0.0.0.0')
    await runBot()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()

export default app
