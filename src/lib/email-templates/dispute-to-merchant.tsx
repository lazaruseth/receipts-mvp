import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DisputeToMerchantEmailProps {
  disputeId: string;
  merchantName: string;
  issueType: string;
  issueTypeDisplay: string;
  description: string;
  filedDate: string;
  userName?: string;
}

// Issue type display mapping
const ISSUE_LABELS: Record<string, string> = {
  cancelled: 'Service Cancelled',
  not_delivered: 'Not Delivered',
  different_than_agreed: 'Different Than Agreed',
  unauthorized: 'Unauthorized Transaction',
  other: 'Other Issue',
};

export function DisputeToMerchantEmail({
  disputeId,
  merchantName,
  issueType,
  issueTypeDisplay,
  description,
  filedDate,
  userName,
}: DisputeToMerchantEmailProps) {
  const displayIssueType = issueTypeDisplay || ISSUE_LABELS[issueType] || issueType;

  return (
    <Html>
      <Head />
      <Preview>Formal Dispute Notice - {disputeId}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logo}>RECEIPTS</Text>
            <Text style={tagline}>AI Transaction Protection</Text>
          </Section>

          <Hr style={hr} />

          {/* Title */}
          <Heading style={heading}>Formal Dispute Notice</Heading>

          {/* Introduction */}
          <Text style={paragraph}>
            This is a formal notice of dispute filed through RECEIPTS, the AI
            transaction protection service. A consumer has filed a dispute
            regarding a transaction with your organization.
          </Text>

          {/* Dispute Details */}
          <Section style={detailsSection}>
            <Text style={detailsTitle}>Dispute Details</Text>
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={detailLabel}>Dispute ID:</td>
                  <td style={detailValue}>{disputeId}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Merchant:</td>
                  <td style={detailValue}>{merchantName}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Issue Type:</td>
                  <td style={detailValue}>{displayIssueType}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Filed:</td>
                  <td style={detailValue}>{filedDate}</td>
                </tr>
                {userName && (
                  <tr>
                    <td style={detailLabel}>Filed By:</td>
                    <td style={detailValue}>{userName}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          {/* Consumer Description */}
          <Section style={descriptionSection}>
            <Text style={descriptionTitle}>Consumer Statement</Text>
            <Text style={descriptionText}>{description}</Text>
          </Section>

          {/* Evidence Notice */}
          <Section style={evidenceSection}>
            <Text style={evidenceTitle}>Evidence Package Attached</Text>
            <Text style={paragraph}>
              A complete evidence package is attached to this email as a PDF
              document. This package includes:
            </Text>
            <ul style={bulletList}>
              <li style={bulletItem}>
                Original agreement captured at time of transaction
              </li>
              <li style={bulletItem}>
                Blockchain-verified timestamp proof of agreement
              </li>
              <li style={bulletItem}>AI analysis of potential terms violations</li>
              <li style={bulletItem}>Extracted policy terms from your agreement</li>
            </ul>
          </Section>

          <Hr style={hr} />

          {/* Response Request */}
          <Section>
            <Text style={paragraph}>
              <strong>Please respond within 15 business days.</strong> Failure to
              respond may result in escalation to the consumer&apos;s payment provider
              for chargeback processing.
            </Text>
            <Text style={paragraph}>
              To resolve this dispute, please contact the consumer directly or
              respond to this email with your resolution offer.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              This dispute was filed through{' '}
              <Link href="https://receipts.ai" style={link}>
                RECEIPTS
              </Link>
              , an AI transaction protection service that helps consumers resolve
              disputes with timestamped evidence packages.
            </Text>
            <Text style={footerTagline}>
              When AI transactions go wrong, we make them right.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const headerSection = {
  padding: '20px 48px 0',
};

const logo = {
  color: '#0ea5e9',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0',
};

const tagline = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '4px 0 0',
};

const heading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '30px 48px 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 48px 16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 48px',
};

const detailsSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '0 48px 20px',
  padding: '16px',
};

const detailsTitle = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px',
};

const detailsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '13px',
  padding: '4px 16px 4px 0',
  verticalAlign: 'top' as const,
  width: '120px',
};

const detailValue = {
  color: '#1f2937',
  fontSize: '13px',
  padding: '4px 0',
  verticalAlign: 'top' as const,
};

const descriptionSection = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  margin: '0 48px 20px',
  padding: '16px',
};

const descriptionTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px',
};

const descriptionText = {
  color: '#78350f',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const evidenceSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '0 48px 20px',
  padding: '16px',
};

const evidenceTitle = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px',
};

const bulletList = {
  margin: '8px 0 0 20px',
  padding: '0',
};

const bulletItem = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '22px',
  margin: '0',
};

const footerSection = {
  padding: '0 48px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const footerTagline = {
  color: '#0ea5e9',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '0',
};

const link = {
  color: '#0ea5e9',
  textDecoration: 'none',
};

export default DisputeToMerchantEmail;
