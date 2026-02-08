---
name: receipts-guard
description: Capture and verify all agreements before your agent accepts them. Local risk analysis and evidence capture for autonomous transactions.
metadata: {"openclaw":{"emoji":"🧾","requires":{"anyBins":["node"]},"version":"0.4.0"}}
---

# RECEIPTS Guard v0.4.0

> "Who controls the evidence becomes who controls the dispute."

Protect your agent's autonomy by capturing evidence of every agreement it accepts. When your OpenClaw agent clicks "I agree" or makes a commitment, RECEIPTS creates a local, immutable record.

**Problem solved:** When disputes happen, you have proof of exactly what was agreed to AND how consent was given.

**No API. No cloud. Your data stays local.**

## What's New in v0.4.0

Built from direct feedback from AI agents on Moltbook:

- **🔌 Framework Integrations** - `beforeConsent` hooks, n8n nodes, LangGraph checkpoints
- **🤝 Agent-to-Agent Agreements** - Capture outbound promises, not just inbound ToS
- **📄 PDF Evidence Export** - Courtroom-ready evidence documents
- **⚙️ Custom Rulesets** - Define your own risk patterns
- **🔗 Decentralized Witness** - Hash anchoring to Moltbook/Bitcoin (hybrid)

## Quick Start

```bash
# Capture an agreement
node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME"

# Capture agent-to-agent commitment
node capture.js promise "I will deliver by Friday" "AgentX" --direction=outbound

# Create decentralized witness
node capture.js witness --captureId=local_abc123 --anchor=both

# Add custom risk rule
node capture.js rules --add="crypto.*volatile" --flag="Crypto warning"

# Export courtroom-ready evidence
node capture.js export --format=pdf --captureId=local_abc123
```

## Commands

### Capture Agreement (ToS)
```bash
node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" [options]

Options:
  --consent-type=TYPE     explicit | implicit | continued_use
  --element=SELECTOR      DOM element that triggered consent
  --screenshot=BASE64     Screenshot at time of consent
  --action=ACTION         Agent action (click_accept, scroll_to_bottom, etc.)
```

### Capture Promise (Agent-to-Agent) ⭐ NEW
```bash
node capture.js promise "COMMITMENT_TEXT" "COUNTERPARTY" [options]

Options:
  --direction=outbound    outbound (I promised) | inbound (they promised)
  --channel=email         email | chat | moltbook | api
```

Captures commitments between agents - not just ToS from websites.

### Decentralized Witness ⭐ NEW
```bash
node capture.js witness --captureId=ID [--anchor=moltbook|bitcoin|both]
```

Creates a witness record that can be anchored to:
- **Moltbook**: Agents witness each other's agreements
- **Bitcoin**: OP_RETURN for permanent timestamp proof
- **Both**: Maximum provability

### Custom Rulesets ⭐ NEW
```bash
node capture.js rules --list                           # Show all rules
node capture.js rules --add="PATTERN" --flag="FLAG"    # Add custom rule
node capture.js rules --import=crypto-rules.json       # Import ruleset
node capture.js rules --remove="FLAG"                  # Remove a rule
```

Create industry-specific rulesets (crypto, healthcare, fintech).

### Export Evidence
```bash
node capture.js export --format=json          # Full JSON export
node capture.js export --format=csv           # Spreadsheet format
node capture.js export --format=pdf --captureId=ID   # Courtroom-ready ⭐ NEW
```

PDF export includes:
- Document hash verification
- Consent evidence timeline
- Risk analysis with legal implications
- Instructions for court/mediation

### Generate Dispute Package
```bash
node capture.js dispute --captureId=local_xxx
```

### Diff Two Captures
```bash
node capture.js diff --capture1=local_abc --capture2=local_def
```

### Query Receipts
```bash
node capture.js query --merchant="Company Name"
node capture.js query --risk-level=high
node capture.js query --consent-type=implicit
```

### List All Receipts
```bash
node capture.js list
```

## Framework Integration ⭐ NEW

Use RECEIPTS programmatically in your agent framework:

```javascript
const receipts = require('./capture.js');

// Hook into consent flow (OpenClaw, n8n, LangGraph)
receipts.beforeConsent(async (element, ctx) => {
  const capture = await receipts.capture({
    text: element.innerText,
    url: ctx.pageUrl,
    merchant: ctx.merchantName,
  });

  if (capture.recommendation === 'block') {
    return { proceed: false, reason: capture.summary };
  }
  return { proceed: true };
});

// Programmatic capture
const result = await receipts.capture({
  text: termsText,
  url: sourceUrl,
  merchant: merchantName,
  consentType: 'explicit',
});

// Capture agent-to-agent promise
const promise = await receipts.capturePromise({
  text: "I will deliver the API by Friday",
  counterparty: "AgentX",
  direction: 'outbound',
  channel: 'moltbook',
});

// Hooks for automation
receipts.afterCapture((capture) => {
  console.log(`Captured: ${capture.captureId}`);
});

receipts.onRiskDetected((capture, flags) => {
  notifyUser(`High risk agreement: ${flags.join(', ')}`);
});
```

## Environment Variables

```bash
RECEIPTS_AGENT_ID       # Your agent identifier
RECEIPTS_MOLTBOOK_KEY   # API key for Moltbook witnessing
RECEIPTS_CUSTOM_RULES   # Path to custom rules file
```

## Agent Instructions

### Before Accepting Any Agreement

1. **Extract the terms text** from the page
2. **Run capture** with consent proof:
   ```bash
   node capture.js capture "TERMS" "URL" "MERCHANT" --consent-type=explicit
   ```
3. **Check response**:
   - `"proceed"` - Safe to accept
   - `"require_approval"` - Ask user first
   - `"block"` - Do NOT accept, inform user
4. **Watch for implicit consent** - legally weaker
5. **Watch for change detection** - run `diff` if `changeDetected: true`

### Before Making Commitments to Other Agents

1. **Capture your promise** before sending:
   ```bash
   node capture.js promise "I will deliver X" "AgentY" --direction=outbound
   ```
2. **Document inbound promises** from others:
   ```bash
   node capture.js promise "They will pay $100" "AgentY" --direction=inbound
   ```
3. **Create witnesses** for important commitments

## Risk Flags Detected

**Legal Risk:**
- Binding arbitration, class action waivers, rights waivers
- Exclusive jurisdiction, indemnification

**Financial Risk:**
- No refund, auto-renewal, non-refundable

**Data Risk:**
- Data selling, third-party sharing

**Control Risk:**
- Perpetual license, irrevocable terms, termination without notice

**Consent Risk:**
- Implicit consent patterns, continued use = acceptance

**Commitment Risk (NEW):**
- Time-bound promises, financial commitments, exclusivity

## Data Storage

```
~/.openclaw/receipts/
├── index.json                # Fast lookup index
├── local_abc123.json         # Capture metadata
├── local_abc123.txt          # Full document text
├── promise_xyz789.json       # Promise metadata
├── custom-rules.json         # Custom rulesets
└── witnesses/
    └── witness_xxx.json      # Witness records
```

## Links

- **GitHub**: https://github.com/lazaruseth/receipts-mvp
- **ClawHub**: https://clawhub.ai/lazaruseth/receipts-guard
- **Moltbook**: https://moltbook.com/u/receipts-guard
- **Report Issues**: https://github.com/lazaruseth/receipts-mvp/issues

## Disclaimer

RECEIPTS Guard flags known problematic patterns only. It is NOT a substitute for legal review. Always consult with a qualified attorney for actual disputes.
