const SibApiV3Sdk = require('@getbrevo/brevo')
import { env } from '~/config/environment'

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

  sendSmtpEmail.sender = {
    name: env.ADMIN_EMAIL_NAME,
    email: env.ADMIN_EMAIL_ADDRESS
  }

  sendSmtpEmail.to = [{ email: recipientEmail }]

  sendSmtpEmail.subject = customSubject

  sendSmtpEmail.htmlContent = htmlContent

  // * Gửi email
  try {
    return await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error(error)
  }
}

export const BrevoProvider = {
  sendEmail
}
