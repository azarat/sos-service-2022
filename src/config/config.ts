import AWS from 'aws-sdk'
import dotenv from 'dotenv'

dotenv.config()

class Config {
  private static readonly secrets = new AWS.SecretsManager({
    region: process.env.AWS_REGION,
  })

  private static async getSecret(secretName: string): Promise<string> {
    const { SecretString } = await Config.secrets
      .getSecretValue({
        SecretId: process.env.SECRET_ID,
      })
      .promise()
    const secrets = JSON.parse(SecretString)
    return secrets[secretName]
  }

  readonly port: string
  readonly apiHost: string
  mongoUri: string
  userSdkUrl: string
  userSdkSecret: string
  botToken: string
  botPassword: string
  liqpayIosPublicKey: string
  liqpayAndroidPublicKey: string
  liqpayIosPrivateKey: string
  liqpayAndroidPrivateKey: string
  franchiseAmount: string
  pushNotificationsUri: string
  pushLambdaSecret: string

  constructor() {
    this.port = process.env.PORT
    this.apiHost = process.env.API_HOST
  }

  async init(): Promise<void> {
    this.mongoUri = await Config.getSecret('MONGO_URI')
    this.userSdkUrl = await Config.getSecret('USER_SDK_URL')
    this.userSdkSecret = await Config.getSecret('USER_SDK_SECRET')
    this.botToken = await Config.getSecret('BOT_TOKEN')
    this.botPassword = await Config.getSecret('BOT_PASSWORD')
    this.liqpayIosPublicKey = await Config.getSecret('LIQPAY_IOS_PUBLIC_KEY')
    this.liqpayAndroidPublicKey = await Config.getSecret(
      'LIQPAY_ANDROID_PUBLIC_KEY',
    )
    this.liqpayIosPrivateKey = await Config.getSecret('LIQPAY_IOS_PRIVATE_KEY')
    this.liqpayAndroidPrivateKey = await Config.getSecret(
      'LIQPAY_ANDROID_PRIVATE_KEY',
    )
    this.franchiseAmount = await Config.getSecret('FRANCHISE_AMOUNT')
    this.pushNotificationsUri = await Config.getSecret('PUSH_NOTIFICATIONS_URI')
    this.pushLambdaSecret = await Config.getSecret('PUSH_LAMBDA_SECRET')
  }
}

export default new Config()
