import './lib/loadEnv.js'
import { sendEmail } from './config/email.js'

const run = async () => {
  const to = 'iammrrammorkhandikar@gmail.com'

  console.log('Sending test email to', to)

  const result = await sendEmail({
    to,
    subject: 'GAF SMTP test email',
    html: `
      <h2 style="font-family:Segoe UI,Arial,sans-serif;color:#6D190D;margin-bottom:12px;">
        SMTP test from Guru Akanksha Foundation backend
      </h2>
      <p style="font-family:Segoe UI,Arial,sans-serif;color:#444;margin:0 0 8px;">
        If you can read this, SMTP is working correctly for the project.
      </p>
      <p style="font-family:Segoe UI,Arial,sans-serif;color:#444;margin:0;">
        Sent at: <strong>${new Date().toISOString()}</strong>
      </p>
    `,
  })

  console.log('Result:', result)
}

run().catch((err) => {
  console.error('Test email error:', err)
  process.exitCode = 1
})

