import { Resend } from 'resend';
import { render } from '@react-email/components';
import { DisputeToMerchantEmail } from '../email-templates/dispute-to-merchant';

// Initialize Resend client (will be undefined if no API key)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default from email - should be configured in Resend dashboard
const FROM_EMAIL = process.env.DISPUTE_FROM_EMAIL || 'disputes@receipts.ai';

// Issue type display labels
const ISSUE_TYPE_LABELS: Record<string, string> = {
  cancelled: 'Service Cancelled',
  not_delivered: 'Not Delivered',
  different_than_agreed: 'Different Than Agreed',
  unauthorized: 'Unauthorized Transaction',
  other: 'Other Issue',
};

export interface SendDisputeToMerchantInput {
  to: string;
  disputeId: string;
  merchantName: string;
  issueType: string;
  description: string;
  filedDate: Date | string;
  userName?: string;
  evidencePackagePdf: Buffer;
}

export interface SendDisputeConfirmationInput {
  to: string;
  disputeId: string;
  merchantName: string;
  submittedTo: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  demo?: boolean;
}

/**
 * Send dispute notice to merchant with evidence package PDF attached
 */
export async function sendDisputeToMerchant(
  input: SendDisputeToMerchantInput
): Promise<EmailResult> {
  const {
    to,
    disputeId,
    merchantName,
    issueType,
    description,
    filedDate,
    userName,
    evidencePackagePdf,
  } = input;

  // Format the filed date
  const formattedDate =
    typeof filedDate === 'string'
      ? new Date(filedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : filedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

  // Render the React Email template to HTML
  const emailHtml = await render(
    DisputeToMerchantEmail({
      disputeId,
      merchantName,
      issueType,
      issueTypeDisplay: ISSUE_TYPE_LABELS[issueType] || issueType,
      description,
      filedDate: formattedDate,
      userName,
    })
  );

  // Demo mode - no API key configured
  if (!resend) {
    console.log('[Demo Mode] Would send dispute email to merchant');
    console.log('[Demo Mode] To:', to);
    console.log('[Demo Mode] Dispute ID:', disputeId);
    console.log('[Demo Mode] PDF attachment size:', evidencePackagePdf.length, 'bytes');
    return {
      success: true,
      demo: true,
      messageId: `demo-${Date.now()}`,
    };
  }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Consumer Dispute Notice - ${disputeId}`,
      html: emailHtml,
      attachments: [
        {
          filename: `evidence-package-${disputeId}.pdf`,
          content: evidencePackagePdf,
        },
      ],
    });

    if (response.error) {
      console.error('[Email Service] Failed to send:', response.error);
      return {
        success: false,
        error: response.error.message,
      };
    }

    console.log('[Email Service] Dispute email sent to merchant:', to);
    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send confirmation email to user that their dispute was submitted
 */
export async function sendDisputeConfirmation(
  input: SendDisputeConfirmationInput
): Promise<EmailResult> {
  const { to, disputeId, merchantName, submittedTo } = input;

  // Simple confirmation email (could be a React Email template too)
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { color: #0ea5e9; font-size: 24px; font-weight: bold; }
          .success { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; }
          .details { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">RECEIPTS</div>
          <h2>Dispute Submitted Successfully</h2>
          <div class="success">
            <strong>Your dispute has been sent!</strong>
            <p>We've delivered your evidence package to ${submittedTo}.</p>
          </div>
          <div class="details">
            <p><strong>Dispute ID:</strong> ${disputeId}</p>
            <p><strong>Merchant:</strong> ${merchantName}</p>
            <p><strong>Submitted To:</strong> ${submittedTo}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>
            <strong>What happens next?</strong><br>
            The merchant has been asked to respond within 15 business days.
            We'll notify you when we receive a response.
          </p>
          <p>
            If the merchant doesn't respond, you can escalate to your payment
            provider for chargeback processing.
          </p>
          <div class="footer">
            <p>RECEIPTS - When AI transactions go wrong, we make them right.</p>
            <p><a href="https://receipts.ai">receipts.ai</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Demo mode - no API key configured
  if (!resend) {
    console.log('[Demo Mode] Would send confirmation email to user');
    console.log('[Demo Mode] To:', to);
    console.log('[Demo Mode] Dispute ID:', disputeId);
    return {
      success: true,
      demo: true,
      messageId: `demo-confirm-${Date.now()}`,
    };
  }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Dispute Submitted - ${merchantName}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('[Email Service] Failed to send confirmation:', response.error);
      return {
        success: false,
        error: response.error.message,
      };
    }

    console.log('[Email Service] Confirmation email sent to user:', to);
    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error('[Email Service] Error sending confirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!resend;
}
