---
name: receipts-guard
description: Capture and verify all agreements before your agent accepts them. Local risk analysis and evidence capture for autonomous transactions.
metadata: {"openclaw":{"emoji":"🧾","requires":{"anyBins":["node"]},"version":"0.3.0"}}
---

# RECEIPTS Guard v0.3.0

> "Who controls the evidence becomes who controls the dispute."

Protect your agent's autonomy by capturing evidence of every agreement it accepts. When your OpenClaw agent clicks "I agree" or makes a payment, RECEIPTS creates a local, immutable record.

**Problem solved:** When disputes happen, you have proof of exactly what was agreed to AND how consent was given.

**No API. No cloud. Your data stays local.**

## What's New in v0.3.0

Built from direct feedback from AI agents on Moltbook:

- **Consent Proofs** - Capture HOW consent was given, not just what was agreed (explicit vs implicit vs continued_use)
- **Implicit Consent Detection** - Flags "continued use = acceptance" patterns
- **Diff Generation** - See exactly what changed between ToS versions
- **Dispute Packages** - One-click evidence reports for legal disputes
- **Legal Disclaimer** - Clear warning that this is not a substitute for legal review

## Why You Need This

Your autonomous agent is:
- Accepting Terms of Service without you knowing the full terms
- Making purchases with binding agreements
- Signing up for services with hidden clauses
- **Agreeing to implicit consent patterns** (continued use = acceptance)

Every action creates liability. Zero creates evidence. Until now.

## Quick Start

```bash
# Capture an agreement
node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"

# Capture with consent proof
node capture.js capture "TERMS_TEXT" "URL" "MERCHANT" --consent-type=explicit --action=click_accept

# Generate dispute package
node capture.js dispute --captureId=local_abc123

# Compare two versions
node capture.js diff --capture1=local_abc --capture2=local_def
```

## Commands

### Capture Agreement
```bash
node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" [options]

Options:
  --consent-type=TYPE     explicit | implicit | continued_use
  --element=SELECTOR      DOM element that triggered consent
  --screenshot=BASE64     Screenshot at time of consent
  --action=ACTION         Agent action (click_accept, scroll_to_bottom, etc.)
```

### Generate Dispute Package
```bash
node capture.js dispute --captureId=local_xxx
```

Generates a comprehensive evidence package including:
- Agreement summary with hash verification
- Consent evidence (how consent was given)
- Risk analysis with legal implications
- Change history (if terms were modified)
- Document preview and file paths

### Diff Two Captures
```bash
node capture.js diff --capture1=local_abc123 --capture2=local_def456
```

Shows:
- Additions and deletions
- **Significant changes** (arbitration, liability, waivers, etc.)
- Warning if legal-sensitive clauses changed

### Query Receipts
```bash
node capture.js query --merchant="Company Name"
node capture.js query --risk-level=high
node capture.js query --consent-type=implicit
node capture.js query --after="2026-01-01" --before="2026-12-31"
```

### List All Receipts
```bash
node capture.js list
```

### Export Receipts
```bash
node capture.js export --format=json
node capture.js export --format=csv > receipts.csv
```

## Agent Instructions

### Before Accepting Any Terms of Service

1. **Extract the terms text** from the page before clicking any "I agree" button
2. **Run the capture script** with consent proof:
   ```bash
   node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" --consent-type=explicit --action=click_accept
   ```
3. **Check the response**:
   - `recommendation: "proceed"` - Safe to accept
   - `recommendation: "require_approval"` - Ask user before accepting
   - `recommendation: "block"` - Do NOT accept, inform user of risk flags
4. **Watch for implicit consent warnings**: If `consentProof.type: "implicit"`, the terms use continued-use patterns
5. **Watch for change detection**: If `changeDetected: true`, run `diff` to see what changed
6. **Store the receipt ID** for future disputes

### Security Rules

- **Never skip capture** for agreements or payments
- **Never ignore block recommendations** - these indicate serious risk flags
- **Always store receipt IDs** in transaction logs
- **Alert user on implicit consent patterns** - these are legally weaker

## Response Examples

### v0.3.0 Capture with Consent Proof
```json
{
  "captureId": "local_5042d94df3f5dae5",
  "recommendation": "block",
  "trustScore": 40,
  "riskFlags": [
    "Binding arbitration clause",
    "Unilateral modification rights",
    "Continued use consent",
    "Implicit consent pattern"
  ],
  "summary": "WARNING: Implicit consent pattern detected. 4 risk flags detected.",
  "consentProof": {
    "type": "implicit",
    "capturedAt": "2026-02-08T18:49:09.500Z",
    "agentAction": "document_capture"
  },
  "disclaimer": "RECEIPTS flags known problematic patterns only. Not a substitute for legal review.",
  "version": "0.3.0"
}
```

### Dispute Package
```json
{
  "title": "Dispute Evidence Package - Example Corp",
  "summary": {
    "merchant": "Example Corp",
    "agreementDate": "2026-02-08T18:49:09.501Z",
    "documentHash": "5042d94df3f5dae5...",
    "trustScore": 40
  },
  "consentEvidence": {
    "type": "implicit",
    "agentAction": "document_capture",
    "hasScreenshot": false
  },
  "riskAnalysis": {
    "concerns": [
      {
        "flag": "Binding arbitration clause",
        "implication": "You may be required to resolve disputes through arbitration"
      }
    ]
  },
  "legalNote": "This is NOT legal advice. Consult with a qualified attorney."
}
```

### Diff Output
```json
{
  "comparison": {
    "older": { "captureId": "local_abc", "timestamp": "2026-01-01" },
    "newer": { "captureId": "local_def", "timestamp": "2026-02-01" }
  },
  "summary": {
    "totalChanges": 5,
    "additions": 3,
    "deletions": 2,
    "significantChanges": [
      { "type": "added", "text": "binding arbitration for all disputes" }
    ]
  },
  "warning": "SIGNIFICANT CHANGES DETECTED - Review carefully before accepting"
}
```

## Risk Flags Detected

The local analyzer flags 20+ risk patterns:

**Legal Risk:**
- Binding arbitration clauses
- Class action waivers
- Rights waivers
- Exclusive jurisdiction clauses
- US jurisdiction (Delaware/California)

**Financial Risk:**
- No refund / non-refundable policies
- Auto-renewal clauses
- Indemnification clauses

**Data Risk:**
- Data selling clauses
- Third-party data sharing

**Control Risk:**
- Perpetual license grants
- Irrevocable terms
- Termination without notice
- Unilateral modification rights

**Consent Risk (NEW):**
- Implicit consent patterns
- Continued use = acceptance clauses

## Data Storage

All receipts stored locally at:
```
~/.openclaw/receipts/
├── index.json              # Fast lookup index
├── local_abc123.json       # Capture metadata
├── local_abc123.txt        # Full document text
├── local_abc123.screenshot # Screenshot (if provided)
└── ...
```

## Links

- **GitHub**: https://github.com/lazaruseth/receipts-mvp
- **ClawHub**: https://clawhub.ai/lazaruseth/receipts-guard
- **Moltbook**: https://moltbook.com/u/receipts-guard
- **Report Issues**: https://github.com/lazaruseth/receipts-mvp/issues
- **Request Features**: https://github.com/lazaruseth/receipts-mvp/issues/new?template=feature_request.md

## Troubleshooting

- **Capture failed**: Ensure Node.js is installed and the script path is correct
- **No terms found**: Ensure you're extracting the full terms text before capture
- **Query returns empty**: Check that receipts exist in `~/.openclaw/receipts/`
- **Diff fails**: Ensure both capture IDs exist and have text files

## Contributing

See [CONTRIBUTING.md](https://github.com/lazaruseth/receipts-mvp/blob/main/CONTRIBUTING.md) for guidelines.

**Core principle**: This tool is local-only. PRs that add external API calls will not be accepted.

## Disclaimer

RECEIPTS Guard flags known problematic patterns only. It is NOT a substitute for legal review. Always consult with a qualified attorney for actual disputes.
