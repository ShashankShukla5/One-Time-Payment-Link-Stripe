import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPaymentLinkEmail = async (email, paymentLink, amount, paymentId, pdfBuffer) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Payment Request</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have a payment request</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #374151; margin-bottom: 10px;">Payment Details</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Amount</p>
              <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #2563eb;">$${amount}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">Payment ID: ${paymentId}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${paymentLink}" style="background: #2563eb; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Pay Now
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This payment link will expire in 5 days. If you have any questions, please contact us.
            </p>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: `Payment Request - $${amount}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${paymentId}.pdf`,
          content: pdfBuffer.toString('base64'),
          type: 'application/pdf',
        }
      ]
    });

    console.log(`Payment link email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendExpiryWarningEmail = async (email, paymentLink, amount, paymentId) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Payment Link Expiring Soon</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your payment link expires in 2 days</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #374151; margin-bottom: 10px;">Payment Details</h2>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">Amount</p>
              <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #d97706;">$${amount}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">Payment ID: ${paymentId}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${paymentLink}" style="background: #d97706; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Pay Now Before It Expires
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This payment link will expire in 2 days. Please complete your payment before then.
            </p>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: `Payment Link Expiring Soon - $${amount}`,
      html: emailHtml
    });

    console.log(`Expiry warning email sent to ${email}`);
  } catch (error) {
    console.error('Expiry warning email error:', error);
    throw error;
  }
};

export const sendPaymentSuccessEmail = async (email, amount, paymentId, pdfBuffer) => {
  const subject = 'Payment Successful';

  const emailHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9;">
      <h2 style="color: #0d6efd;">Payment Successful</h2>
      <p>Hi there,</p>
      <p>Thank you! We've successfully received your payment of <strong>${amount}</strong>.</p>
      <table style="margin-top: 20px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; background: #e9ecef;">Payment ID:</td>
          <td style="padding: 8px 12px;">${paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #e9ecef;">Amount Paid:</td>
          <td style="padding: 8px 12px;">${amount}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">If you have any questions, just reply to this email. We're happy to help!</p>
      <p style="margin-top: 40px;">– The Team</p>
    </div>
  `

  console.log("Email: ", email)

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: `Payment Successful`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${paymentId}.pdf`,
          content: pdfBuffer.toString('base64'),
          type: 'application/pdf',
        }
      ]
    });

    console.log('Payment success email sent');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
