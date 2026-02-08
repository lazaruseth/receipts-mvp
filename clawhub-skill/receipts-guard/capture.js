#!/usr/bin/env node
/**
 * RECEIPTS Guard v0.3.0 - Local Agreement Capture for OpenClaw
 *
 * Captures and analyzes agreements locally. No API calls. Your data stays on your machine.
 *
 * Commands:
 *   capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" [--consent-type=TYPE] [--element=SELECTOR] [--screenshot=BASE64]
 *   query --merchant="X" --risk-level=high --after="2026-01-01"
 *   list
 *   export --format=json|csv
 *   diff --capture1=ID --capture2=ID
 *   dispute --captureId=ID
 *
 * v0.3.0 Features:
 *   - Consent Proofs: Capture HOW consent was given, not just what was agreed
 *   - Diff Generation: See exactly what changed between ToS versions
 *   - Implicit Consent Detection: Flags "continued use = consent" patterns
 *   - Dispute Packages: Generate evidence reports
 *
 * Environment variables (optional):
 *   RECEIPTS_AGENT_ID - Unique agent identifier
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Receipts directory
const RECEIPTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.openclaw',
  'receipts'
);

// Index file for fast queries
const INDEX_FILE = path.join(RECEIPTS_DIR, 'index.json');

// Version
const VERSION = '0.3.0';

// Get command and arguments
const args = process.argv.slice(2);
const command = args[0];

// Route to appropriate handler
switch (command) {
  case 'capture':
    handleCapture(args.slice(1));
    break;
  case 'query':
    handleQuery(args.slice(1));
    break;
  case 'list':
    handleList();
    break;
  case 'export':
    handleExport(args.slice(1));
    break;
  case 'diff':
    handleDiff(args.slice(1));
    break;
  case 'dispute':
    handleDispute(args.slice(1));
    break;
  default:
    // Legacy mode: if first arg looks like document text, treat as capture
    if (command && command.length > 20) {
      handleCapture(args);
    } else {
      showHelp();
    }
}

// === CAPTURE COMMAND (Enhanced with Consent Proofs) ===
function handleCapture(args) {
  const filters = parseFilters(args);

  // Extract positional args (text, url, merchant) and flags
  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const [documentText, sourceUrl, merchantName] = positionalArgs;

  if (!documentText) {
    console.error(JSON.stringify({
      error: 'Missing required argument: documentText',
      usage: 'node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" [--consent-type=explicit|implicit|continued_use]'
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

  // Create document hash
  const documentHash = crypto
    .createHash('sha256')
    .update(documentText)
    .digest('hex');

  // Check for duplicates
  const duplicate = checkDuplicate(documentHash);
  if (duplicate) {
    console.log(JSON.stringify({
      ...duplicate,
      note: `Duplicate of existing capture from ${duplicate.timestamp}`,
      isDuplicate: true
    }, null, 2));
    return;
  }

  // Check for changes from same URL
  const changeInfo = detectChanges(sourceUrl, documentHash);

  // Analyze locally
  const riskFlags = detectRiskFlags(documentText);
  const consentFlags = detectConsentType(documentText);
  const allFlags = [...riskFlags, ...consentFlags];

  const trustScore = Math.max(0, 100 - (allFlags.length * 15));
  const recommendation = getRecommendation(allFlags, consentFlags);

  // Build consent proof
  const consentProof = {
    type: filters['consent-type'] || detectImplicitConsentType(documentText),
    capturedAt: new Date().toISOString(),
    elementSelector: filters['element'] || null,
    screenshotHash: filters['screenshot'] ?
      crypto.createHash('sha256').update(filters['screenshot']).digest('hex') : null,
    agentAction: filters['action'] || 'document_capture',
  };

  // Create capture record
  const capture = {
    captureId: `local_${documentHash.slice(0, 16)}`,
    recommendation,
    trustScore,
    riskFlags: allFlags,
    summary: generateSummary(allFlags, trustScore, consentProof.type),
    documentHash,
    sourceUrl: sourceUrl || 'unknown',
    merchantName: merchantName || 'Unknown Merchant',
    agentId,
    timestamp: new Date().toISOString(),
    documentLength: documentText.length,
    version: VERSION,

    // NEW: Consent Proof
    consentProof,

    // Legal disclaimer
    disclaimer: 'RECEIPTS flags known problematic patterns only. Not a substitute for legal review.',
  };

  // Add change detection info if applicable
  if (changeInfo) {
    capture.changeDetected = true;
    capture.previousCapture = changeInfo.previousCaptureId;
    capture.changeNote = `Terms changed since ${changeInfo.previousTimestamp}`;
    capture.diffAvailable = true;
  }

  // Output result
  console.log(JSON.stringify(capture, null, 2));

  // Save locally
  saveLocalReceipt(capture, documentText);

  // Save screenshot if provided
  if (filters['screenshot']) {
    saveScreenshot(capture.captureId, filters['screenshot']);
  }

  updateIndex(capture);
}

// === DIFF COMMAND (New in v0.3.0) ===
function handleDiff(args) {
  const filters = parseFilters(args);
  const capture1Id = filters['capture1'];
  const capture2Id = filters['capture2'];

  if (!capture1Id || !capture2Id) {
    // If only one ID provided, diff against previous from same URL
    if (capture1Id) {
      const index = loadIndex();
      const capture1 = index.find(r => r.captureId === capture1Id);
      if (capture1 && capture1.previousCapture) {
        return diffCaptures(capture1.previousCapture, capture1Id);
      }
    }
    console.error(JSON.stringify({
      error: 'Missing capture IDs',
      usage: 'node capture.js diff --capture1=ID --capture2=ID'
    }));
    process.exit(1);
  }

  diffCaptures(capture1Id, capture2Id);
}

function diffCaptures(id1, id2) {
  const text1Path = path.join(RECEIPTS_DIR, `${id1}.txt`);
  const text2Path = path.join(RECEIPTS_DIR, `${id2}.txt`);

  try {
    const text1 = fs.readFileSync(text1Path, 'utf8');
    const text2 = fs.readFileSync(text2Path, 'utf8');

    const diff = generateDiff(text1, text2);
    const index = loadIndex();
    const meta1 = index.find(r => r.captureId === id1);
    const meta2 = index.find(r => r.captureId === id2);

    console.log(JSON.stringify({
      comparison: {
        older: { captureId: id1, timestamp: meta1?.timestamp, merchantName: meta1?.merchantName },
        newer: { captureId: id2, timestamp: meta2?.timestamp, merchantName: meta2?.merchantName }
      },
      summary: {
        totalChanges: diff.additions.length + diff.deletions.length,
        additions: diff.additions.length,
        deletions: diff.deletions.length,
        significantChanges: diff.significant
      },
      changes: diff,
      warning: diff.significant.length > 0 ?
        'SIGNIFICANT CHANGES DETECTED - Review carefully before accepting' : null
    }, null, 2));

  } catch (e) {
    console.error(JSON.stringify({
      error: 'Could not read capture files',
      details: e.message
    }));
  }
}

function generateDiff(text1, text2) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');

  const additions = [];
  const deletions = [];
  const significant = [];

  // Simple line-by-line diff
  const set1 = new Set(lines1.map(l => l.trim()).filter(l => l.length > 0));
  const set2 = new Set(lines2.map(l => l.trim()).filter(l => l.length > 0));

  // Find deletions (in text1 but not in text2)
  for (const line of set1) {
    if (!set2.has(line) && line.length > 10) {
      deletions.push(line.substring(0, 200));
      // Check if deletion is significant
      if (isSignificantClause(line)) {
        significant.push({ type: 'removed', text: line.substring(0, 200) });
      }
    }
  }

  // Find additions (in text2 but not in text1)
  for (const line of set2) {
    if (!set1.has(line) && line.length > 10) {
      additions.push(line.substring(0, 200));
      // Check if addition is significant
      if (isSignificantClause(line)) {
        significant.push({ type: 'added', text: line.substring(0, 200) });
      }
    }
  }

  return { additions, deletions, significant };
}

function isSignificantClause(text) {
  const significantPatterns = [
    /arbitration/i,
    /class action/i,
    /waive/i,
    /refund/i,
    /liability/i,
    /indemnif/i,
    /terminat/i,
    /jurisdiction/i,
    /governing law/i,
    /binding/i,
    /irrevocable/i,
    /perpetual/i,
  ];
  return significantPatterns.some(p => p.test(text));
}

// === DISPUTE COMMAND (New in v0.3.0) ===
function handleDispute(args) {
  const filters = parseFilters(args);
  const captureId = filters['captureId'] || filters['id'];

  if (!captureId) {
    console.error(JSON.stringify({
      error: 'Missing captureId',
      usage: 'node capture.js dispute --captureId=local_xxx'
    }));
    process.exit(1);
  }

  const index = loadIndex();
  const capture = index.find(r => r.captureId === captureId);

  if (!capture) {
    console.error(JSON.stringify({ error: 'Capture not found' }));
    process.exit(1);
  }

  // Load full document text
  const textPath = path.join(RECEIPTS_DIR, `${captureId}.txt`);
  let documentText = '';
  try {
    documentText = fs.readFileSync(textPath, 'utf8');
  } catch (e) {}

  // Generate dispute package
  const disputePackage = {
    title: `Dispute Evidence Package - ${capture.merchantName}`,
    generatedAt: new Date().toISOString(),

    summary: {
      merchant: capture.merchantName,
      agreementDate: capture.timestamp,
      sourceUrl: capture.sourceUrl,
      documentHash: capture.documentHash,
      trustScore: capture.trustScore,
      recommendation: capture.recommendation,
    },

    consentEvidence: {
      type: capture.consentProof?.type || 'unknown',
      capturedAt: capture.consentProof?.capturedAt || capture.timestamp,
      agentAction: capture.consentProof?.agentAction || 'document_capture',
      hasScreenshot: !!capture.consentProof?.screenshotHash,
      screenshotHash: capture.consentProof?.screenshotHash,
    },

    riskAnalysis: {
      flagsDetected: capture.riskFlags,
      flagCount: capture.riskFlags?.length || 0,
      concerns: capture.riskFlags?.map(flag => ({
        flag,
        implication: getRiskImplication(flag)
      }))
    },

    changeHistory: capture.changeDetected ? {
      termsChanged: true,
      previousCapture: capture.previousCapture,
      changeNote: capture.changeNote,
      recommendation: 'Request diff report for detailed comparison'
    } : {
      termsChanged: false,
      note: 'No prior captures from this URL to compare'
    },

    documentPreview: documentText.substring(0, 1000) + (documentText.length > 1000 ? '...' : ''),

    legalNote: `This evidence package was generated by RECEIPTS Guard v${VERSION}. ` +
      'It captures what terms existed at the time of agreement and how consent was recorded. ' +
      'This is NOT legal advice. Consult with a qualified attorney for dispute resolution.',

    exportPaths: {
      fullDocument: textPath,
      metadata: path.join(RECEIPTS_DIR, `${captureId}.json`),
      screenshot: capture.consentProof?.screenshotHash ?
        path.join(RECEIPTS_DIR, `${captureId}.screenshot`) : null
    }
  };

  console.log(JSON.stringify(disputePackage, null, 2));
}

function getRiskImplication(flag) {
  const implications = {
    'Binding arbitration clause': 'You may be required to resolve disputes through arbitration instead of court',
    'Class action waiver': 'You may not be able to join class action lawsuits against this merchant',
    'Rights waiver detected': 'You may be waiving certain legal rights',
    'No refund policy': 'Purchases may be final with no refund available',
    'Non-refundable terms': 'Payments are non-refundable under these terms',
    'Auto-renewal clause': 'Service may automatically renew and charge your payment method',
    'Perpetual license grant': 'You may be granting perpetual rights over your content',
    'Irrevocable terms': 'Certain commitments may not be reversible',
    'Data selling clause': 'Your data may be sold to third parties',
    'Third-party data sharing': 'Your data may be shared with third parties',
    'Limited liability clause': 'The merchant limits their liability for damages',
    'Indemnification clause': 'You may be required to cover the merchant\'s legal costs',
    'Hold harmless clause': 'You agree not to hold the merchant responsible for certain issues',
    'US jurisdiction clause': 'Disputes governed by Delaware/California law',
    'Exclusive jurisdiction clause': 'Disputes must be resolved in a specific jurisdiction',
    'Termination without notice': 'Service can be terminated without prior notice',
    'Unilateral modification rights': 'Terms can be changed at any time without your consent',
    'Implicit consent pattern': 'Continued use may constitute agreement to updated terms',
    'Continued use consent': 'Using the service after notice = accepting new terms',
  };
  return implications[flag] || 'Review this clause carefully';
}

// === QUERY COMMAND ===
function handleQuery(args) {
  const filters = parseFilters(args);
  const index = loadIndex();

  let results = index;

  // Apply filters
  if (filters.merchant) {
    const searchTerm = filters.merchant.toLowerCase();
    results = results.filter(r =>
      r.merchantName.toLowerCase().includes(searchTerm)
    );
  }

  if (filters['risk-level']) {
    const level = filters['risk-level'];
    if (level === 'high') {
      results = results.filter(r => r.recommendation === 'block');
    } else if (level === 'medium') {
      results = results.filter(r => r.recommendation === 'require_approval');
    } else if (level === 'low') {
      results = results.filter(r => r.recommendation === 'proceed');
    }
  }

  if (filters['consent-type']) {
    results = results.filter(r =>
      r.consentProof?.type === filters['consent-type']
    );
  }

  if (filters.after) {
    const afterDate = new Date(filters.after);
    results = results.filter(r => new Date(r.timestamp) >= afterDate);
  }

  if (filters.before) {
    const beforeDate = new Date(filters.before);
    results = results.filter(r => new Date(r.timestamp) <= beforeDate);
  }

  console.log(JSON.stringify({
    count: results.length,
    results: results
  }, null, 2));
}

// === LIST COMMAND ===
function handleList() {
  const index = loadIndex();

  console.log(JSON.stringify({
    count: index.length,
    receipts: index.map(r => ({
      captureId: r.captureId,
      merchantName: r.merchantName,
      trustScore: r.trustScore,
      recommendation: r.recommendation,
      consentType: r.consentProof?.type || 'unknown',
      timestamp: r.timestamp,
      sourceUrl: r.sourceUrl,
      hasChanges: r.changeDetected || false
    }))
  }, null, 2));
}

// === EXPORT COMMAND ===
function handleExport(args) {
  const filters = parseFilters(args);
  const format = filters.format || 'json';
  const index = loadIndex();

  if (format === 'csv') {
    // CSV header
    console.log('captureId,merchantName,sourceUrl,trustScore,recommendation,consentType,riskFlags,timestamp,changeDetected');
    // CSV rows
    index.forEach(r => {
      const flags = (r.riskFlags || []).join('; ');
      const consentType = r.consentProof?.type || 'unknown';
      console.log(`"${r.captureId}","${r.merchantName}","${r.sourceUrl}",${r.trustScore},"${r.recommendation}","${consentType}","${flags}","${r.timestamp}",${r.changeDetected || false}`);
    });
  } else {
    // Full JSON export with document text
    const fullExport = index.map(r => {
      const textFile = path.join(RECEIPTS_DIR, `${r.captureId}.txt`);
      let documentText = '';
      try {
        documentText = fs.readFileSync(textFile, 'utf8');
      } catch (e) {}
      return { ...r, documentText };
    });
    console.log(JSON.stringify(fullExport, null, 2));
  }
}

// === HELPER FUNCTIONS ===

function showHelp() {
  console.log(`
RECEIPTS Guard v${VERSION} - Local Agreement Capture

"Who controls the evidence becomes who controls the dispute."

Commands:
  capture "TEXT" "URL" "MERCHANT"  Capture a new agreement
    --consent-type=TYPE            explicit|implicit|continued_use
    --element=SELECTOR             DOM element that triggered consent
    --screenshot=BASE64            Screenshot at time of consent
    --action=ACTION                Agent action (click_accept, scroll_to_bottom, etc.)

  query [filters]                  Search captured receipts
    --merchant="Company Name"      Filter by merchant
    --risk-level=high|medium|low   Filter by risk level
    --consent-type=TYPE            Filter by consent type
    --after="2026-01-01"           Filter by date
    --before="2026-12-31"          Filter by date

  list                             List all receipts

  export --format=json|csv         Export all receipts

  diff --capture1=ID --capture2=ID Compare two captures

  dispute --captureId=ID           Generate dispute evidence package

Examples:
  node capture.js capture "Terms..." "https://example.com" "Example Corp" --consent-type=explicit
  node capture.js diff --capture1=local_abc123 --capture2=local_def456
  node capture.js dispute --captureId=local_abc123

DISCLAIMER: RECEIPTS flags known problematic patterns only. Not a substitute for legal review.

GitHub: https://github.com/lazaruseth/receipts-mvp
Issues: https://github.com/lazaruseth/receipts-mvp/issues
`);
}

function parseFilters(args) {
  const filters = {};
  args.forEach(arg => {
    const match = arg.match(/^--(\w+[-\w]*)=(.+)$/);
    if (match) {
      filters[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
  return filters;
}

function getRecommendation(flags, consentFlags) {
  // Implicit consent is always a concern
  if (consentFlags.length > 0) {
    if (flags.length >= 2) return 'block';
    return 'require_approval';
  }
  if (flags.length >= 3) return 'block';
  if (flags.length >= 1) return 'require_approval';
  return 'proceed';
}

function generateSummary(flags, score, consentType) {
  let summary = '';

  if (consentType === 'implicit' || consentType === 'continued_use') {
    summary = `WARNING: ${consentType === 'implicit' ? 'Implicit' : 'Continued use'} consent pattern detected. `;
  }

  if (flags.length === 0) {
    return summary + 'No concerning clauses detected. Standard terms.';
  } else if (flags.length === 1) {
    return summary + `1 risk flag detected: ${flags[0]}`;
  } else if (flags.length === 2) {
    return summary + `2 risk flags detected. Review recommended.`;
  } else {
    return summary + `${flags.length} risk flags detected. User approval required.`;
  }
}

function detectRiskFlags(text) {
  const flags = [];

  const patterns = [
    { pattern: /binding arbitration/i, flag: 'Binding arbitration clause' },
    { pattern: /class action waiver/i, flag: 'Class action waiver' },
    { pattern: /waive.{0,20}(right|claim)/i, flag: 'Rights waiver detected' },
    { pattern: /no refund/i, flag: 'No refund policy' },
    { pattern: /non-refundable/i, flag: 'Non-refundable terms' },
    { pattern: /automatic renewal/i, flag: 'Auto-renewal clause' },
    { pattern: /auto.{0,5}renew/i, flag: 'Auto-renewal clause' },
    { pattern: /perpetual license/i, flag: 'Perpetual license grant' },
    { pattern: /irrevocable/i, flag: 'Irrevocable terms' },
    { pattern: /sell.{0,20}(data|information|personal)/i, flag: 'Data selling clause' },
    { pattern: /share.{0,20}third part/i, flag: 'Third-party data sharing' },
    { pattern: /limit.{0,20}liability/i, flag: 'Limited liability clause' },
    { pattern: /indemnif/i, flag: 'Indemnification clause' },
    { pattern: /hold.{0,10}harmless/i, flag: 'Hold harmless clause' },
    { pattern: /governing law.{0,50}(delaware|california)/i, flag: 'US jurisdiction clause' },
    { pattern: /exclusive jurisdiction/i, flag: 'Exclusive jurisdiction clause' },
    { pattern: /terminate.{0,20}without.{0,10}notice/i, flag: 'Termination without notice' },
    { pattern: /modify.{0,20}terms.{0,20}any time/i, flag: 'Unilateral modification rights' },
  ];

  for (const { pattern, flag } of patterns) {
    if (pattern.test(text)) {
      if (!flags.includes(flag)) {
        flags.push(flag);
      }
    }
  }

  return flags;
}

// NEW: Detect implicit consent patterns (Ghidorah-Prime's insight)
function detectConsentType(text) {
  const flags = [];

  const implicitPatterns = [
    { pattern: /continued use.{0,30}(constitutes?|means?|indicates?).{0,20}(acceptance|agreement|consent)/i, flag: 'Continued use consent' },
    { pattern: /by (using|accessing|continuing).{0,30}(you agree|you accept|you consent)/i, flag: 'Implicit consent pattern' },
    { pattern: /your (continued )?use.{0,30}(signif|constitut|indicat).{0,20}(acceptance|agreement)/i, flag: 'Continued use consent' },
    { pattern: /deemed to (have )?(accept|agree|consent)/i, flag: 'Implicit consent pattern' },
    { pattern: /use of.{0,20}service.{0,30}after.{0,20}(notice|posting|update).{0,30}(accept|agree|consent)/i, flag: 'Continued use consent' },
  ];

  for (const { pattern, flag } of implicitPatterns) {
    if (pattern.test(text)) {
      if (!flags.includes(flag)) {
        flags.push(flag);
      }
    }
  }

  return flags;
}

function detectImplicitConsentType(text) {
  const implicitPatterns = [
    /continued use/i,
    /by using/i,
    /by accessing/i,
    /deemed to/i,
  ];

  for (const pattern of implicitPatterns) {
    if (pattern.test(text)) {
      return 'implicit';
    }
  }

  return 'explicit';
}

function checkDuplicate(documentHash) {
  const index = loadIndex();
  return index.find(r => r.documentHash === documentHash);
}

function detectChanges(sourceUrl, newHash) {
  if (!sourceUrl || sourceUrl === 'unknown') return null;

  const index = loadIndex();
  const previousFromUrl = index
    .filter(r => r.sourceUrl === sourceUrl)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (previousFromUrl && previousFromUrl.documentHash !== newHash) {
    return {
      previousCaptureId: previousFromUrl.captureId,
      previousTimestamp: previousFromUrl.timestamp,
      previousHash: previousFromUrl.documentHash
    };
  }

  return null;
}

function loadIndex() {
  try {
    if (fs.existsSync(INDEX_FILE)) {
      return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    }
  } catch (e) {}

  // Rebuild index from files if missing
  return rebuildIndex();
}

function rebuildIndex() {
  const index = [];
  try {
    if (!fs.existsSync(RECEIPTS_DIR)) return index;

    const files = fs.readdirSync(RECEIPTS_DIR);
    files.forEach(file => {
      if (file.endsWith('.json') && file !== 'index.json') {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(RECEIPTS_DIR, file), 'utf8'));
          index.push(data);
        } catch (e) {}
      }
    });

    // Save rebuilt index
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  } catch (e) {}

  return index;
}

function updateIndex(capture) {
  try {
    const index = loadIndex();
    // Remove any existing entry with same captureId
    const filtered = index.filter(r => r.captureId !== capture.captureId);
    filtered.push(capture);
    fs.writeFileSync(INDEX_FILE, JSON.stringify(filtered, null, 2));
  } catch (e) {}
}

function saveLocalReceipt(capture, fullText) {
  try {
    if (!fs.existsSync(RECEIPTS_DIR)) {
      fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    }

    const metaFile = path.join(RECEIPTS_DIR, `${capture.captureId}.json`);
    fs.writeFileSync(metaFile, JSON.stringify(capture, null, 2));

    const textFile = path.join(RECEIPTS_DIR, `${capture.captureId}.txt`);
    fs.writeFileSync(textFile, fullText);
  } catch (e) {}
}

function saveScreenshot(captureId, base64Data) {
  try {
    const screenshotFile = path.join(RECEIPTS_DIR, `${captureId}.screenshot`);
    fs.writeFileSync(screenshotFile, base64Data);
  } catch (e) {}
}
