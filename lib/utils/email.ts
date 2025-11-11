import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@thehockeydirectory.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface LeadNotificationData {
  advisorName: string
  advisorEmail: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  eliteProspectsLink?: string
  message: string
  leadId: string
}

/**
 * Send email notification to advisor about new lead
 */
export async function sendLeadNotificationEmail(data: LeadNotificationData): Promise<boolean> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      console.log('Resend API key not configured. Email notification skipped.')
      console.log('Would have sent email to:', data.advisorEmail)
      return false
    }

    const emailHtml = generateLeadNotificationHTML(data)
    const emailText = generateLeadNotificationText(data)

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.advisorEmail,
      subject: `New Lead: ${data.parentName} is interested in your services`,
      html: emailHtml,
      text: emailText,
    })

    if (error) {
      console.error('Error sending email:', error)
      return false
    }

    console.log('Email sent successfully:', emailData)
    return true
  } catch (error) {
    console.error('Error in sendLeadNotificationEmail:', error)
    return false
  }
}

/**
 * Generate HTML email template for lead notification
 */
function generateLeadNotificationHTML(data: LeadNotificationData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #0066CC, #0052A3); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Lead From The Hockey Directory</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px;">Hi ${data.advisorName},</p>

              <p style="font-size: 16px; color: #374151; margin: 0 0 20px;">
                You have received a new inquiry from a parent interested in your hockey advisory services!
              </p>

              <!-- Lead Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; color: #0066CC; margin: 0 0 15px;">Contact Information</h2>

                    <p style="margin: 8px 0;">
                      <strong style="color: #374151;">Parent Name:</strong><br />
                      <span style="color: #6b7280;">${data.parentName}</span>
                    </p>

                    <p style="margin: 8px 0;">
                      <strong style="color: #374151;">Email:</strong><br />
                      <a href="mailto:${data.parentEmail}" style="color: #0066CC; text-decoration: none;">${data.parentEmail}</a>
                    </p>

                    ${data.parentPhone ? `
                    <p style="margin: 8px 0;">
                      <strong style="color: #374151;">Phone:</strong><br />
                      <a href="tel:${data.parentPhone}" style="color: #0066CC; text-decoration: none;">${data.parentPhone}</a>
                    </p>
                    ` : ''}

                    ${data.eliteProspectsLink ? `
                    <p style="margin: 8px 0;">
                      <strong style="color: #374151;">Elite Prospects Link:</strong><br />
                      <a href="${data.eliteProspectsLink}" style="color: #0066CC; text-decoration: none;" target="_blank">${data.eliteProspectsLink}</a>
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; color: #0066CC; margin: 0 0 15px;">Message</h2>
                    <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.parentEmail}?subject=Re: Your Hockey Advisory Inquiry"
                       style="display: inline-block; padding: 14px 28px; background-color: #0066CC; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Reply to ${data.parentName}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0; line-height: 1.6;">
                <strong>Pro Tip:</strong> Most parents expect a response within 24-48 hours. A quick, personalized reply increases your chance of converting this lead!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px;">
                This email was sent by The Hockey Directory
              </p>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                <a href="${APP_URL}" style="color: #0066CC; text-decoration: none;">Visit The Hockey Directory</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Generate plain text email template for lead notification
 */
function generateLeadNotificationText(data: LeadNotificationData): string {
  return `
Hi ${data.advisorName},

You have received a new inquiry from a parent interested in your hockey advisory services!

CONTACT INFORMATION:
-------------------
Parent Name: ${data.parentName}
Email: ${data.parentEmail}
${data.parentPhone ? `Phone: ${data.parentPhone}` : ''}
${data.eliteProspectsLink ? `Elite Prospects Link: ${data.eliteProspectsLink}` : ''}

MESSAGE:
--------
${data.message}

-------------------

Reply to this inquiry by emailing ${data.parentEmail}

Pro Tip: Most parents expect a response within 24-48 hours. A quick, personalized reply increases your chance of converting this lead!

--
The Hockey Directory
${APP_URL}
  `
}

/**
 * Send confirmation email to parent
 */
export async function sendLeadConfirmationEmail(
  parentEmail: string,
  parentName: string,
  advisorName: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      console.log('Resend API key not configured. Confirmation email skipped.')
      return false
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: parentEmail,
      subject: `Your message to ${advisorName} has been sent`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0066CC;">Message Sent Successfully!</h2>

    <p>Hi ${parentName},</p>

    <p>Your message to <strong>${advisorName}</strong> has been sent successfully.</p>

    <p>They will review your inquiry and typically respond within 24-48 hours via email.</p>

    <p>If you have any questions, feel free to reach out to us.</p>

    <p>Best regards,<br>The Hockey Directory Team</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="font-size: 12px; color: #666;">
      <a href="${APP_URL}">Visit The Hockey Directory</a>
    </p>
  </div>
</body>
</html>
      `,
      text: `
Hi ${parentName},

Your message to ${advisorName} has been sent successfully.

They will review your inquiry and typically respond within 24-48 hours via email.

If you have any questions, feel free to reach out to us.

Best regards,
The Hockey Directory Team

${APP_URL}
      `,
    })

    if (error) {
      console.error('Error sending confirmation email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in sendLeadConfirmationEmail:', error)
    return false
  }
}

/**
 * Send claim confirmation email to claimant
 */
export async function sendClaimConfirmationEmail(
  claimantEmail: string,
  claimantName: string,
  advisorName: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      console.log('Resend API key not configured. Claim confirmation email skipped.')
      return false
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: claimantEmail,
      subject: `Your claim for ${advisorName} has been received`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0066CC;">Claim Submitted Successfully!</h2>

    <p>Hi ${claimantName},</p>

    <p>Thank you for submitting a claim for <strong>${advisorName}</strong> on The Hockey Directory.</p>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Our team will review your claim within 2-3 business days</li>
      <li>We may contact you if we need additional verification</li>
      <li>Once approved, you'll receive dashboard access to manage your listing</li>
    </ul>

    <p>We'll notify you via email once the review is complete.</p>

    <p>Best regards,<br>The Hockey Directory Team</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="font-size: 12px; color: #666;">
      <a href="${APP_URL}">Visit The Hockey Directory</a>
    </p>
  </div>
</body>
</html>
      `,
      text: `
Hi ${claimantName},

Thank you for submitting a claim for ${advisorName} on The Hockey Directory.

What happens next?
- Our team will review your claim within 2-3 business days
- We may contact you if we need additional verification
- Once approved, you'll receive dashboard access to manage your listing

We'll notify you via email once the review is complete.

Best regards,
The Hockey Directory Team

${APP_URL}
      `,
    })

    if (error) {
      console.error('Error sending claim confirmation email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in sendClaimConfirmationEmail:', error)
    return false
  }
}

/**
 * Send claim approval email to claimant
 */
export async function sendClaimApprovalEmail(
  claimantEmail: string,
  claimantName: string,
  advisorName: string,
  advisorSlug: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      console.log('Resend API key not configured. Claim approval email skipped.')
      return false
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: claimantEmail,
      subject: `Your claim for ${advisorName} has been approved!`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0066CC;">🎉 Claim Approved!</h2>

    <p>Hi ${claimantName},</p>

    <p>Great news! Your claim for <strong>${advisorName}</strong> has been approved.</p>

    <p><strong>You now have access to:</strong></p>
    <ul>
      <li>Update your business information</li>
      <li>View and manage leads from interested families</li>
      <li>Respond to reviews</li>
      <li>Track your profile views and engagement</li>
    </ul>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/dashboard"
         style="display: inline-block; padding: 14px 28px; background-color: #0066CC; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Access Your Dashboard
      </a>
    </div>

    <p>You can also view your listing at: <a href="${APP_URL}/listings/${advisorSlug}">${APP_URL}/listings/${advisorSlug}</a></p>

    <p>Best regards,<br>The Hockey Directory Team</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="font-size: 12px; color: #666;">
      <a href="${APP_URL}">Visit The Hockey Directory</a>
    </p>
  </div>
</body>
</html>
      `,
      text: `
Hi ${claimantName},

Great news! Your claim for ${advisorName} has been approved.

You now have access to:
- Update your business information
- View and manage leads from interested families
- Respond to reviews
- Track your profile views and engagement

Access your dashboard: ${APP_URL}/dashboard

View your listing: ${APP_URL}/listings/${advisorSlug}

Best regards,
The Hockey Directory Team

${APP_URL}
      `,
    })

    if (error) {
      console.error('Error sending claim approval email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in sendClaimApprovalEmail:', error)
    return false
  }
}

/**
 * Send claim rejection email to claimant
 */
export async function sendClaimRejectionEmail(
  claimantEmail: string,
  claimantName: string,
  advisorName: string,
  reason: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      console.log('Resend API key not configured. Claim rejection email skipped.')
      return false
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: claimantEmail,
      subject: `Update on your claim for ${advisorName}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0066CC;">Claim Status Update</h2>

    <p>Hi ${claimantName},</p>

    <p>Thank you for submitting a claim for <strong>${advisorName}</strong>.</p>

    <p>After careful review, we were unable to approve your claim at this time.</p>

    ${reason ? `
    <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #0066CC; margin: 20px 0;">
      <p style="margin: 0;"><strong>Reason:</strong></p>
      <p style="margin: 10px 0 0;">${reason}</p>
    </div>
    ` : ''}

    <p>If you believe this decision was made in error or if you have additional verification information, please contact us at support@thehockeydirectory.com.</p>

    <p>Best regards,<br>The Hockey Directory Team</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="font-size: 12px; color: #666;">
      <a href="${APP_URL}">Visit The Hockey Directory</a>
    </p>
  </div>
</body>
</html>
      `,
      text: `
Hi ${claimantName},

Thank you for submitting a claim for ${advisorName}.

After careful review, we were unable to approve your claim at this time.

${reason ? `Reason: ${reason}` : ''}

If you believe this decision was made in error or if you have additional verification information, please contact us at support@thehockeydirectory.com.

Best regards,
The Hockey Directory Team

${APP_URL}
      `,
    })

    if (error) {
      console.error('Error sending claim rejection email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in sendClaimRejectionEmail:', error)
    return false
  }
}

/**
 * Send email verification email to claimant
 */
export async function sendEmailVerificationEmail(
  claimantEmail: string,
  claimantName: string,
  advisorName: string,
  verificationUrl: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      console.log('Resend API key not configured. Verification email skipped.')
      console.log('Verification URL:', verificationUrl)
      return false
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: claimantEmail,
      subject: `Verify your email to claim ${advisorName}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0066CC;">Verify Your Email Address</h2>

    <p>Hi ${claimantName},</p>

    <p>Thank you for claiming <strong>${advisorName}</strong> on The Hockey Directory!</p>

    <p>To complete your claim and create your advisor account, please verify your email address by clicking the button below:</p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${verificationUrl}"
         style="display: inline-block; padding: 14px 28px; background-color: #0066CC; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Verify Email Address
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #0066CC; word-break: break-all;">${verificationUrl}</p>

    <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #0066CC; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>What happens next?</strong></p>
      <ol style="margin: 10px 0 0; padding-left: 20px; font-size: 14px;">
        <li>Click the verification link</li>
        <li>Create a secure password for your account</li>
        <li>Your claim will be reviewed (usually within 24-48 hours)</li>
        <li>Once approved, you'll have full access to your dashboard</li>
      </ol>
    </div>

    <p style="font-size: 14px; color: #666;"><strong>Note:</strong> This verification link expires in 24 hours.</p>

    <p>If you didn't request this, you can safely ignore this email.</p>

    <p>Best regards,<br>The Hockey Directory Team</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <p style="font-size: 12px; color: #666;">
      <a href="${APP_URL}">Visit The Hockey Directory</a>
    </p>
  </div>
</body>
</html>
      `,
      text: `
Hi ${claimantName},

Thank you for claiming ${advisorName} on The Hockey Directory!

To complete your claim and create your advisor account, please verify your email address by clicking the link below:

${verificationUrl}

What happens next?
1. Click the verification link
2. Create a secure password for your account
3. Your claim will be reviewed (usually within 24-48 hours)
4. Once approved, you'll have full access to your dashboard

Note: This verification link expires in 24 hours.

If you didn't request this, you can safely ignore this email.

Best regards,
The Hockey Directory Team

${APP_URL}
      `,
    })

    if (error) {
      console.error('Error sending verification email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in sendEmailVerificationEmail:', error)
    return false
  }
}
