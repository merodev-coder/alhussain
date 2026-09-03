import nodemailer from 'nodemailer'
import { getAllConnections } from './db.js'
import { getSiteSettingsModel } from '../models/SiteSettings.js'
import { logError, logInfo } from './logger.js'

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  try {
    // Fetch settings to get sender email and app password
    const connections = getAllConnections()
    let settings = null

    for (const connection of connections) {
      const SettingsModel = getSiteSettingsModel(connection)
      const found = await SettingsModel.findOne().lean()
      if (found) {
        settings = found
        break
      }
    }

    if (!settings || !settings.senderEmail || !settings.senderEmailAppPassword) {
      logInfo('Send email', 'لم يتم إعداد بريد المتجر، تم تخطي الإرسال')
      return
    }

    const { senderEmail, senderEmailAppPassword } = settings

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderEmailAppPassword,
      },
    })

    // Send email
    await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      html,
    })

    logInfo('Send email', `تم إرسال البريد بنجاح إلى ${to}`)
  } catch (error) {
    logError('Send email', error)
    // Never throw - email failures should not break the order flow
  }
}
