#!/usr/bin/env node
/**
 * RECEIPTS Guard - Agreement Capture Script for OpenClaw
 *
 * Usage:
 *   node capture.js "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"
 *
 * Environment variables (injected by OpenClaw):
 *   RECEIPTS_API_KEY - Your RECEIPTS API key
 *   RECEIPTS_AGENT_ID - Unique agent identifier
 */

const https = require('https');
const crypto = require('crypto');

// Get arguments
const [,, documentText, sourceUrl, merchantName] = process.argv;

if (!documentText) {
  console.error(JSON.stringify({
    error: 'Missing required argument: documentText',
    usage: 'node capture.js "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"'
  }));
  process.exit(1);
}

// Get config from environment (injected by OpenClaw)
const apiKey = process.env.RECEIPTS_API_KEY;
const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

if (!apiKey) {
  console.error(JSON.stringify({
    error: 'RECEIPTS_API_KEY not configured',
    help: 'Add RECEIPTS_API_KEY to skills.entries.receipts-guard.env in openclaw.json'
  }));
  process.exit(1);
}

// Create document hash for local verification
const documentHash = crypto
  .createHash('sha256')
  .update(documentText)
  .digest('hex');

// Prepare capture request
const captureData = JSON.stringify({
  agentId,
  agentType: 'openclaw',
  documentText,
  sourceUrl: sourceUrl || 'unknown',
  merchantName: merchantName || 'Unknown Merchant',
  capturedAt: new Date().toISOString(),
  documentHash,
});

const options = {
  hostname: 'api.receipts.fi',
  port: 443,
  path: '/v1/capture',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Agent-Type': 'openclaw',
    'Content-Length': Buffer.byteLength(captureData),
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      // Output result for OpenClaw to parse
      console.log(JSON.stringify({
        captureId: result.captureId || `local_${documentHash.slice(0, 16)}`,
        recommendation: result.recommendation || analyzeLocally(documentText),
        trustScore: result.trustScore || calculateLocalTrustScore(documentText),
        riskFlags: result.riskFlags || detectLocalRiskFlags(documentText),
        summary: result.summary || 'Agreement captured successfully',
        documentHash,
        timestamp: new Date().toISOString(),
      }, null, 2));
    } catch (e) {
      // API unavailable, fall back to local analysis
      console.log(JSON.stringify({
        captureId: `local_${documentHash.slice(0, 16)}`,
        recommendation: analyzeLocally(documentText),
        trustScore: calculateLocalTrustScore(documentText),
        riskFlags: detectLocalRiskFlags(documentText),
        summary: 'Local capture (API unavailable)',
        documentHash,
        timestamp: new Date().toISOString(),
        offline: true,
      }, null, 2));
    }
  });
});

req.on('error', (e) => {
  // Network error, fall back to local analysis
  console.log(JSON.stringify({
    captureId: `local_${documentHash.slice(0, 16)}`,
    recommendation: analyzeLocally(documentText),
    trustScore: calculateLocalTrustScore(documentText),
    riskFlags: detectLocalRiskFlags(documentText),
    summary: 'Local capture (network unavailable)',
    documentHash,
    timestamp: new Date().toISOString(),
    offline: true,
  }, null, 2));
});

req.write(captureData);
req.end();

// Local fallback functions

function analyzeLocally(text) {
  const flags = detectLocalRiskFlags(text);
  if (flags.length >= 3) return 'block';
  if (flags.length >= 1) return 'require_approval';
  return 'proceed';
}

function calculateLocalTrustScore(text) {
  const flags = detectLocalRiskFlags(text);
  return Math.max(0, 100 - (flags.length * 20));
}

function detectLocalRiskFlags(text) {
  const flags = [];
  const lowerText = text.toLowerCase();

  // High-risk patterns
  const patterns = [
    { pattern: /binding arbitration/i, flag: 'Binding arbitration clause' },
    { pattern: /class action waiver/i, flag: 'Class action waiver' },
    { pattern: /waive.{0,20}(right|claim)/i, flag: 'Rights waiver detected' },
    { pattern: /no refund/i, flag: 'No refund policy' },
    { pattern: /non-refundable/i, flag: 'Non-refundable terms' },
    { pattern: /automatic renewal/i, flag: 'Auto-renewal clause' },
    { pattern: /perpetual license/i, flag: 'Perpetual license grant' },
    { pattern: /sell.{0,20}(data|information)/i, flag: 'Data selling clause' },
    { pattern: /share.{0,20}third part/i, flag: 'Third-party data sharing' },
    { pattern: /limit.{0,20}liability/i, flag: 'Limited liability clause' },
    { pattern: /indemnif/i, flag: 'Indemnification clause' },
    { pattern: /governing law.{0,50}(delaware|california)/i, flag: 'US jurisdiction clause' },
  ];

  for (const { pattern, flag } of patterns) {
    if (pattern.test(text)) {
      flags.push(flag);
    }
  }

  return flags;
}
