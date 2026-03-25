import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = `"${process.env.EMAIL_FROM_NAME || 'Guru Akanksha Foundation'}" <${process.env.EMAIL_FROM}>`
const ADMIN = process.env.ADMIN_EMAIL

// Shared branded wrapper
const wrap = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Guru Akanksha Foundation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#6D190D;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFD700;font-size:22px;font-weight:700;letter-spacing:1px;">Guru Akanksha Foundation</h1>
            <p style="margin:6px 0 0;color:#f5c7b0;font-size:13px;">Spreading holistic healthcare together</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fcf9e3;padding:20px 40px;text-align:center;border-top:1px solid #f3e1a5;">
            <p style="margin:0;font-size:12px;color:#888;">© ${new Date().getFullYear()} Guru Akanksha Foundation. All rights reserved.</p>
            <p style="margin:4px 0 0;font-size:12px;color:#aaa;">This is an automated email — please do not reply directly.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#FFD700;color:#222;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">${label}</a>`

const heading = (text) =>
  `<h2 style="margin:0 0 16px;font-size:20px;color:#6D190D;">${text}</h2>`

const para = (text) =>
  `<p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">${text}</p>`

const field = (label, value) =>
  `<tr>
    <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#6D190D;background:#fcf9e3;border:1px solid #f3e1a5;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#444;background:#fff;border:1px solid #f3e1a5;">${value}</td>
  </tr>`

const table = (rows) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">${rows}</table>`

// ─── Core send helper ──────────────────────────────────────────────────────────

export const sendEmail = async ({ to, subject, html }) => {
  // Global kill‑switch: unless EMAIL_ENABLED === 'true', skip sending
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`[Email] Skipped (EMAIL_ENABLED is not 'true') — to=${to}, subject=${subject}`)
    return { success: false, skipped: true, reason: 'EMAIL_DISABLED' }
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html })
    console.log(`[Email] Sent to ${to} — ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('[Email] Send error:', err.message)
    return { success: false, error: err.message }
  }
}

// ─── Contact form ──────────────────────────────────────────────────────────────

export const sendContactConfirmation = (to, name, subject) =>
  sendEmail({
    to,
    subject: `We received your message — ${subject}`,
    html: wrap(`
      ${heading(`Hello ${name}, we've received your message!`)}
      ${para('Thank you for reaching out to Guru Akanksha Foundation. We have received your message and will get back to you within <strong>2–3 working days</strong>.')}
      ${para(`Your subject: <strong>${subject}</strong>`)}
      ${para('If your matter is urgent, feel free to contact us directly.')}
      ${btn('https://gurukanksha.org/contact', 'Visit Our Website')}
    `),
  })

export const sendContactAdminAlert = (name, email, subject, message) =>
  sendEmail({
    to: ADMIN,
    subject: `[Contact Form] New message from ${name}`,
    html: wrap(`
      ${heading('New Contact Form Submission')}
      ${table(
        field('Name', name) +
        field('Email', email) +
        field('Subject', subject) +
        field('Message', message)
      )}
    `),
  })

// ─── Donation ─────────────────────────────────────────────────────────────────

export const sendDonationConfirmation = (to, name, amount, currency, campaignTitle) =>
  sendEmail({
    to,
    subject: 'Thank you for your generous donation!',
    html: wrap(`
      ${heading(`Thank you, ${name}!`)}
      ${para('Your donation has been approved and recorded. Your generosity directly supports our healthcare and education programmes across India.')}
      ${campaignTitle ? para(`<strong>Campaign:</strong> ${campaignTitle}`) : ''}
      ${table(
        field('Donor Name', name) +
        field('Amount', `${currency} ${parseFloat(amount).toLocaleString('en-IN')}`) +
        field('Status', 'Approved & confirmed')
      )}
      ${para('You will receive an official donation certificate by email shortly.')}
      ${btn('https://gurukanksha.org/campaigns', 'See Our Campaigns')}
    `),
  })

export const sendDonationAdminAlert = (name, email, amount, currency) =>
  sendEmail({
    to: ADMIN,
    subject: `[Donation] New donation from ${name} — ${currency} ${amount}`,
    html: wrap(`
      ${heading('New Donation Received')}
      ${table(
        field('Donor Name', name) +
        field('Donor Email', email) +
        field('Amount', `${currency} ${parseFloat(amount).toLocaleString()}`)
      )}
    `),
  })

// ─── Event registration ────────────────────────────────────────────────────────

export const sendEventRegistrationApproved = (to, name, eventTitle, amount, currency) =>
  sendEmail({
    to,
    subject: `Your registration is confirmed — ${eventTitle}`,
    html: wrap(`
      ${heading(`You're registered, ${name}!`)}
      ${para(`Your registration for <strong>${eventTitle}</strong> has been approved. We look forward to seeing you.`)}
      ${table(
        field('Event', eventTitle) +
        field(
          'Fee paid',
          parseFloat(amount) > 0
            ? `${currency} ${parseFloat(amount).toLocaleString('en-IN')}`
            : 'No fee'
        ) +
        field('Status', 'Approved')
      )}
      ${para('If you have questions, please contact us using the details on our website.')}
    `),
  })

export const sendEventRegistrationAdminAlert = (name, email, mobile, eventTitle, amount, currency) =>
  sendEmail({
    to: ADMIN,
    subject: `[Event registration] ${name} — ${eventTitle}`,
    html: wrap(`
      ${heading('New event registration (pending approval)')}
      ${table(
        field('Event', eventTitle) +
        field('Name', name) +
        field('Email', email) +
        field('Mobile', mobile) +
        field(
          'Amount',
          parseFloat(amount) > 0 ? `${currency} ${parseFloat(amount).toLocaleString('en-IN')}` : '₹0 (no fee)'
        )
      )}
    `),
  })

// ─── Career application ────────────────────────────────────────────────────────

export const sendCareerApplicationConfirmation = (to, name, position) =>
  sendEmail({
    to,
    subject: `Application received — ${position}`,
    html: wrap(`
      ${heading(`Hi ${name}, your application is in!`)}
      ${para(`Thank you for applying for the <strong>${position}</strong> position at Guru Akanksha Foundation.`)}
      ${para('Our team will review your application and get back to you within <strong>5–7 working days</strong>. We appreciate your interest in being part of our mission.')}
      ${btn('https://gurukanksha.org/careers', 'View More Opportunities')}
    `),
  })

export const sendCareerApplicationAdminAlert = (name, email, phone, position) =>
  sendEmail({
    to: ADMIN,
    subject: `[Career Application] ${name} applied for ${position}`,
    html: wrap(`
      ${heading('New Job Application')}
      ${table(
        field('Applicant', name) +
        field('Email', email) +
        field('Phone', phone) +
        field('Position', position)
      )}
    `),
  })

// ─── Admin password reset (OTP) ────────────────────────────────────────────────

export const sendAdminPasswordResetOtp = (to, otp) =>
  sendEmail({
    to,
    subject: 'Admin password reset OTP',
    html: wrap(`
      ${heading('Admin password reset')}
      ${para('Use the OTP below to reset your admin password. This OTP is valid for a short time.')}
      <div style="margin:18px 0;padding:14px 18px;border-radius:12px;background:#fcf9e3;border:1px solid #f3e1a5;text-align:center;">
        <div style="font-size:28px;letter-spacing:6px;font-weight:800;color:#6D190D;">${otp}</div>
      </div>
      ${para('If you did not request this, you can ignore this email.')}
    `),
  })

// ─── Volunteer submission ──────────────────────────────────────────────────────

export const sendVolunteerConfirmation = (to, name, opportunity) =>
  sendEmail({
    to,
    subject: `Volunteer application received — ${opportunity}`,
    html: wrap(`
      ${heading(`Welcome aboard, ${name}!`)}
      ${para(`Thank you for applying to volunteer for <strong>${opportunity}</strong> with Guru Akanksha Foundation.`)}
      ${para('Your enthusiasm means the world to us. Our team will review your application and contact you within <strong>3–5 working days</strong> with next steps.')}
      ${btn('https://gurukanksha.org/careers', 'Explore More Opportunities')}
    `),
  })

export const sendVolunteerAdminAlert = (name, email, phone, opportunity) =>
  sendEmail({
    to: ADMIN,
    subject: `[Volunteer] New application from ${name} for ${opportunity}`,
    html: wrap(`
      ${heading('New Volunteer Application')}
      ${table(
        field('Name', name) +
        field('Email', email) +
        field('Phone', phone) +
        field('Opportunity', opportunity)
      )}
    `),
  })
