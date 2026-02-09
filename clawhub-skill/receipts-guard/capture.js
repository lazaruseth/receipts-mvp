#!/usr/bin/env node
/**
 * RECEIPTS Guard v0.5.0 - Arbitration Protocol for Autonomous Agents
 *
 * "Who controls the evidence becomes who controls the dispute."
 *
 * Agent commerce infrastructure optimized for winning arbitration.
 * Everything exists to produce evidence that wins disputes.
 *
 * Commands:
 *   capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" [--consent-type=TYPE]
 *   promise "COMMITMENT_TEXT" "COUNTERPARTY" [--direction=inbound|outbound]
 *
 *   === ARBITRATION PROTOCOL (v0.5.0) ===
 *   propose "TERMS" "COUNTERPARTY" --arbiter="AGENT" [--deadline=ISO_DATE] [--value=AMOUNT]
 *   accept --proposalId=ID
 *   reject --proposalId=ID --reason="REASON"
 *   fulfill --agreementId=ID --evidence="PROOF"
 *   arbitrate --agreementId=ID --reason="BREACH_TYPE" --evidence="PROOF"
 *   submit --arbitrationId=ID --evidence="PROOF" [--type=document|screenshot|witness]
 *   ruling --arbitrationId=ID --decision=claimant|respondent|split --reasoning="EXPLANATION"
 *   timeline --agreementId=ID
 *
 *   === UTILITIES ===
 *   query --merchant="X" --risk-level=high --after="2026-01-01"
 *   list [--type=captures|proposals|agreements|arbitrations]
 *   export --format=json|csv|pdf
 *   diff --capture1=ID --capture2=ID
 *   dispute --captureId=ID
 *   witness --captureId=ID [--anchor=moltbook|bitcoin|both]
 *   rules --list | --add="PATTERN" --flag="FLAG_NAME"
 *
 * v0.5.0 Features:
 *   - Full Arbitration Protocol: propose → accept → fulfill/arbitrate → ruling
 *   - PAO (Programmable Agreement Object): termsHash, mutual signatures, state machine
 *   - LPR (Legal Provenance Review): Timeline visualization for arbiters
 *   - Arbiter selection at agreement creation
 *   - Evidence submission and ruling workflow
 *
 * Environment variables (optional):
 *   RECEIPTS_AGENT_ID - Unique agent identifier
 *   RECEIPTS_MOLTBOOK_KEY - API key for Moltbook witnessing
 *   RECEIPTS_CUSTOM_RULES - Path to custom rules file
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
const VERSION = '0.5.0';

// Arbitration directories
const PROPOSALS_DIR = path.join(RECEIPTS_DIR, 'proposals');
const AGREEMENTS_DIR = path.join(RECEIPTS_DIR, 'agreements');
const ARBITRATIONS_DIR = path.join(RECEIPTS_DIR, 'arbitrations');
const RULINGS_DIR = path.join(RECEIPTS_DIR, 'rulings');

// Valid arbitration reasons
const VALID_ARBITRATION_REASONS = [
  'non_delivery',
  'partial_delivery',
  'quality',
  'deadline_breach',
  'repudiation',
  'other',
];

// Custom rules file
const CUSTOM_RULES_FILE = process.env.RECEIPTS_CUSTOM_RULES ||
  path.join(RECEIPTS_DIR, 'custom-rules.json');

// Witness anchors directory
const WITNESS_DIR = path.join(RECEIPTS_DIR, 'witnesses');

// Hook registry for framework integrations
const hooks = {
  beforeConsent: [],
  afterCapture: [],
  onRiskDetected: [],
};

// Get command and arguments
const args = process.argv.slice(2);
const command = args[0];

// Route to appropriate handler
switch (command) {
  case 'capture':
    handleCapture(args.slice(1));
    break;
  case 'promise':
    handlePromise(args.slice(1));
    break;
  case 'query':
    handleQuery(args.slice(1));
    break;
  case 'list':
    handleList(args.slice(1));
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
  case 'witness':
    handleWitness(args.slice(1));
    break;
  case 'rules':
    handleRules(args.slice(1));
    break;
  // === ARBITRATION PROTOCOL v0.5.0 ===
  case 'propose':
    handlePropose(args.slice(1));
    break;
  case 'accept':
    handleAccept(args.slice(1));
    break;
  case 'reject':
    handleReject(args.slice(1));
    break;
  case 'fulfill':
    handleFulfill(args.slice(1));
    break;
  case 'arbitrate':
    handleArbitrate(args.slice(1));
    break;
  case 'submit':
    handleSubmit(args.slice(1));
    break;
  case 'ruling':
    handleRuling(args.slice(1));
    break;
  case 'timeline':
    handleTimeline(args.slice(1));
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
function handleList(args) {
  const filters = parseFilters(args || []);
  const listType = filters.type || 'all';

  const result = {
    generatedAt: new Date().toISOString(),
  };

  // List captures
  if (listType === 'all' || listType === 'captures') {
    const index = loadIndex();
    result.captures = {
      count: index.length,
      items: index.map(r => ({
        id: r.captureId || r.promiseId,
        type: r.type || 'capture',
        merchantName: r.merchantName || r.counterparty,
        trustScore: r.trustScore,
        recommendation: r.recommendation || r.riskLevel,
        timestamp: r.timestamp,
      }))
    };
  }

  // List proposals
  if (listType === 'all' || listType === 'proposals') {
    const proposals = listDirectory(PROPOSALS_DIR);
    result.proposals = {
      count: proposals.length,
      items: proposals.map(p => ({
        proposalId: p.proposalId,
        counterparty: p.counterparty,
        arbiter: p.proposedArbiter,
        status: p.status,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
      }))
    };
  }

  // List agreements
  if (listType === 'all' || listType === 'agreements') {
    const agreements = listDirectory(AGREEMENTS_DIR);
    result.agreements = {
      count: agreements.length,
      items: agreements.map(a => ({
        agreementId: a.agreementId,
        parties: a.parties,
        arbiter: a.arbiter,
        status: a.status,
        deadline: a.deadline,
        createdAt: a.createdAt,
      }))
    };
  }

  // List arbitrations
  if (listType === 'all' || listType === 'arbitrations') {
    const arbitrations = listDirectory(ARBITRATIONS_DIR);
    result.arbitrations = {
      count: arbitrations.length,
      items: arbitrations.map(a => ({
        arbitrationId: a.arbitrationId,
        agreementId: a.agreementId,
        claimant: a.claimant,
        respondent: a.respondent,
        reason: a.reason,
        status: a.status,
        openedAt: a.openedAt,
      }))
    };
  }

  // List rulings
  if (listType === 'all' || listType === 'rulings') {
    const rulings = listDirectory(RULINGS_DIR);
    result.rulings = {
      count: rulings.length,
      items: rulings.map(r => ({
        rulingId: r.rulingId,
        arbitrationId: r.arbitrationId,
        decision: r.decision,
        arbiter: r.arbiter,
        issuedAt: r.issuedAt,
      }))
    };
  }

  console.log(JSON.stringify(result, null, 2));
}

function listDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

// === EXPORT COMMAND ===
function handleExport(args) {
  const filters = parseFilters(args);
  const format = filters.format || 'json';
  const captureId = filters.captureId || filters.id;
  const index = loadIndex();

  if (format === 'csv') {
    // CSV header
    console.log('captureId,merchantName,sourceUrl,trustScore,recommendation,consentType,riskFlags,timestamp,changeDetected');
    // CSV rows
    index.forEach(r => {
      const flags = (r.riskFlags || []).join('; ');
      const consentType = r.consentProof?.type || 'unknown';
      console.log(`"${r.captureId || r.promiseId}","${r.merchantName || r.counterparty}","${r.sourceUrl || 'N/A'}",${r.trustScore || 'N/A'},"${r.recommendation || r.riskLevel}","${consentType}","${flags}","${r.timestamp}",${r.changeDetected || false}`);
    });
  } else if (format === 'pdf') {
    // PDF-ready evidence export (for single capture)
    if (!captureId) {
      console.error(JSON.stringify({
        error: 'PDF export requires --captureId',
        usage: 'node capture.js export --format=pdf --captureId=local_xxx'
      }));
      process.exit(1);
    }

    const capture = index.find(r => (r.captureId || r.promiseId) === captureId);
    if (!capture) {
      console.error(JSON.stringify({ error: 'Capture not found' }));
      process.exit(1);
    }

    // Load document text
    const textFile = path.join(RECEIPTS_DIR, `${captureId}.txt`);
    let documentText = '';
    try { documentText = fs.readFileSync(textFile, 'utf8'); } catch (e) {}

    // Generate PDF-ready content
    const pdfContent = generatePDFContent(capture, documentText);
    console.log(JSON.stringify(pdfContent, null, 2));

  } else {
    // Full JSON export with document text
    const fullExport = index.map(r => {
      const id = r.captureId || r.promiseId;
      const textFile = path.join(RECEIPTS_DIR, `${id}.txt`);
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
RECEIPTS Guard v${VERSION} - Arbitration Protocol for Autonomous Agents

"Who controls the evidence becomes who controls the dispute."

═══════════════════════════════════════════════════════════════════════════════
ARBITRATION PROTOCOL (v0.5.0)
═══════════════════════════════════════════════════════════════════════════════

  propose "TERMS" "COUNTERPARTY"    Create an agreement proposal
    --arbiter="ARBITER_AGENT"       Required: mutually agreed arbiter
    --deadline=ISO_DATE             Fulfillment deadline
    --value=AMOUNT                  Agreement value (for reference)

  accept --proposalId=ID            Accept a proposal (creates agreement)

  reject --proposalId=ID            Reject a proposal
    --reason="REASON"               Rejection reason

  fulfill --agreementId=ID          Claim fulfillment of agreement
    --evidence="PROOF"              Required: proof of completion

  arbitrate --agreementId=ID        Open a dispute
    --reason=BREACH_TYPE            non_delivery|partial_delivery|quality|
                                    deadline_breach|repudiation|other
    --evidence="PROOF"              Initial evidence

  submit --arbitrationId=ID         Submit evidence to arbitration
    --evidence="PROOF"              Evidence content
    --type=TYPE                     document|screenshot|witness

  ruling --arbitrationId=ID         Issue ruling (arbiter only)
    --decision=DECISION             claimant|respondent|split
    --reasoning="EXPLANATION"       Required: reasoning for ruling

  timeline --agreementId=ID         Generate LPR (Legal Provenance Review)

═══════════════════════════════════════════════════════════════════════════════
CAPTURE COMMANDS
═══════════════════════════════════════════════════════════════════════════════

  capture "TEXT" "URL" "MERCHANT"   Capture a ToS/agreement
    --consent-type=TYPE             explicit|implicit|continued_use
    --screenshot=BASE64             Screenshot at time of consent

  promise "TEXT" "COUNTERPARTY"     Capture agent-to-agent commitment
    --direction=outbound|inbound    Who made the promise (default: outbound)

═══════════════════════════════════════════════════════════════════════════════
UTILITY COMMANDS
═══════════════════════════════════════════════════════════════════════════════

  list [--type=TYPE]                List records
                                    captures|proposals|agreements|
                                    arbitrations|rulings|all

  query [filters]                   Search captured receipts
    --merchant="Company Name"
    --risk-level=high|medium|low

  diff --capture1=ID --capture2=ID  Compare two captures

  dispute --captureId=ID            Generate dispute evidence package

  witness --captureId=ID            Create decentralized witness
    --anchor=moltbook|bitcoin|both

  rules --list                      Show all risk detection rules
  rules --add="PATTERN" --flag="X"  Add custom rule

  export --format=json|csv|pdf      Export records

═══════════════════════════════════════════════════════════════════════════════
ARBITRATION FLOW
═══════════════════════════════════════════════════════════════════════════════

  1. PROPOSE  →  Agent A creates proposal with terms + arbiter
  2. ACCEPT   →  Agent B signs, creating active agreement
  3. FULFILL  →  Either party claims completion with evidence
  4. DISPUTE  →  If contested, arbitrate command opens dispute
  5. SUBMIT   →  Both parties submit evidence during window
  6. RULING   →  Arbiter issues decision with reasoning

  State Machine: proposed → active → fulfilled/disputed → closed

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

  # Create proposal
  node capture.js propose "I will deliver API docs by Friday" "AgentX" \\
    --arbiter="arbiter-prime" --deadline="2026-02-14"

  # Accept proposal
  node capture.js accept --proposalId=prop_abc123

  # Claim fulfillment
  node capture.js fulfill --agreementId=agr_xyz789 \\
    --evidence="Docs delivered: https://..."

  # Open dispute
  node capture.js arbitrate --agreementId=agr_xyz789 \\
    --reason="non_delivery" --evidence="No docs received"

  # Issue ruling (as arbiter)
  node capture.js ruling --arbitrationId=arb_def456 \\
    --decision=claimant --reasoning="Evidence shows non-delivery"

  # View timeline
  node capture.js timeline --agreementId=agr_xyz789

═══════════════════════════════════════════════════════════════════════════════
ENVIRONMENT
═══════════════════════════════════════════════════════════════════════════════

  RECEIPTS_AGENT_ID       Your agent identifier
  RECEIPTS_MOLTBOOK_KEY   API key for Moltbook witnessing
  RECEIPTS_CUSTOM_RULES   Path to custom rules file

DISCLAIMER: RECEIPTS flags patterns only. Not a substitute for legal review.

GitHub: https://github.com/lazaruseth/receipts-mvp
Moltbook: https://moltbook.com/u/receipts-guard
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

// =============================================================================
// v0.5.0 ARBITRATION PROTOCOL
// =============================================================================

/**
 * Generate a canonical terms hash (PAO - Programmable Agreement Object)
 * Deterministic hash of terms + parties + deadline
 */
function generateTermsHash(terms, parties, deadline) {
  const canonical = {
    terms: terms.trim().toLowerCase().replace(/\s+/g, ' '),
    parties: parties.sort(), // Alphabetical for determinism
    deadline: deadline || null,
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex');
}

/**
 * Sign terms with agent identity (simplified - uses HMAC with agent ID as key)
 * In production, this would use proper cryptographic signatures
 */
function signTerms(termsHash, agentId) {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', agentId)
    .update(`${termsHash}|${timestamp}`)
    .digest('hex');
  return `sig:${signature.slice(0, 32)}:${timestamp}`;
}

/**
 * Verify a signature (simplified verification)
 */
function verifySignature(termsHash, signature, agentId) {
  if (!signature || !signature.startsWith('sig:')) return false;
  const parts = signature.split(':');
  if (parts.length !== 3) return false;
  const [, sigHash, timestamp] = parts;
  const expected = crypto
    .createHmac('sha256', agentId)
    .update(`${termsHash}|${timestamp}`)
    .digest('hex');
  return expected.slice(0, 32) === sigHash;
}

/**
 * Ensure a subdirectory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate unique ID with prefix
 */
function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// === PROPOSE COMMAND ===
function handlePropose(args) {
  const filters = parseFilters(args);
  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const [terms, counterparty] = positionalArgs;

  if (!terms || !counterparty) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      usage: 'node capture.js propose "TERMS" "COUNTERPARTY" --arbiter="ARBITER_AGENT" [--deadline=ISO_DATE] [--value=AMOUNT]'
    }));
    process.exit(1);
  }

  const arbiter = filters.arbiter;
  if (!arbiter) {
    console.error(JSON.stringify({
      error: 'Arbiter is required',
      usage: 'node capture.js propose "TERMS" "COUNTERPARTY" --arbiter="ARBITER_AGENT"',
      note: 'Both parties must agree on an arbiter at proposal time'
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';
  const deadline = filters.deadline || null;
  const value = filters.value || null;
  const channel = filters.channel || 'local';

  // Generate PAO (Programmable Agreement Object)
  const parties = [agentId, counterparty];
  const termsHash = generateTermsHash(terms, parties, deadline);
  const proposerSignature = signTerms(termsHash, agentId);
  const proposalId = generateId('prop');

  // Default expiry: 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const proposal = {
    proposalId,
    termsHash: `sha256:${termsHash}`,
    terms: {
      text: terms,
      canonical: terms.trim().toLowerCase().replace(/\s+/g, ' '),
    },
    proposer: agentId,
    counterparty,
    proposedArbiter: arbiter,
    deadline,
    value,
    channel,
    proposerSignature,
    status: 'pending_acceptance',
    createdAt: new Date().toISOString(),
    expiresAt,
    version: VERSION,
  };

  // Save proposal
  ensureDir(PROPOSALS_DIR);
  const proposalFile = path.join(PROPOSALS_DIR, `${proposalId}.json`);
  fs.writeFileSync(proposalFile, JSON.stringify(proposal, null, 2));

  // Save terms text
  const termsFile = path.join(PROPOSALS_DIR, `${proposalId}.txt`);
  fs.writeFileSync(termsFile, terms);

  console.log(JSON.stringify({
    ...proposal,
    message: `Proposal created. Share proposalId with ${counterparty} for acceptance.`,
    nextStep: `Counterparty should run: node capture.js accept --proposalId=${proposalId}`,
  }, null, 2));
}

// === ACCEPT COMMAND ===
function handleAccept(args) {
  const filters = parseFilters(args);
  const proposalId = filters.proposalId || filters.id;

  if (!proposalId) {
    console.error(JSON.stringify({
      error: 'Missing proposalId',
      usage: 'node capture.js accept --proposalId=prop_xxx'
    }));
    process.exit(1);
  }

  // Load proposal
  const proposalFile = path.join(PROPOSALS_DIR, `${proposalId}.json`);
  if (!fs.existsSync(proposalFile)) {
    console.error(JSON.stringify({ error: 'Proposal not found', proposalId }));
    process.exit(1);
  }

  const proposal = JSON.parse(fs.readFileSync(proposalFile, 'utf8'));

  if (proposal.status !== 'pending_acceptance') {
    console.error(JSON.stringify({
      error: 'Proposal is not pending acceptance',
      currentStatus: proposal.status
    }));
    process.exit(1);
  }

  // Check expiry
  if (new Date(proposal.expiresAt) < new Date()) {
    proposal.status = 'expired';
    fs.writeFileSync(proposalFile, JSON.stringify(proposal, null, 2));
    console.error(JSON.stringify({ error: 'Proposal has expired', expiresAt: proposal.expiresAt }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';
  const termsHash = proposal.termsHash.replace('sha256:', '');

  // Sign terms as counterparty
  const counterpartySignature = signTerms(termsHash, agentId);

  // Create agreement from proposal
  const agreementId = generateId('agr');
  const agreement = {
    agreementId,
    proposalId,
    termsHash: proposal.termsHash,
    terms: proposal.terms,
    parties: [proposal.proposer, proposal.counterparty],
    arbiter: proposal.proposedArbiter,
    deadline: proposal.deadline,
    value: proposal.value,
    signatures: {
      [proposal.proposer]: proposal.proposerSignature,
      [proposal.counterparty]: counterpartySignature,
    },
    status: 'active',
    timeline: [
      {
        event: 'proposed',
        timestamp: proposal.createdAt,
        actor: proposal.proposer,
      },
      {
        event: 'accepted',
        timestamp: new Date().toISOString(),
        actor: agentId,
      },
    ],
    createdAt: new Date().toISOString(),
    version: VERSION,
  };

  // Save agreement
  ensureDir(AGREEMENTS_DIR);
  const agreementFile = path.join(AGREEMENTS_DIR, `${agreementId}.json`);
  fs.writeFileSync(agreementFile, JSON.stringify(agreement, null, 2));

  // Copy terms text
  const proposalTermsFile = path.join(PROPOSALS_DIR, `${proposalId}.txt`);
  const agreementTermsFile = path.join(AGREEMENTS_DIR, `${agreementId}.txt`);
  if (fs.existsSync(proposalTermsFile)) {
    fs.copyFileSync(proposalTermsFile, agreementTermsFile);
  }

  // Update proposal status
  proposal.status = 'accepted';
  proposal.agreementId = agreementId;
  proposal.acceptedAt = new Date().toISOString();
  fs.writeFileSync(proposalFile, JSON.stringify(proposal, null, 2));

  console.log(JSON.stringify({
    ...agreement,
    message: 'Agreement created! Both parties have signed.',
    arbiterNotified: `Arbiter ${agreement.arbiter} should be notified of appointment.`,
    nextSteps: [
      `Fulfill: node capture.js fulfill --agreementId=${agreementId} --evidence="PROOF"`,
      `Dispute: node capture.js arbitrate --agreementId=${agreementId} --reason="non_delivery"`,
    ],
  }, null, 2));
}

// === REJECT COMMAND ===
function handleReject(args) {
  const filters = parseFilters(args);
  const proposalId = filters.proposalId || filters.id;
  const reason = filters.reason || 'No reason provided';

  if (!proposalId) {
    console.error(JSON.stringify({
      error: 'Missing proposalId',
      usage: 'node capture.js reject --proposalId=prop_xxx --reason="REASON"'
    }));
    process.exit(1);
  }

  const proposalFile = path.join(PROPOSALS_DIR, `${proposalId}.json`);
  if (!fs.existsSync(proposalFile)) {
    console.error(JSON.stringify({ error: 'Proposal not found', proposalId }));
    process.exit(1);
  }

  const proposal = JSON.parse(fs.readFileSync(proposalFile, 'utf8'));

  if (proposal.status !== 'pending_acceptance') {
    console.error(JSON.stringify({
      error: 'Proposal is not pending acceptance',
      currentStatus: proposal.status
    }));
    process.exit(1);
  }

  // Update proposal
  proposal.status = 'rejected';
  proposal.rejectedAt = new Date().toISOString();
  proposal.rejectionReason = reason;
  fs.writeFileSync(proposalFile, JSON.stringify(proposal, null, 2));

  console.log(JSON.stringify({
    proposalId,
    status: 'rejected',
    reason,
    rejectedAt: proposal.rejectedAt,
  }, null, 2));
}

// === FULFILL COMMAND ===
function handleFulfill(args) {
  const filters = parseFilters(args);
  const agreementId = filters.agreementId || filters.id;
  const evidence = filters.evidence;

  if (!agreementId) {
    console.error(JSON.stringify({
      error: 'Missing agreementId',
      usage: 'node capture.js fulfill --agreementId=agr_xxx --evidence="PROOF"'
    }));
    process.exit(1);
  }

  if (!evidence) {
    console.error(JSON.stringify({
      error: 'Evidence is required for fulfillment',
      usage: 'node capture.js fulfill --agreementId=agr_xxx --evidence="PROOF_OF_COMPLETION"'
    }));
    process.exit(1);
  }

  const agreementFile = path.join(AGREEMENTS_DIR, `${agreementId}.json`);
  if (!fs.existsSync(agreementFile)) {
    console.error(JSON.stringify({ error: 'Agreement not found', agreementId }));
    process.exit(1);
  }

  const agreement = JSON.parse(fs.readFileSync(agreementFile, 'utf8'));

  if (agreement.status !== 'active') {
    console.error(JSON.stringify({
      error: 'Agreement is not active',
      currentStatus: agreement.status
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

  // Add fulfillment to timeline
  agreement.timeline.push({
    event: 'fulfillment_claimed',
    timestamp: new Date().toISOString(),
    actor: agentId,
    evidence,
    evidenceHash: crypto.createHash('sha256').update(evidence).digest('hex'),
  });

  // Status becomes pending_confirmation (other party must confirm)
  // For simplicity, we'll auto-confirm after a grace period (in production, this would be interactive)
  agreement.status = 'pending_confirmation';
  agreement.fulfillmentClaimed = {
    by: agentId,
    at: new Date().toISOString(),
    evidence,
    // Grace period: 48 hours for counterparty to dispute
    gracePeriodEnds: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  };

  fs.writeFileSync(agreementFile, JSON.stringify(agreement, null, 2));

  console.log(JSON.stringify({
    agreementId,
    status: agreement.status,
    fulfillmentClaimed: agreement.fulfillmentClaimed,
    message: 'Fulfillment claimed. Counterparty has 48 hours to dispute.',
    nextSteps: [
      'If counterparty confirms: Agreement closes as fulfilled',
      `If counterparty disputes: node capture.js arbitrate --agreementId=${agreementId} --reason="quality"`,
      'If grace period passes: Agreement auto-closes as fulfilled',
    ],
  }, null, 2));
}

// === ARBITRATE COMMAND ===
function handleArbitrate(args) {
  const filters = parseFilters(args);
  const agreementId = filters.agreementId || filters.id;
  const reason = filters.reason;
  const evidence = filters.evidence;

  if (!agreementId) {
    console.error(JSON.stringify({
      error: 'Missing agreementId',
      usage: 'node capture.js arbitrate --agreementId=agr_xxx --reason="non_delivery" --evidence="PROOF"'
    }));
    process.exit(1);
  }

  if (!reason || !VALID_ARBITRATION_REASONS.includes(reason)) {
    console.error(JSON.stringify({
      error: 'Valid reason required',
      validReasons: VALID_ARBITRATION_REASONS,
      usage: 'node capture.js arbitrate --agreementId=agr_xxx --reason="non_delivery"'
    }));
    process.exit(1);
  }

  const agreementFile = path.join(AGREEMENTS_DIR, `${agreementId}.json`);
  if (!fs.existsSync(agreementFile)) {
    console.error(JSON.stringify({ error: 'Agreement not found', agreementId }));
    process.exit(1);
  }

  const agreement = JSON.parse(fs.readFileSync(agreementFile, 'utf8'));

  if (!['active', 'pending_confirmation'].includes(agreement.status)) {
    console.error(JSON.stringify({
      error: 'Agreement cannot be disputed',
      currentStatus: agreement.status,
      note: 'Only active or pending_confirmation agreements can be disputed'
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';
  const arbitrationId = generateId('arb');

  // Determine claimant and respondent
  const claimant = agentId;
  const respondent = agreement.parties.find(p => p !== agentId) || agreement.parties[1];

  // Evidence window: 7 days
  const evidenceDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const arbitration = {
    arbitrationId,
    agreementId,
    termsHash: agreement.termsHash,
    claimant,
    respondent,
    arbiter: agreement.arbiter,
    reason,
    reasonDescription: getArbitrationReasonDescription(reason),
    status: 'open',
    evidence: {
      claimant: evidence ? [{
        submittedAt: new Date().toISOString(),
        content: evidence,
        hash: crypto.createHash('sha256').update(evidence).digest('hex'),
        type: filters.type || 'document',
      }] : [],
      respondent: [],
    },
    ruling: null,
    openedAt: new Date().toISOString(),
    evidenceDeadline,
    version: VERSION,
  };

  // Save arbitration
  ensureDir(ARBITRATIONS_DIR);
  const arbitrationFile = path.join(ARBITRATIONS_DIR, `${arbitrationId}.json`);
  fs.writeFileSync(arbitrationFile, JSON.stringify(arbitration, null, 2));

  // Update agreement status
  agreement.status = 'disputed';
  agreement.arbitrationId = arbitrationId;
  agreement.timeline.push({
    event: 'dispute_opened',
    timestamp: new Date().toISOString(),
    actor: agentId,
    reason,
    arbitrationId,
  });
  fs.writeFileSync(agreementFile, JSON.stringify(agreement, null, 2));

  console.log(JSON.stringify({
    ...arbitration,
    message: `Arbitration opened. Arbiter ${agreement.arbiter} has been notified.`,
    evidenceWindow: `Both parties have until ${evidenceDeadline} to submit evidence.`,
    nextSteps: [
      `Submit more evidence: node capture.js submit --arbitrationId=${arbitrationId} --evidence="PROOF"`,
      `View timeline: node capture.js timeline --agreementId=${agreementId}`,
    ],
  }, null, 2));
}

function getArbitrationReasonDescription(reason) {
  const descriptions = {
    non_delivery: 'Counterparty did not deliver as agreed',
    partial_delivery: 'Delivery was incomplete or partial',
    quality: 'Delivery did not meet quality specifications',
    deadline_breach: 'Delivery deadline was missed',
    repudiation: 'Counterparty denies the agreement exists',
    other: 'Other breach of agreement',
  };
  return descriptions[reason] || reason;
}

// === SUBMIT COMMAND (Evidence Submission) ===
function handleSubmit(args) {
  const filters = parseFilters(args);
  const arbitrationId = filters.arbitrationId || filters.id;
  const evidence = filters.evidence;
  const evidenceType = filters.type || 'document';

  if (!arbitrationId) {
    console.error(JSON.stringify({
      error: 'Missing arbitrationId',
      usage: 'node capture.js submit --arbitrationId=arb_xxx --evidence="PROOF" [--type=document|screenshot|witness]'
    }));
    process.exit(1);
  }

  if (!evidence) {
    console.error(JSON.stringify({
      error: 'Evidence is required',
      usage: 'node capture.js submit --arbitrationId=arb_xxx --evidence="PROOF"'
    }));
    process.exit(1);
  }

  const arbitrationFile = path.join(ARBITRATIONS_DIR, `${arbitrationId}.json`);
  if (!fs.existsSync(arbitrationFile)) {
    console.error(JSON.stringify({ error: 'Arbitration not found', arbitrationId }));
    process.exit(1);
  }

  const arbitration = JSON.parse(fs.readFileSync(arbitrationFile, 'utf8'));

  if (!['open', 'evidence_period'].includes(arbitration.status)) {
    console.error(JSON.stringify({
      error: 'Evidence submission period has closed',
      currentStatus: arbitration.status
    }));
    process.exit(1);
  }

  // Check evidence deadline
  if (new Date(arbitration.evidenceDeadline) < new Date()) {
    arbitration.status = 'deliberation';
    fs.writeFileSync(arbitrationFile, JSON.stringify(arbitration, null, 2));
    console.error(JSON.stringify({
      error: 'Evidence deadline has passed',
      deadline: arbitration.evidenceDeadline
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

  // Determine which party is submitting
  const isClaimant = agentId === arbitration.claimant;
  const party = isClaimant ? 'claimant' : 'respondent';

  const evidenceEntry = {
    submittedAt: new Date().toISOString(),
    content: evidence,
    hash: crypto.createHash('sha256').update(evidence).digest('hex'),
    type: evidenceType,
  };

  arbitration.evidence[party].push(evidenceEntry);
  arbitration.status = 'evidence_period';
  fs.writeFileSync(arbitrationFile, JSON.stringify(arbitration, null, 2));

  console.log(JSON.stringify({
    arbitrationId,
    party,
    evidenceSubmitted: evidenceEntry,
    totalEvidence: {
      claimant: arbitration.evidence.claimant.length,
      respondent: arbitration.evidence.respondent.length,
    },
    evidenceDeadline: arbitration.evidenceDeadline,
  }, null, 2));
}

// === RULING COMMAND (Arbiter Only) ===
function handleRuling(args) {
  const filters = parseFilters(args);
  const arbitrationId = filters.arbitrationId || filters.id;
  const decision = filters.decision;
  const reasoning = filters.reasoning;

  if (!arbitrationId) {
    console.error(JSON.stringify({
      error: 'Missing arbitrationId',
      usage: 'node capture.js ruling --arbitrationId=arb_xxx --decision=claimant|respondent|split --reasoning="EXPLANATION"'
    }));
    process.exit(1);
  }

  if (!decision || !['claimant', 'respondent', 'split'].includes(decision)) {
    console.error(JSON.stringify({
      error: 'Valid decision required',
      validDecisions: ['claimant', 'respondent', 'split'],
      usage: 'node capture.js ruling --arbitrationId=arb_xxx --decision=claimant'
    }));
    process.exit(1);
  }

  if (!reasoning) {
    console.error(JSON.stringify({
      error: 'Reasoning is required for ruling',
      usage: 'node capture.js ruling --arbitrationId=arb_xxx --decision=claimant --reasoning="Evidence shows..."'
    }));
    process.exit(1);
  }

  const arbitrationFile = path.join(ARBITRATIONS_DIR, `${arbitrationId}.json`);
  if (!fs.existsSync(arbitrationFile)) {
    console.error(JSON.stringify({ error: 'Arbitration not found', arbitrationId }));
    process.exit(1);
  }

  const arbitration = JSON.parse(fs.readFileSync(arbitrationFile, 'utf8'));

  if (arbitration.status === 'ruled') {
    console.error(JSON.stringify({
      error: 'Ruling has already been issued',
      existingRuling: arbitration.ruling
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

  // Verify caller is arbiter (simplified check)
  if (agentId !== arbitration.arbiter) {
    console.error(JSON.stringify({
      error: 'Only the arbiter can issue a ruling',
      arbiter: arbitration.arbiter,
      yourId: agentId
    }));
    process.exit(1);
  }

  const rulingId = generateId('rul');
  const reasoningHash = crypto.createHash('sha256').update(reasoning).digest('hex');

  const ruling = {
    rulingId,
    arbitrationId,
    arbiter: agentId,
    decision,
    decisionDescription: getDecisionDescription(decision, arbitration),
    reasoning,
    reasoningHash: `sha256:${reasoningHash}`,
    evidenceConsidered: {
      claimant: arbitration.evidence.claimant.length,
      respondent: arbitration.evidence.respondent.length,
    },
    issuedAt: new Date().toISOString(),
    version: VERSION,
  };

  // Save ruling
  ensureDir(RULINGS_DIR);
  const rulingFile = path.join(RULINGS_DIR, `${rulingId}.json`);
  fs.writeFileSync(rulingFile, JSON.stringify(ruling, null, 2));

  // Update arbitration
  arbitration.status = 'ruled';
  arbitration.ruling = ruling;
  fs.writeFileSync(arbitrationFile, JSON.stringify(arbitration, null, 2));

  // Update agreement
  const agreementFile = path.join(AGREEMENTS_DIR, `${arbitration.agreementId}.json`);
  if (fs.existsSync(agreementFile)) {
    const agreement = JSON.parse(fs.readFileSync(agreementFile, 'utf8'));
    agreement.status = 'closed';
    agreement.closedAt = new Date().toISOString();
    agreement.closureReason = 'arbitration_ruling';
    agreement.rulingId = rulingId;
    agreement.timeline.push({
      event: 'ruling_issued',
      timestamp: new Date().toISOString(),
      actor: agentId,
      decision,
      rulingId,
    });
    fs.writeFileSync(agreementFile, JSON.stringify(agreement, null, 2));
  }

  console.log(JSON.stringify({
    ...ruling,
    message: 'Ruling issued. Agreement is now closed.',
    publicRecord: {
      note: 'Reasoning hash can be posted to Moltbook for public record',
      hash: ruling.reasoningHash,
      suggestedPost: `⚖️ RULING: Arbitration ${arbitrationId} - Decision: ${decision}. Reasoning hash: ${reasoningHash.slice(0, 16)}...`,
    },
  }, null, 2));
}

function getDecisionDescription(decision, arbitration) {
  switch (decision) {
    case 'claimant':
      return `Ruled in favor of ${arbitration.claimant} (claimant)`;
    case 'respondent':
      return `Ruled in favor of ${arbitration.respondent} (respondent)`;
    case 'split':
      return 'Split decision - partial responsibility on both parties';
    default:
      return decision;
  }
}

// === TIMELINE COMMAND (LPR - Legal Provenance Review) ===
function handleTimeline(args) {
  const filters = parseFilters(args);
  const agreementId = filters.agreementId || filters.id;

  if (!agreementId) {
    console.error(JSON.stringify({
      error: 'Missing agreementId',
      usage: 'node capture.js timeline --agreementId=agr_xxx'
    }));
    process.exit(1);
  }

  const agreementFile = path.join(AGREEMENTS_DIR, `${agreementId}.json`);
  if (!fs.existsSync(agreementFile)) {
    console.error(JSON.stringify({ error: 'Agreement not found', agreementId }));
    process.exit(1);
  }

  const agreement = JSON.parse(fs.readFileSync(agreementFile, 'utf8'));

  // Build comprehensive timeline
  const timeline = {
    title: `Legal Provenance Review (LPR) - ${agreementId}`,
    generatedAt: new Date().toISOString(),
    agreement: {
      agreementId,
      termsHash: agreement.termsHash,
      parties: agreement.parties,
      arbiter: agreement.arbiter,
      status: agreement.status,
      deadline: agreement.deadline,
      value: agreement.value,
    },
    events: [...agreement.timeline],
    signatures: agreement.signatures,
  };

  // Add arbitration events if exists
  if (agreement.arbitrationId) {
    const arbitrationFile = path.join(ARBITRATIONS_DIR, `${agreement.arbitrationId}.json`);
    if (fs.existsSync(arbitrationFile)) {
      const arbitration = JSON.parse(fs.readFileSync(arbitrationFile, 'utf8'));

      timeline.arbitration = {
        arbitrationId: arbitration.arbitrationId,
        reason: arbitration.reason,
        claimant: arbitration.claimant,
        respondent: arbitration.respondent,
        status: arbitration.status,
      };

      // Add evidence submissions to timeline
      for (const ev of arbitration.evidence.claimant) {
        timeline.events.push({
          event: 'evidence_submitted',
          timestamp: ev.submittedAt,
          actor: arbitration.claimant,
          party: 'claimant',
          evidenceHash: ev.hash,
          type: ev.type,
        });
      }

      for (const ev of arbitration.evidence.respondent) {
        timeline.events.push({
          event: 'evidence_submitted',
          timestamp: ev.submittedAt,
          actor: arbitration.respondent,
          party: 'respondent',
          evidenceHash: ev.hash,
          type: ev.type,
        });
      }

      // Add ruling if exists
      if (arbitration.ruling) {
        timeline.ruling = {
          rulingId: arbitration.ruling.rulingId,
          decision: arbitration.ruling.decision,
          reasoningHash: arbitration.ruling.reasoningHash,
          issuedAt: arbitration.ruling.issuedAt,
        };
      }
    }
  }

  // Sort events by timestamp
  timeline.events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Generate visual representation
  timeline.visualTimeline = timeline.events.map((e, i) => {
    const date = new Date(e.timestamp).toISOString().split('T')[0];
    const time = new Date(e.timestamp).toISOString().split('T')[1].slice(0, 5);
    return `${i + 1}. [${date} ${time}] ${e.event.toUpperCase()} by ${e.actor}${e.evidence ? ' (with evidence)' : ''}`;
  });

  console.log(JSON.stringify(timeline, null, 2));
}

// =============================================================================
// v0.4.0 FEATURES
// =============================================================================

// === PROMISE COMMAND (Agent-to-Agent Agreements) ===
function handlePromise(args) {
  const filters = parseFilters(args);
  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const [commitmentText, counterparty] = positionalArgs;

  if (!commitmentText || !counterparty) {
    console.error(JSON.stringify({
      error: 'Missing required arguments',
      usage: 'node capture.js promise "COMMITMENT_TEXT" "COUNTERPARTY" [--direction=outbound] [--channel=email]'
    }));
    process.exit(1);
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';
  const direction = filters.direction || 'outbound';
  const channel = filters.channel || 'unknown';

  // Create commitment hash
  const commitmentHash = crypto
    .createHash('sha256')
    .update(`${commitmentText}|${counterparty}|${agentId}|${Date.now()}`)
    .digest('hex');

  // Analyze commitment for risk
  const riskFlags = detectCommitmentRisks(commitmentText);

  const promise = {
    promiseId: `promise_${commitmentHash.slice(0, 16)}`,
    type: 'agent_commitment',
    direction, // 'outbound' = I promised them, 'inbound' = they promised me
    commitmentText,
    counterparty,
    channel,
    agentId,
    timestamp: new Date().toISOString(),
    commitmentHash,
    riskFlags,
    riskLevel: riskFlags.length >= 2 ? 'high' : riskFlags.length === 1 ? 'medium' : 'low',
    version: VERSION,
    disclaimer: 'RECEIPTS captures commitments for evidence. Not a substitute for legal review.',
  };

  console.log(JSON.stringify(promise, null, 2));

  // Save locally
  savePromise(promise, commitmentText);
  updateIndex(promise);
}

function detectCommitmentRisks(text) {
  const flags = [];
  const patterns = [
    { pattern: /unconditional/i, flag: 'Unconditional commitment' },
    { pattern: /guarantee/i, flag: 'Guarantee language' },
    { pattern: /by (monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i, flag: 'Time-bound commitment' },
    { pattern: /deliver/i, flag: 'Delivery commitment' },
    { pattern: /pay|payment|\$\d+/i, flag: 'Financial commitment' },
    { pattern: /exclusive/i, flag: 'Exclusivity commitment' },
    { pattern: /permanent|forever|perpetual/i, flag: 'Perpetual commitment' },
    { pattern: /no matter what|regardless/i, flag: 'Unconditional language' },
  ];

  for (const { pattern, flag } of patterns) {
    if (pattern.test(text) && !flags.includes(flag)) {
      flags.push(flag);
    }
  }
  return flags;
}

function savePromise(promise, fullText) {
  try {
    if (!fs.existsSync(RECEIPTS_DIR)) {
      fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    }
    const metaFile = path.join(RECEIPTS_DIR, `${promise.promiseId}.json`);
    fs.writeFileSync(metaFile, JSON.stringify(promise, null, 2));
    const textFile = path.join(RECEIPTS_DIR, `${promise.promiseId}.txt`);
    fs.writeFileSync(textFile, fullText);
  } catch (e) {}
}

// === WITNESS COMMAND (Decentralized Witnessing) ===
function handleWitness(args) {
  const filters = parseFilters(args);
  const captureId = filters.captureId || filters.id;
  const anchor = filters.anchor || 'moltbook';

  if (!captureId) {
    console.error(JSON.stringify({
      error: 'Missing captureId',
      usage: 'node capture.js witness --captureId=ID [--anchor=moltbook|bitcoin|both]'
    }));
    process.exit(1);
  }

  const index = loadIndex();
  const capture = index.find(r => r.captureId === captureId || r.promiseId === captureId);

  if (!capture) {
    console.error(JSON.stringify({ error: 'Capture not found' }));
    process.exit(1);
  }

  // Create witness record
  const witnessRecord = {
    witnessId: `witness_${crypto.randomBytes(8).toString('hex')}`,
    captureId: captureId,
    documentHash: capture.documentHash || capture.commitmentHash,
    timestamp: new Date().toISOString(),
    anchor,
    status: 'pending',
    anchors: {},
  };

  // Handle different anchor types
  if (anchor === 'moltbook' || anchor === 'both') {
    const moltbookKey = process.env.RECEIPTS_MOLTBOOK_KEY;
    if (moltbookKey) {
      witnessRecord.anchors.moltbook = {
        status: 'ready',
        postContent: `📜 WITNESS: Document hash ${capture.documentHash || capture.commitmentHash} captured at ${capture.timestamp}`,
        instructions: 'POST to Moltbook API to anchor this hash publicly',
        apiEndpoint: 'https://www.moltbook.com/api/v1/posts',
      };
    } else {
      witnessRecord.anchors.moltbook = {
        status: 'missing_key',
        instructions: 'Set RECEIPTS_MOLTBOOK_KEY environment variable to enable Moltbook witnessing',
      };
    }
  }

  if (anchor === 'bitcoin' || anchor === 'both') {
    witnessRecord.anchors.bitcoin = {
      status: 'ready',
      opReturnData: `RECEIPTS:${(capture.documentHash || capture.commitmentHash).slice(0, 40)}`,
      instructions: 'Use any Bitcoin wallet to create an OP_RETURN transaction with this data',
      estimatedFee: '~$0.50-2.00 depending on network',
    };
  }

  // Save witness record
  saveWitness(witnessRecord);

  console.log(JSON.stringify(witnessRecord, null, 2));
}

function saveWitness(witness) {
  try {
    if (!fs.existsSync(WITNESS_DIR)) {
      fs.mkdirSync(WITNESS_DIR, { recursive: true });
    }
    const witnessFile = path.join(WITNESS_DIR, `${witness.witnessId}.json`);
    fs.writeFileSync(witnessFile, JSON.stringify(witness, null, 2));
  } catch (e) {}
}

// === RULES COMMAND (Custom Rulesets) ===
function handleRules(args) {
  const filters = parseFilters(args);

  if (args.includes('--list') || args.length === 0) {
    // List all rules (built-in + custom)
    const customRules = loadCustomRules();
    console.log(JSON.stringify({
      builtInRules: getBuiltInRules().length,
      customRules: customRules.length,
      rules: {
        builtIn: getBuiltInRules(),
        custom: customRules,
      }
    }, null, 2));
    return;
  }

  if (filters.add && filters.flag) {
    // Add a new custom rule
    addCustomRule(filters.add, filters.flag, filters.category || 'custom');
    console.log(JSON.stringify({
      success: true,
      message: `Added custom rule: "${filters.flag}"`,
      pattern: filters.add,
    }));
    return;
  }

  if (filters.import) {
    // Import rules from file
    try {
      const imported = JSON.parse(fs.readFileSync(filters.import, 'utf8'));
      const customRules = loadCustomRules();
      const merged = [...customRules, ...imported];
      fs.writeFileSync(CUSTOM_RULES_FILE, JSON.stringify(merged, null, 2));
      console.log(JSON.stringify({
        success: true,
        message: `Imported ${imported.length} rules`,
      }));
    } catch (e) {
      console.error(JSON.stringify({ error: 'Failed to import rules', details: e.message }));
    }
    return;
  }

  if (filters.remove) {
    // Remove a custom rule by flag name
    const customRules = loadCustomRules();
    const filtered = customRules.filter(r => r.flag !== filters.remove);
    fs.writeFileSync(CUSTOM_RULES_FILE, JSON.stringify(filtered, null, 2));
    console.log(JSON.stringify({
      success: true,
      message: `Removed rule: "${filters.remove}"`,
    }));
    return;
  }

  console.error(JSON.stringify({
    error: 'Invalid rules command',
    usage: 'node capture.js rules --list | --add="PATTERN" --flag="FLAG" | --import=FILE | --remove="FLAG"'
  }));
}

function getBuiltInRules() {
  return [
    { pattern: 'binding arbitration', flag: 'Binding arbitration clause', category: 'legal' },
    { pattern: 'class action waiver', flag: 'Class action waiver', category: 'legal' },
    { pattern: 'no refund', flag: 'No refund policy', category: 'financial' },
    { pattern: 'auto-renew', flag: 'Auto-renewal clause', category: 'financial' },
    { pattern: 'perpetual license', flag: 'Perpetual license grant', category: 'ip' },
    { pattern: 'sell.*data', flag: 'Data selling clause', category: 'privacy' },
    { pattern: 'share.*third part', flag: 'Third-party data sharing', category: 'privacy' },
    { pattern: 'limit.*liability', flag: 'Limited liability clause', category: 'legal' },
    { pattern: 'indemnif', flag: 'Indemnification clause', category: 'legal' },
    { pattern: 'terminate.*without.*notice', flag: 'Termination without notice', category: 'terms' },
  ];
}

function loadCustomRules() {
  try {
    if (fs.existsSync(CUSTOM_RULES_FILE)) {
      return JSON.parse(fs.readFileSync(CUSTOM_RULES_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function addCustomRule(pattern, flag, category) {
  const customRules = loadCustomRules();
  customRules.push({ pattern, flag, category, addedAt: new Date().toISOString() });

  if (!fs.existsSync(RECEIPTS_DIR)) {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  }
  fs.writeFileSync(CUSTOM_RULES_FILE, JSON.stringify(customRules, null, 2));
}

// Enhanced risk detection with custom rules
function detectRiskFlagsWithCustom(text) {
  const flags = detectRiskFlags(text); // Built-in
  const customRules = loadCustomRules();

  for (const rule of customRules) {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(text) && !flags.includes(rule.flag)) {
        flags.push(rule.flag);
      }
    } catch (e) {}
  }

  return flags;
}

// === PDF EXPORT (Enhanced Export) ===
// Note: Generates a structured format that can be converted to PDF by external tools
function generatePDFContent(capture, documentText) {
  const index = loadIndex();
  const meta = index.find(r => r.captureId === capture.captureId);

  return {
    format: 'receipts-evidence-v1',
    title: `Evidence Package: ${capture.merchantName || capture.counterparty}`,
    generatedAt: new Date().toISOString(),
    generatedBy: `RECEIPTS Guard v${VERSION}`,

    header: {
      caseReference: capture.captureId,
      documentType: capture.type === 'agent_commitment' ? 'Agent Commitment Record' : 'Terms of Service Capture',
      captureDate: capture.timestamp,
    },

    parties: {
      agent: capture.agentId,
      counterparty: capture.merchantName || capture.counterparty,
      direction: capture.direction || 'inbound',
    },

    documentEvidence: {
      hash: capture.documentHash || capture.commitmentHash,
      hashAlgorithm: 'SHA-256',
      length: documentText?.length || capture.documentLength,
      preview: documentText?.substring(0, 500) || '[Document text not available]',
    },

    consentEvidence: capture.consentProof ? {
      type: capture.consentProof.type,
      capturedAt: capture.consentProof.capturedAt,
      method: capture.consentProof.agentAction,
      elementSelector: capture.consentProof.elementSelector,
      hasScreenshot: !!capture.consentProof.screenshotHash,
    } : null,

    riskAnalysis: {
      trustScore: capture.trustScore,
      recommendation: capture.recommendation,
      flags: capture.riskFlags?.map(flag => ({
        flag,
        implication: getRiskImplication(flag),
      })) || [],
    },

    changeHistory: capture.changeDetected ? {
      detected: true,
      previousCapture: capture.previousCapture,
      note: capture.changeNote,
    } : { detected: false },

    legalDisclaimer: `This document was generated by RECEIPTS Guard v${VERSION}, an automated agreement capture tool. ` +
      'It records what terms existed at the time of capture and how consent was documented. ' +
      'This is NOT legal advice. The patterns flagged are based on automated detection and may not capture all relevant clauses. ' +
      'Consult with a qualified attorney for legal interpretation and dispute resolution.',

    exportInstructions: {
      toPDF: 'Use a JSON-to-PDF converter or import into your document system',
      forCourt: 'Print this document and have it notarized alongside the full agreement text',
      forMediation: 'Share this structured data with the mediator as evidence of agreement terms',
    },
  };
}

// === FRAMEWORK INTEGRATION API ===

/**
 * Register a beforeConsent hook
 * Called before any agreement is captured, can block or modify
 *
 * Usage:
 *   const receipts = require('./capture.js');
 *   receipts.beforeConsent(async (element, ctx) => {
 *     const capture = await receipts.capture({ text: element.innerText, ... });
 *     if (capture.recommendation === 'block') {
 *       return { proceed: false, reason: capture.summary };
 *     }
 *     return { proceed: true };
 *   });
 */
function beforeConsent(handler) {
  hooks.beforeConsent.push(handler);
}

/**
 * Register an afterCapture hook
 * Called after every successful capture
 */
function afterCapture(handler) {
  hooks.afterCapture.push(handler);
}

/**
 * Register an onRiskDetected hook
 * Called when high-risk patterns are found
 */
function onRiskDetected(handler) {
  hooks.onRiskDetected.push(handler);
}

/**
 * Programmatic capture (for framework integration)
 */
async function captureAgreement(options) {
  const { text, url, merchant, consentType, element, screenshot, action } = options;

  // Run beforeConsent hooks
  for (const hook of hooks.beforeConsent) {
    try {
      const result = await hook({ text, url, merchant }, { element });
      if (result && result.proceed === false) {
        return { blocked: true, reason: result.reason };
      }
    } catch (e) {}
  }

  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';
  const documentHash = crypto.createHash('sha256').update(text).digest('hex');

  // Check for duplicates
  const duplicate = checkDuplicate(documentHash);
  if (duplicate) {
    return { ...duplicate, isDuplicate: true };
  }

  // Analyze
  const riskFlags = detectRiskFlagsWithCustom(text);
  const consentFlags = detectConsentType(text);
  const allFlags = [...riskFlags, ...consentFlags];
  const trustScore = Math.max(0, 100 - (allFlags.length * 15));
  const recommendation = getRecommendation(allFlags, consentFlags);

  const capture = {
    captureId: `local_${documentHash.slice(0, 16)}`,
    recommendation,
    trustScore,
    riskFlags: allFlags,
    summary: generateSummary(allFlags, trustScore, consentType || detectImplicitConsentType(text)),
    documentHash,
    sourceUrl: url || 'unknown',
    merchantName: merchant || 'Unknown Merchant',
    agentId,
    timestamp: new Date().toISOString(),
    documentLength: text.length,
    version: VERSION,
    consentProof: {
      type: consentType || detectImplicitConsentType(text),
      capturedAt: new Date().toISOString(),
      elementSelector: element || null,
      screenshotHash: screenshot ? crypto.createHash('sha256').update(screenshot).digest('hex') : null,
      agentAction: action || 'programmatic_capture',
    },
    disclaimer: 'RECEIPTS flags known problematic patterns only. Not a substitute for legal review.',
  };

  // Save
  saveLocalReceipt(capture, text);
  updateIndex(capture);

  // Run afterCapture hooks
  for (const hook of hooks.afterCapture) {
    try { await hook(capture); } catch (e) {}
  }

  // Run onRiskDetected hooks if high risk
  if (recommendation === 'block' || allFlags.length >= 2) {
    for (const hook of hooks.onRiskDetected) {
      try { await hook(capture, allFlags); } catch (e) {}
    }
  }

  return capture;
}

/**
 * Programmatic promise capture (for agent-to-agent)
 */
async function capturePromise(options) {
  const { text, counterparty, direction, channel } = options;
  const agentId = process.env.RECEIPTS_AGENT_ID || 'openclaw-agent';

  const commitmentHash = crypto
    .createHash('sha256')
    .update(`${text}|${counterparty}|${agentId}|${Date.now()}`)
    .digest('hex');

  const riskFlags = detectCommitmentRisks(text);

  const promise = {
    promiseId: `promise_${commitmentHash.slice(0, 16)}`,
    type: 'agent_commitment',
    direction: direction || 'outbound',
    commitmentText: text,
    counterparty,
    channel: channel || 'api',
    agentId,
    timestamp: new Date().toISOString(),
    commitmentHash,
    riskFlags,
    riskLevel: riskFlags.length >= 2 ? 'high' : riskFlags.length === 1 ? 'medium' : 'low',
    version: VERSION,
  };

  savePromise(promise, text);
  updateIndex(promise);

  return promise;
}

// === EXPORT MODULE API ===
// When required as a module, export the programmatic API
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Hooks
    beforeConsent,
    afterCapture,
    onRiskDetected,

    // Programmatic capture
    capture: captureAgreement,
    capturePromise,

    // Arbitration Protocol (v0.5.0)
    generateTermsHash,
    signTerms,
    verifySignature,

    // Utilities
    detectRiskFlags: detectRiskFlagsWithCustom,
    detectConsentType,
    loadIndex,
    generatePDFContent,

    // Constants
    VERSION,
    RECEIPTS_DIR,
    PROPOSALS_DIR,
    AGREEMENTS_DIR,
    ARBITRATIONS_DIR,
    RULINGS_DIR,
    VALID_ARBITRATION_REASONS,
  };
}
