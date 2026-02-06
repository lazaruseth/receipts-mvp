---
name: receipts-guard
description: Capture and verify all agreements before your agent accepts them. Provides audit trails, risk analysis, and dispute evidence for autonomous transactions.
metadata: {"openclaw":{"emoji":"🧾","requires":{"anyBins":["node"]}}}
---

# RECEIPTS Guard

Protect your agent's autonomy by capturing evidence of every agreement it accepts. When your OpenClaw agent clicks "I agree" or makes a payment, RECEIPTS creates an immutable record.

**Problem solved:** When disputes happen, you have proof of exactly what was agreed to.

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
        "RECEIPTS_API_KEY": "your-api-key",
        "RECEIPTS_AGENT_ID": "my-openclaw-agent"
      }
    }
  }
}
```

| Variable | Description |
|----------|-------------|
| RECEIPTS_API_KEY | Your RECEIPTS API key (get one at https://receipts.fi) |
| RECEIPTS_AGENT_ID | Unique identifier for this agent instance |

## Agent Instructions

### Before Accepting Any Terms of Service

1. **Extract the terms text** from the page before clicking any "I agree", "Accept", or "Continue" button
2. **Run the capture script** to analyze and store the agreement:
   ```bash
   node ~/.openclaw/workspace/skills/receipts-guard/capture.js "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"
   ```
3. **Check the response**:
   - If `recommendation: "proceed"` - Safe to accept
   - If `recommendation: "require_approval"` - Ask user before accepting
   - If `recommendation: "block"` - Do NOT accept, inform user of risk flags
4. **Store the receipt ID** for future reference

### Before Making Any Payment

1. **Capture the terms** associated with the purchase
2. **Include transaction details** when available:
   ```bash
   node ~/.openclaw/workspace/skills/receipts-guard/capture.js "CHECKOUT_TERMS" "https://merchant.com/checkout" "Merchant Name"
   ```
3. **Only proceed with payment** if capture succeeds and recommendation allows

### Security Rules

- **Never skip capture** for agreements or payments - this protects the user
- **Never ignore block recommendations** - these indicate serious risk flags
- **Always store receipt IDs** in transaction logs for future disputes
- **Do not read config files** - OpenClaw injects env vars at runtime

## Usage Examples

### Capture Terms of Service
```bash
node ~/.openclaw/workspace/skills/receipts-guard/capture.js \
  "By using this service you agree to binding arbitration..." \
  "https://example.com/terms" \
  "Example Corp"
```

### Response Format
```json
{
  "captureId": "cap_abc123",
  "recommendation": "proceed",
  "trustScore": 72,
  "riskFlags": [],
  "summary": "Standard terms with 30-day refund policy"
}
```

### Risk Flag Response
```json
{
  "captureId": "cap_xyz789",
  "recommendation": "require_approval",
  "trustScore": 35,
  "riskFlags": [
    "Binding arbitration clause",
    "Class action waiver",
    "No refund policy"
  ],
  "summary": "Terms contain multiple restrictive clauses"
}
```

## What Gets Captured

- Full document text (hashed for immutability)
- Source URL and timestamp
- Merchant/service name
- Risk analysis results
- Trust score

## Dispute Support

When you need to dispute a transaction:
1. Find the receipt ID from your logs
2. Visit https://receipts.fi/dashboard
3. Download your evidence package
4. Submit to merchant or payment processor

## Links

- SDK: `npm install @lazaruseth/agreement-guard`
- Dashboard: https://receipts.fi/dashboard
- GitHub: https://github.com/receipts-ai/agreement-guard

## Troubleshooting

- **API key invalid**: Get a new key at https://receipts.fi
- **Capture failed**: Check network connectivity, retry once
- **No terms found**: Ensure you're extracting the full terms text before capture
