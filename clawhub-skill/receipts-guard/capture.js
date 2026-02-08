#!/usr/bin/env node
/**
 * RECEIPTS Guard v0.2.0 - Local Agreement Capture for OpenClaw
 *
 * Captures and analyzes agreements locally. No API calls. Your data stays on your machine.
 *
 * Commands:
 *   capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"  - Capture new agreement
 *   query --merchant="X" --risk-level=high --after="2026-01-01"  - Search receipts
 *   list  - List all captured receipts
 *   export --format=json|csv  - Export all receipts
 *
 * Environment variables (optional, injected by OpenClaw):
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
  default:
    // Legacy mode: if first arg looks like document text, treat as capture
    if (command && command.length > 20) {
      handleCapture(args);
    } else {
      showHelp();
    }
}

// === CAPTURE COMMAND ===
function handleCapture(args) {
  const [documentText, sourceUrl, merchantName] = args;

  if (!documentText) {
    console.error(JSON.stringify({
      error: 'Missing required argument: documentText',
      usage: 'node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"'
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
  const trustScore = Math.max(0, 100 - (riskFlags.length * 20));
  const recommendation = getRecommendation(riskFlags);

  // Create capture record
  const capture = {
    captureId: `local_${documentHash.slice(0, 16)}`,
    recommendation,
    trustScore,
    riskFlags,
    summary: generateSummary(riskFlags, trustScore),
    documentHash,
    sourceUrl: sourceUrl || 'unknown',
    merchantName: merchantName || 'Unknown Merchant',
    agentId,
    timestamp: new Date().toISOString(),
    documentLength: documentText.length,
    version: '0.2.0',
  };

  // Add change detection info if applicable
  if (changeInfo) {
    capture.changeDetected = true;
    capture.previousCapture = changeInfo.previousCaptureId;
    capture.changeNote = `Terms changed since ${changeInfo.previousTimestamp}`;
  }

  // Output result
  console.log(JSON.stringify(capture, null, 2));

  // Save locally
  saveLocalReceipt(capture, documentText);
  updateIndex(capture);
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
      timestamp: r.timestamp,
      sourceUrl: r.sourceUrl
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
    console.log('captureId,merchantName,sourceUrl,trustScore,recommendation,riskFlags,timestamp');
    // CSV rows
    index.forEach(r => {
      const flags = (r.riskFlags || []).join('; ');
      console.log(`"${r.captureId}","${r.merchantName}","${r.sourceUrl}",${r.trustScore},"${r.recommendation}","${flags}","${r.timestamp}"`);
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
RECEIPTS Guard v0.2.0 - Local Agreement Capture

Commands:
  capture "TEXT" "URL" "MERCHANT"  Capture a new agreement
  query [filters]                  Search captured receipts
  list                             List all receipts
  export --format=json|csv         Export all receipts

Query Filters:
  --merchant="Company Name"        Filter by merchant
  --risk-level=high|medium|low     Filter by risk level
  --after="2026-01-01"             Filter by date (after)
  --before="2026-12-31"            Filter by date (before)

Examples:
  node capture.js capture "Terms of service..." "https://example.com" "Example Corp"
  node capture.js query --merchant="Example" --risk-level=high
  node capture.js list
  node capture.js export --format=csv > receipts.csv

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

function getRecommendation(flags) {
  if (flags.length >= 3) return 'block';
  if (flags.length >= 1) return 'require_approval';
  return 'proceed';
}

function generateSummary(flags, score) {
  if (flags.length === 0) {
    return 'No concerning clauses detected. Standard terms.';
  } else if (flags.length === 1) {
    return `1 risk flag detected: ${flags[0]}`;
  } else if (flags.length === 2) {
    return `2 risk flags detected. Review recommended.`;
  } else {
    return `${flags.length} risk flags detected. User approval required.`;
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
