import { config } from '../config/env'

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendSmsOtp(
  phone: string,
  code: string,
  type: 'verify' | 'reset' = 'verify'
): Promise<void> {
  const message = type === 'verify'
    ? `وصلة: رمز التحقق الخاص بك هو ${code}. صالح لمدة 5 دقائق. لا تشاركه مع أحد.`
    : `وصلة: رمز إعادة تعيين كلمة المرور هو ${code}. صالح لمدة 5 دقائق.`

  if (!config.SMS_API_KEY) {
    // Dev mode — just log the OTP
    console.log(`[SMS DEV] To: ${phone} | Code: ${code} | Message: ${message}`)
    return
  }

  try {
    const response = await fetch('https://api.smsmisr.com/api/v2/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        environment: config.NODE_ENV === 'production' ? 1 : 2,
        username: config.SMS_API_KEY,
        password: '',
        language: 2,
        sender: config.SMS_SENDER,
        mobile: phone.replace(/^0/, '20'),
        message,
      }),
    })

    if (!response.ok) {
      console.error('[SMS] Failed to send OTP:', await response.text())
    }
  } catch (err) {
    console.error('[SMS] Error sending OTP:', err)
  }
}
