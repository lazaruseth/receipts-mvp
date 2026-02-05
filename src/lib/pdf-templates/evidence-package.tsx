import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ExtractedTerms, RiskFlag } from '@/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #0ea5e9',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 140,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#1f2937',
  },
  description: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fafafa',
    borderLeft: '3px solid #0ea5e9',
  },
  riskFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
  },
  riskFlagText: {
    fontSize: 9,
    color: '#991b1b',
  },
  analysisBox: {
    padding: 12,
    backgroundColor: '#fffbeb',
    borderLeft: '4px solid #f59e0b',
    marginBottom: 10,
  },
  analysisTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  analysisText: {
    fontSize: 10,
    color: '#78350f',
  },
  termsSection: {
    marginBottom: 8,
  },
  termsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 2,
  },
  termsValue: {
    fontSize: 9,
    color: '#6b7280',
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  watermark: {
    fontSize: 8,
    color: '#0ea5e9',
    textAlign: 'center',
    marginTop: 5,
  },
});

// Risk flag labels
const RISK_FLAG_DISPLAY: Record<string, string> = {
  BINDING_ARBITRATION: 'Binding Arbitration Required',
  CHARGEBACK_WAIVER: 'Chargeback Rights Waived',
  CLASS_ACTION_WAIVER: 'Class Action Waiver',
  AUTO_RENEWAL_HIDDEN: 'Hidden Auto-Renewal Terms',
  NON_REFUNDABLE: 'Non-Refundable',
  FOREIGN_JURISDICTION: 'Foreign Jurisdiction',
  BROAD_INDEMNIFICATION: 'Broad Indemnification Clause',
  DATA_SHARING_EXTENSIVE: 'Extensive Data Sharing',
  SHORT_DISPUTE_WINDOW: 'Short Dispute Window',
  PRICE_NOT_GUARANTEED: 'Price Not Guaranteed',
};

// Issue type labels
const ISSUE_TYPE_DISPLAY: Record<string, string> = {
  cancelled: 'Service Cancelled',
  not_delivered: 'Not Delivered',
  different_than_agreed: 'Different Than Agreed',
  unauthorized: 'Unauthorized Transaction',
  other: 'Other Issue',
};

export interface EvidencePackageProps {
  disputeId: string;
  merchantName: string;
  issueType: string;
  description: string;
  agreementTitle: string;
  agreementUrl?: string;
  capturedAt: Date | string;
  extractedTerms?: ExtractedTerms;
  violationAnalysis: string;
  timestampProof?: string;
  documentHash?: string;
  riskFlags: (RiskFlag | string)[];
  generatedAt?: Date;
}

export function EvidencePackageDocument(props: EvidencePackageProps) {
  const {
    disputeId,
    merchantName,
    issueType,
    description,
    agreementTitle,
    capturedAt,
    extractedTerms,
    violationAnalysis,
    timestampProof,
    documentHash,
    riskFlags,
    generatedAt = new Date(),
  } = props;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>RECEIPTS</Text>
          <Text style={styles.title}>Evidence Package</Text>
          <Text style={styles.subtitle}>
            Dispute ID: {disputeId} | Generated: {formatDate(generatedAt)}
          </Text>
        </View>

        {/* Dispute Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DISPUTE SUMMARY</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Merchant:</Text>
            <Text style={styles.value}>{merchantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Issue Type:</Text>
            <Text style={styles.value}>
              {ISSUE_TYPE_DISPLAY[issueType] || issueType}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Filed:</Text>
            <Text style={styles.value}>{formatDate(generatedAt)}</Text>
          </View>
          <Text style={{ ...styles.label, marginTop: 10, marginBottom: 5 }}>
            Description:
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Original Agreement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORIGINAL AGREEMENT</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Document:</Text>
            <Text style={styles.value}>{agreementTitle}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Captured:</Text>
            <Text style={styles.value}>{formatDate(capturedAt)}</Text>
          </View>
          {documentHash && (
            <View style={styles.row}>
              <Text style={styles.label}>Document Hash:</Text>
              <Text style={styles.value}>{documentHash}</Text>
            </View>
          )}
          {timestampProof && (
            <View style={styles.row}>
              <Text style={styles.label}>Blockchain Proof:</Text>
              <Text style={styles.value}>{timestampProof}</Text>
            </View>
          )}
        </View>

        {/* Violation Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI VIOLATION ANALYSIS</Text>
          <View style={styles.analysisBox}>
            <Text style={styles.analysisTitle}>Assessment</Text>
            <Text style={styles.analysisText}>{violationAnalysis}</Text>
          </View>
        </View>

        {/* Risk Flags */}
        {riskFlags && riskFlags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IDENTIFIED RISK FLAGS</Text>
            {riskFlags.map((flag, index) => (
              <View key={index} style={styles.riskFlag}>
                <Text style={styles.riskFlagText}>
                  ⚠️ {RISK_FLAG_DISPLAY[flag] || flag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Extracted Terms */}
        {extractedTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXTRACTED TERMS</Text>

            {/* Refund Policy */}
            <View style={styles.termsSection}>
              <Text style={styles.termsLabel}>Refund Policy:</Text>
              <Text style={styles.termsValue}>
                Type: {extractedTerms.refundPolicy?.type || 'Not specified'}
                {extractedTerms.refundPolicy?.window &&
                  ` | Window: ${extractedTerms.refundPolicy.window}`}
              </Text>
              {extractedTerms.refundPolicy?.conditions?.map((c, i) => (
                <Text key={i} style={styles.termsValue}>
                  • {c}
                </Text>
              ))}
            </View>

            {/* Cancellation Policy */}
            <View style={styles.termsSection}>
              <Text style={styles.termsLabel}>Cancellation Policy:</Text>
              <Text style={styles.termsValue}>
                {extractedTerms.cancellationPolicy?.fee
                  ? `Fee: ${extractedTerms.cancellationPolicy.feeType === 'percentage' ? `${extractedTerms.cancellationPolicy.fee}%` : `$${extractedTerms.cancellationPolicy.fee}`}`
                  : 'No fee specified'}
                {extractedTerms.cancellationPolicy?.window &&
                  ` | Window: ${extractedTerms.cancellationPolicy.window}`}
              </Text>
            </View>

            {/* Dispute Resolution */}
            <View style={styles.termsSection}>
              <Text style={styles.termsLabel}>Dispute Resolution:</Text>
              <Text style={styles.termsValue}>
                Method: {extractedTerms.disputeResolution?.method || 'Not specified'}
                {extractedTerms.disputeResolution?.jurisdiction &&
                  ` | Jurisdiction: ${extractedTerms.disputeResolution.jurisdiction}`}
              </Text>
              <Text style={styles.termsValue}>
                Class Action Waiver:{' '}
                {extractedTerms.disputeResolution?.classActionWaiver ? 'Yes' : 'No'}
                {' | '}
                Chargeback Rights:{' '}
                {extractedTerms.disputeResolution?.chargebackRightsPreserved
                  ? 'Preserved'
                  : 'Waived'}
              </Text>
            </View>

            {/* Liability */}
            {extractedTerms.liability && (
              <View style={styles.termsSection}>
                <Text style={styles.termsLabel}>Liability:</Text>
                {extractedTerms.liability.maxLiability && (
                  <Text style={styles.termsValue}>
                    Maximum Liability: {extractedTerms.liability.maxLiability}
                  </Text>
                )}
                {extractedTerms.liability.limitations?.map((l, i) => (
                  <Text key={i} style={styles.termsValue}>
                    • {l}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This evidence package was generated by RECEIPTS - AI Transaction Protection
          </Text>
          <Text style={styles.footerText}>
            Document integrity can be verified using the document hash above
          </Text>
          <Text style={styles.watermark}>
            receipts.ai | When AI transactions go wrong, we make them right.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
