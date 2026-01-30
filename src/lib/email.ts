import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@autodealerplatform.com'
const APP_NAME = 'Auto Dealer Platform'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string = 'en') {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const isGeorgian = locale === 'ka'

  const subject = isGeorgian
    ? 'პაროლის აღდგენა - Auto Dealer Platform'
    : 'Reset Your Password - Auto Dealer Platform'

  const html = isGeorgian
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Auto Dealer Platform</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1e3a5f; margin-top: 0;">პაროლის აღდგენა</h2>
    <p>თქვენ მოითხოვეთ პაროლის აღდგენა. დააჭირეთ ქვემოთ მოცემულ ღილაკს ახალი პაროლის დასაყენებლად:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #1e3a5f; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">პაროლის აღდგენა</a>
    </div>
    <p style="color: #666; font-size: 14px;">ეს ბმული მოქმედებს <strong>1 საათის</strong> განმავლობაში.</p>
    <p style="color: #666; font-size: 14px;">თუ თქვენ არ მოითხოვეთ პაროლის აღდგენა, უგულებელყოთ ეს შეტყობინება.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული ბრაუზერში:<br>
      <a href="${resetUrl}" style="color: #1e3a5f; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>
`
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Auto Dealer Platform</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Reset Your Password</h2>
    <p>You requested to reset your password. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #1e3a5f; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #1e3a5f; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>
`

  return sendEmail({ to: email, subject, html })
}
