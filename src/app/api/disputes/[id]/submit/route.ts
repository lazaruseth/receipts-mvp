import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDisputeById, updateDisputeStatus } from '@/lib/services/dispute-service';
import { getAgreementById } from '@/lib/services/agreement-service';
import { generateEvidencePackagePdf } from '@/lib/services/pdf-service';
import {
  sendDisputeToMerchant,
  sendDisputeConfirmation,
  isEmailServiceConfigured,
} from '@/lib/services/email-service';

// Demo user ID for unauthenticated access
const DEMO_USER_ID = 'demo-user-123';

/**
 * POST /api/disputes/[id]/submit
 * Submit a dispute to merchant or card issuer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || DEMO_USER_ID;
    const userEmail = session?.user?.email;
    const userName = session?.user?.name;
    const { id: disputeId } = await params;

    const body = await request.json();
    const { target, merchantEmail } = body; // 'merchant' or 'issuer', and optional merchant email

    if (!target || !['merchant', 'issuer'].includes(target)) {
      return NextResponse.json(
        { error: 'Invalid submission target. Must be "merchant" or "issuer".' },
        { status: 400 }
      );
    }

    // Require merchant email for merchant submissions
    if (target === 'merchant' && !merchantEmail) {
      return NextResponse.json(
        { error: 'Merchant email is required for merchant submissions.' },
        { status: 400 }
      );
    }

    // Get existing dispute
    const dispute = await getDisputeById(disputeId, userId);
    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Validate dispute can be submitted
    if (dispute.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot submit dispute in "${dispute.status}" status. Only draft disputes can be submitted.` },
        { status: 400 }
      );
    }

    // Get related agreement for evidence package
    const agreement = await getAgreementById(dispute.agreementId, userId);
    if (!agreement) {
      return NextResponse.json(
        { error: 'Related agreement not found' },
        { status: 404 }
      );
    }

    // Determine submission target string
    const submittedTo = target === 'merchant'
      ? `Merchant Support (${merchantEmail})`
      : 'Card Issuer (Chargeback)';

    // Generate PDF evidence package
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateEvidencePackagePdf({
        disputeId: dispute.id,
        merchantName: agreement.merchantName,
        issueType: dispute.issueType,
        description: dispute.description,
        agreementTitle: agreement.documentTitle,
        agreementUrl: agreement.sourceUrl,
        capturedAt: agreement.capturedAt,
        extractedTerms: agreement.extractedTerms,
        violationAnalysis: (dispute.evidencePackage as { violationAnalysis?: string } | null)?.violationAnalysis || 'Analysis not available',
        timestampProof: agreement.blockchainTxId,
        documentHash: agreement.documentHash,
        riskFlags: agreement.riskFlags,
      });
      console.log(`[Dispute Submit] Generated PDF evidence package: ${pdfBuffer.length} bytes`);
    } catch (pdfError) {
      console.error('[Dispute Submit] PDF generation failed:', pdfError);
      // Continue without PDF - still update status
    }

    // Send email to merchant (if target is merchant and we have PDF)
    let emailResult = null;
    if (target === 'merchant' && merchantEmail && pdfBuffer) {
      try {
        emailResult = await sendDisputeToMerchant({
          to: merchantEmail,
          disputeId: dispute.id,
          merchantName: agreement.merchantName,
          issueType: dispute.issueType,
          description: dispute.description,
          filedDate: new Date(),
          userName: userName || undefined,
          evidencePackagePdf: pdfBuffer,
        });
        console.log('[Dispute Submit] Merchant email result:', emailResult);
      } catch (emailError) {
        console.error('[Dispute Submit] Failed to send merchant email:', emailError);
      }
    }

    // Send confirmation to user (if we have their email)
    if (userEmail) {
      try {
        await sendDisputeConfirmation({
          to: userEmail,
          disputeId: dispute.id,
          merchantName: agreement.merchantName,
          submittedTo,
        });
        console.log('[Dispute Submit] User confirmation sent to:', userEmail);
      } catch (confirmError) {
        console.error('[Dispute Submit] Failed to send user confirmation:', confirmError);
      }
    }

    // Update dispute status to submitted
    const updatedDispute = await updateDisputeStatus(
      disputeId,
      userId,
      'submitted',
      submittedTo
    );

    if (!updatedDispute) {
      return NextResponse.json(
        { error: 'Failed to update dispute status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dispute submitted to ${submittedTo}`,
      dispute: updatedDispute,
      emailSent: emailResult?.success ?? false,
      emailDemo: emailResult?.demo ?? false,
      pdfGenerated: !!pdfBuffer,
      emailConfigured: isEmailServiceConfigured(),
    });
  } catch (error) {
    console.error('Error submitting dispute:', error);
    return NextResponse.json(
      { error: 'Failed to submit dispute' },
      { status: 500 }
    );
  }
}
