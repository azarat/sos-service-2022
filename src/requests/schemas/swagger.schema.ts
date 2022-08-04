const requestBody = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'William' },
    phone: { type: 'string', example: '+380992342305' },
    address: { type: 'string', example: 'ул. Пушкина' },
    position: {
      type: 'object',
      properties: {
        lat: { type: 'number', exmaple: 52.42352342 },
        lng: { type: 'number', exmaple: 12.535042 },
      },
    },
    comment: { type: 'string', example: 'Punctured wheel' },
    vehicle: { type: 'string', example: 'Toyota Supra 2018' },
  },
}

const responseBodyPost = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '61a0d90f2c71124c751127a8',
    },
    ...requestBody.properties,
  },
}

const responseBodyGet = {
  type: 'object',
  properties: {
    paymentLink: {
      type: 'string',
      example: 'https://www.liqpay.ua/ru/checkout/card/checkout_194_KtKxJmy8Gs',
    },
    ...responseBodyPost.properties,
  },
}

export const RequestSchema = {
  tags: ['Sos'],
  headers: {
    token: {
      type: 'string',
    },
    'accept-language': { type: 'string' },
  },
  body: requestBody,
  response: {
    201: responseBodyPost,
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
    409: {
      description: 'Request with status WAITING_FOR_PAY already exists',
      type: 'null',
    },
  },
}

export const getRequestSchema = {
  tags: ['Sos'],
  headers: {
    token: {
      type: 'string',
    },
    'user-agent': {
      type: 'string',
    },
  },
  response: {
    200: responseBodyGet,
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
  },
}

export const rejectRequestSchema = {
  tags: ['Sos'],
  headers: {
    token: {
      type: 'string',
    },
  },
  response: {
    200: {
      type: 'null',
    },
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
  },
}
