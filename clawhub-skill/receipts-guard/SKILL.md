---
name: receipts-guard
description: Capture and verify all agreements before your agent accepts them. Local risk analysis and evidence capture for autonomous transactions.
metadata: {"openclaw":{"emoji":"🧾","requires":{"anyBins":["node"]},"version":"0.2.0"}}
---

# RECEIPTS Guard v0.2.0

Protect your agent's autonomy by capturing evidence of every agreement it accepts. When your OpenClaw agent clicks "I agree" or makes a payment, RECEIPTS creates a local, immutable record.

**Problem solved:** When disputes happen, you have proof of exactly what was agreed to.

**No API. No cloud. Your data stays local.**

## What's New in v0.2.0

- **Query your receipts** - Search by merchant, risk level, or date
- **Change detection** - Alerts when ToS changes from previous capture
- **Export functionality** - Export to JSON or CSV for evidence
- **Smart deduplication** - Detects and flags duplicate captures
- **Index file** - Fast local queries without scanning all files

## Why You Need This

Your OpenClaw agent is:
- Accepting Terms of Service without you knowing the full terms
- Making purchases with binding agreements
- Signing up for services with hidden clauses

Every action creates liability. Zero creates evidence. Until now.

## Configuration

Configure in **`~/.openclaw/openclaw.json`**:

```json
"skills": {
  "entries": {
    "receipts-guard": {
      "enabled": true,
      "env": {
        "RECEIPTS_AGENT_ID": "my-openclaw-agent"
      }
    }
  }
}
```

| Variable | Description |
|----------|-------------|
| RECEIPTS_AGENT_ID | Unique identifier for this agent instance (optional) |

## Commands

### Capture Agreement
```bash
node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"
```

### Query Receipts
```bash
node capture.js query --merchant="Company Name"
node capture.js query --risk-level=high
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

1. **Extract the terms text** from the page before clicking any "I agree", "Accept", or "Continue" button
2. **Run the capture script** to analyze and store the agreement:
   ```bash
   node ~/.openclaw/workspace/skills/receipts-guard/capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"
   ```
3. **Check the response**:
   - If `recommendation: "proceed"` - Safe to accept
   - If `recommendation: "require_approval"` - Ask user before accepting
   - If `recommendation: "block"` - Do NOT accept, inform user of risk flags
4. **Watch for change detection**: If `changeDetected: true`, the terms have changed since last capture
5. **Store the receipt ID** for future reference

### Before Making Any Payment

1. **Capture the terms** associated with the purchase
2. **Include transaction details** when available:
   ```bash
   node ~/.openclaw/workspace/skills/receipts-guard/capture.js capture "CHECKOUT_TERMS" "https://merchant.com/checkout" "Merchant Name"
   ```
3. **Only proceed with payment** if capture succeeds and recommendation allows

### Security Rules

- **Never skip capture** for agreements or payments - this protects the user
- **Never ignore block recommendations** - these indicate serious risk flags
- **Always store receipt IDs** in transaction logs for future disputes

## Response Examples

### Standard Capture
```json
{
  "captureId": "local_6c6870d3e01cd265",
  "recommendation": "proceed",
  "trustScore": 100,
  "riskFlags": [],
  "summary": "No concerning clauses detected. Standard terms.",
  "documentHash": "6c6870d3e01cd265...",
  "version": "0.2.0"
}
```

### Risk Flags Detected
```json
{
  "captureId": "local_abc123def456",
  "recommendation": "block",
  "trustScore": 40,
  "riskFlags": [
    "Binding arbitration clause",
    "Class action waiver",
    "No refund policy"
  ],
  "summary": "3 risk flags detected. User approval required."
}
```

### Terms Changed
```json
{
  "captureId": "local_xyz789",
  "recommendation": "require_approval",
  "changeDetected": true,
  "previousCapture": "local_abc123",
  "changeNote": "Terms changed since 2026-02-01T10:00:00.000Z"
}
```

### Duplicate Detected
```json
{
  "captureId": "local_abc123",
  "note": "Duplicate of existing capture from 2026-02-01T10:00:00.000Z",
  "isDuplicate": true
}
```

## What Gets Captured

- Full document text (SHA-256 hashed for immutability)
- Source URL and timestamp
- Merchant/service name
- Risk analysis results
- Trust score
- Change history (if same URL captured before)

All data stays local in `~/.openclaw/receipts/`. No external API calls.

## Risk Flags Detected

The local analyzer flags 18 risk patterns:
- Binding arbitration clauses
- Class action waivers
- Rights waivers
- No refund / non-refundable policies
- Auto-renewal clauses
- Perpetual license grants
- Irrevocable terms
- Data selling/sharing clauses
- Limited liability clauses
- Indemnification clauses
- Hold harmless clauses
- US jurisdiction clauses (Delaware/California)
- Exclusive jurisdiction clauses
- Termination without notice
- Unilateral modification rights

## Data Storage

All receipts stored locally at:
```
~/.openclaw/receipts/
├── index.json              # Fast lookup index
├── local_abc123.json       # Capture metadata
├── local_abc123.txt        # Full document text
└── ...
```

## Links

- **npm**: `npm install @lazaruseth/agreement-guard`
- **GitHub**: https://github.com/lazaruseth/receipts-mvp
- **Report Issues**: https://github.com/lazaruseth/receipts-mvp/issues
- **Request Features**: https://github.com/lazaruseth/receipts-mvp/issues/new?template=feature_request.md

## Troubleshooting

- **Capture failed**: Ensure Node.js is installed and the script path is correct
- **No terms found**: Ensure you're extracting the full terms text before capture
- **Query returns empty**: Check that receipts exist in `~/.openclaw/receipts/`

## Contributing

See [CONTRIBUTING.md](https://github.com/lazaruseth/receipts-mvp/blob/main/CONTRIBUTING.md) for guidelines.

**Core principle**: This tool is local-only. PRs that add external API calls will not be accepted.
