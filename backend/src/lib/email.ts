import nodemailer from 'nodemailer'
import { config } from '../config/env'

const transporter = config.SMTP_USER
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT || 587,
      secure: false,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    })
  : null

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}) {
  if (!transporter) {
    console.log(`[EMAIL DEV] To: ${opts.to} | Subject: ${opts.subject}`)
    return
  }
  await transporter.sendMail({
    from: config.EMAIL_FROM || 'Wasla <noreply@wasla.eg>',
    ...opts,
  })
}

export function sessionConfirmedEmail(name: string, date: string) {
  return `
    <div dir="rtl" style="font-family:Cairo,sans-serif;max-width:500px;margin:auto">
      <h2 style="color:#1D9E75">تم تأكيد جلستك ✅</h2>
      <p>مرحباً ${name}،</p>
      <p>تم تأكيد جلستك بتاريخ <strong>${date}</strong>.</p>
      <p>ستصلك رسالة تذكير قبل الجلسة بساعة.</p>
      <p style="color:#888;font-size:12px">وصلة — منصة المساعدة الفورية</p>
    </div>
  `
}

export function paymentReceivedEmail(name: string, amount: number) {
  return `
    <div dir="rtl" style="font-family:Cairo,sans-serif;max-width:500px;margin:auto">
      <h2 style="color:#1D9E75">تم استلام الدفع 💰</h2>
      <p>مرحباً ${name}،</p>
      <p>تم إضافة <strong>${amount} جنيه</strong> لمحفظتك على وصلة.</p>
      <p style="color:#888;font-size:12px">وصلة — منصة المساعدة الفورية</p>
    </div>
  `
}
