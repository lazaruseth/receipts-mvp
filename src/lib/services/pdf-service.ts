import ReactPDF from '@react-pdf/renderer';
import {
  EvidencePackageDocument,
  type EvidencePackageProps,
} from '../pdf-templates/evidence-package';
import type { ExtractedTerms, RiskFlag } from '@/types';

export interface GenerateEvidencePdfInput {
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
}

/**
 * Generate a PDF evidence package for a dispute
 * Returns a Buffer containing the PDF data
 */
export async function generateEvidencePackagePdf(
  input: GenerateEvidencePdfInput
): Promise<Buffer> {
  const props: EvidencePackageProps = {
    ...input,
    generatedAt: new Date(),
  };

  // Render PDF to stream
  const pdfStream = await ReactPDF.renderToStream(
    EvidencePackageDocument(props)
  );

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    pdfStream.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    pdfStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    pdfStream.on('error', (err: Error) => {
      reject(err);
    });
  });
}

/**
 * Generate a PDF and return as base64 string (useful for email attachments)
 */
export async function generateEvidencePackagePdfBase64(
  input: GenerateEvidencePdfInput
): Promise<string> {
  const buffer = await generateEvidencePackagePdf(input);
  return buffer.toString('base64');
}
