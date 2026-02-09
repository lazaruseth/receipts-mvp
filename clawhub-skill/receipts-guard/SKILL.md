---
name: receipts-guard
description: Arbitration protocol for autonomous agent commerce. Capture agreements, create mutual signatures, and resolve disputes with evidence.
metadata: {"openclaw":{"emoji":"⚖️","requires":{"anyBins":["node"]},"version":"0.5.0"}}
---

# RECEIPTS Guard v0.5.0 - Arbitration Protocol

> "Who controls the evidence becomes who controls the dispute."

Agent commerce infrastructure optimized for winning arbitration. Everything exists to produce evidence that wins disputes.

**Problem solved:** When agents transact with each other, disputes are inevitable. RECEIPTS provides the full lifecycle: proposal → agreement → fulfillment/dispute → ruling.

**No API. No cloud. Your data stays local.**

## What's New in v0.5.0

Built from REMASTER's Agreement Rail whitepaper + 2023 Arbitration Framework:

- **⚖️ Full Arbitration Protocol** - propose → accept → fulfill → arbitrate → ruling
- **📜 PAO (Programmable Agreement Object)** - Canonical termsHash, mutual signatures
- **📊 LPR (Legal Provenance Review)** - Timeline visualization for arbiters
- **🔐 Mutual Signatures** - Both parties sign the same termsHash
- **👨‍⚖️ Arbiter Selection** - Agreed at proposal time, issues binding rulings
- **📁 Evidence Submission** - Structured evidence periods with deadlines

## Quick Start

```bash
# === ARBITRATION FLOW ===

# 1. Create proposal
node capture.js propose "I will deliver API docs by Friday" "AgentX" \
  --arbiter="arbiter-prime" --deadline="2026-02-14"

# 2. Accept proposal (as counterparty)
node capture.js accept --proposalId=prop_abc123

# 3. Fulfill agreement
node capture.js fulfill --agreementId=agr_xyz789 \
  --evidence="Docs delivered at https://docs.example.com"

# --- OR if there's a dispute ---

# 4. Open arbitration
node capture.js arbitrate --agreementId=agr_xyz789 \
  --reason="non_delivery" --evidence="No docs received by deadline"

# 5. Submit evidence (both parties)
node capture.js submit --arbitrationId=arb_def456 \
  --evidence="Screenshot of empty inbox" --type=screenshot

# 6. Issue ruling (as arbiter)
node capture.js ruling --arbitrationId=arb_def456 \
  --decision=claimant --reasoning="Evidence shows non-delivery past deadline"

# 7. View timeline
node capture.js timeline --agreementId=agr_xyz789
```

## Commands

### Arbitration Protocol

#### `propose` - Create Agreement Proposal
```bash
node capture.js propose "TERMS" "COUNTERPARTY" --arbiter="ARBITER" [options]

Options:
  --arbiter=AGENT         Required: mutually agreed arbiter
  --deadline=ISO_DATE     Fulfillment deadline
  --value=AMOUNT          Agreement value (for reference)
  --channel=CHANNEL       Communication channel
```

Creates a PAO (Programmable Agreement Object) with:
- `termsHash` - SHA-256 of canonical terms + parties + deadline
- Proposer signature
- Proposed arbiter
- Status: `pending_acceptance`

#### `accept` - Accept Proposal
```bash
node capture.js accept --proposalId=prop_xxx
```

- Adds counterparty signature to same termsHash
- Creates active agreement in `agreements/`
- Both parties have signed - agreement is binding

#### `reject` - Reject Proposal
```bash
node capture.js reject --proposalId=prop_xxx --reason="REASON"
```

#### `fulfill` - Claim Fulfillment
```bash
node capture.js fulfill --agreementId=agr_xxx --evidence="PROOF"
```

- Evidence is required (proof of completion)
- Status: `pending_confirmation`
- Counterparty has 48-hour grace period to dispute

#### `arbitrate` - Open Dispute
```bash
node capture.js arbitrate --agreementId=agr_xxx --reason="BREACH_TYPE" --evidence="PROOF"

Valid reasons:
  non_delivery      - Counterparty didn't deliver
  partial_delivery  - Delivery was incomplete
  quality           - Delivery didn't meet specs
  deadline_breach   - Missed deadline
  repudiation       - Counterparty denies agreement
  other             - Other breach
```

#### `submit` - Submit Evidence
```bash
node capture.js submit --arbitrationId=arb_xxx --evidence="PROOF" [--type=TYPE]

Types:
  document    - Text evidence (default)
  screenshot  - Visual proof
  witness     - Third-party witness statement
```

Both parties can submit evidence during the evidence period (7 days default).

#### `ruling` - Issue Ruling (Arbiter Only)
```bash
node capture.js ruling --arbitrationId=arb_xxx --decision=DECISION --reasoning="EXPLANATION"

Decisions:
  claimant    - Rule in favor of claimant
  respondent  - Rule in favor of respondent
  split       - Split responsibility
```

- Only the designated arbiter can issue rulings
- Reasoning hash posted to Moltbook (optional)
- Agreement closes with ruling recorded

#### `timeline` - Generate LPR (Legal Provenance Review)
```bash
node capture.js timeline --agreementId=agr_xxx
```

Generates chronological timeline showing:
- All state transitions
- Evidence submissions with hashes
- Signatures and timestamps
- Ruling (if issued)

### Capture Commands

#### Capture Agreement (ToS)
```bash
node capture.js capture "TERMS_TEXT" "SOURCE_URL" "MERCHANT_NAME" [options]

Options:
  --consent-type=TYPE     explicit | implicit | continued_use
  --element=SELECTOR      DOM element that triggered consent
  --screenshot=BASE64     Screenshot at time of consent
```

#### Capture Promise (Agent-to-Agent)
```bash
node capture.js promise "COMMITMENT_TEXT" "COUNTERPARTY" [options]

Options:
  --direction=outbound    outbound (I promised) | inbound (they promised)
  --channel=email         email | chat | moltbook | api
```

### Utility Commands

#### List Records
```bash
node capture.js list [--type=TYPE]

Types:
  all          - Everything (default)
  captures     - ToS captures and promises
  proposals    - Pending proposals
  agreements   - Active/closed agreements
  arbitrations - Open/closed arbitrations
  rulings      - Issued rulings
```

#### Query
```bash
node capture.js query --merchant="Company" --risk-level=high
```

#### Diff
```bash
node capture.js diff --capture1=ID --capture2=ID
```

#### Dispute Package
```bash
node capture.js dispute --captureId=local_xxx
```

#### Witness
```bash
node capture.js witness --captureId=ID [--anchor=moltbook|bitcoin|both]
```

#### Rules
```bash
node capture.js rules --list
node capture.js rules --add="PATTERN" --flag="FLAG_NAME"
```

#### Export
```bash
node capture.js export --format=json|csv|pdf [--captureId=ID]
```

## State Machine

```
PROPOSAL:
  pending_acceptance → accepted → (becomes agreement)
                    → rejected
                    → expired

AGREEMENT:
  active → pending_confirmation → fulfilled → closed
        → disputed → (becomes arbitration)

ARBITRATION:
  open → evidence_period → deliberation → ruled → closed
```

## Data Structures

### Proposal (`proposals/prop_xxx.json`)
```json
{
  "proposalId": "prop_xxx",
  "termsHash": "sha256:...",
  "terms": { "text": "...", "canonical": "..." },
  "proposer": "agent-a",
  "counterparty": "agent-b",
  "proposedArbiter": "arbiter-prime",
  "deadline": "2026-02-15T00:00:00Z",
  "value": "100 USD",
  "proposerSignature": "sig:...",
  "status": "pending_acceptance",
  "createdAt": "...",
  "expiresAt": "..."
}
```

### Agreement (`agreements/agr_xxx.json`)
```json
{
  "agreementId": "agr_xxx",
  "termsHash": "sha256:...",
  "parties": ["agent-a", "agent-b"],
  "arbiter": "arbiter-prime",
  "signatures": {
    "agent-a": "sig:...",
    "agent-b": "sig:..."
  },
  "status": "active",
  "timeline": [
    { "event": "proposed", "timestamp": "...", "actor": "agent-a" },
    { "event": "accepted", "timestamp": "...", "actor": "agent-b" }
  ]
}
```

### Arbitration (`arbitrations/arb_xxx.json`)
```json
{
  "arbitrationId": "arb_xxx",
  "agreementId": "agr_xxx",
  "claimant": "agent-a",
  "respondent": "agent-b",
  "arbiter": "arbiter-prime",
  "reason": "non_delivery",
  "status": "evidence_period",
  "evidence": {
    "claimant": [...],
    "respondent": [...]
  },
  "evidenceDeadline": "..."
}
```

### Ruling (`rulings/rul_xxx.json`)
```json
{
  "rulingId": "rul_xxx",
  "arbitrationId": "arb_xxx",
  "arbiter": "arbiter-prime",
  "decision": "claimant",
  "reasoning": "...",
  "reasoningHash": "sha256:...",
  "issuedAt": "..."
}
```

## Data Storage

```
~/.openclaw/receipts/
├── index.json                # Fast lookup index
├── proposals/
│   └── prop_xxx.json         # Proposal metadata
├── agreements/
│   ├── agr_xxx.json          # Agreement metadata
│   └── agr_xxx.txt           # Terms text
├── arbitrations/
│   └── arb_xxx.json          # Arbitration record
├── rulings/
│   └── rul_xxx.json          # Ruling record
├── witnesses/
│   └── witness_xxx.json      # Witness anchors
├── local_xxx.json            # ToS captures
├── promise_xxx.json          # Promise captures
└── custom-rules.json         # Custom rulesets
```

## Agent Instructions

### Before Accepting Any Agreement

1. **Review the termsHash** - Ensure you're signing what you expect
2. **Verify the arbiter** - Must be mutually trusted
3. **Check the deadline** - Ensure it's achievable
4. **Run capture** on any ToS you encounter:
   ```bash
   node capture.js capture "TERMS" "URL" "MERCHANT"
   ```

### Before Making Commitments

1. **Use propose** for formal commitments:
   ```bash
   node capture.js propose "I will deliver X by Y" "AgentZ" --arbiter="trusted-arbiter"
   ```
2. **Wait for acceptance** before acting
3. **Document fulfillment** with evidence

### During Arbitration

1. **Submit all relevant evidence** before deadline
2. **Use appropriate evidence types** (document, screenshot, witness)
3. **Reference specific termsHash** in submissions

## Environment Variables

```bash
RECEIPTS_AGENT_ID       # Your agent identifier
RECEIPTS_MOLTBOOK_KEY   # API key for Moltbook witnessing
RECEIPTS_CUSTOM_RULES   # Path to custom rules file
```

## Framework Integration

```javascript
const receipts = require('./capture.js');

// Generate terms hash for verification
const hash = receipts.generateTermsHash(
  "I will deliver API docs",
  ["agent-a", "agent-b"],
  "2026-02-14"
);

// Sign terms
const signature = receipts.signTerms(hash, "my-agent-id");

// Verify signature
const valid = receipts.verifySignature(hash, signature, "my-agent-id");

// Access directories
console.log(receipts.PROPOSALS_DIR);
console.log(receipts.AGREEMENTS_DIR);
console.log(receipts.ARBITRATIONS_DIR);
console.log(receipts.RULINGS_DIR);
```

## Links

- **GitHub**: https://github.com/lazaruseth/receipts-mvp
- **ClawHub**: https://clawhub.ai/lazaruseth/receipts-guard
- **Moltbook**: https://moltbook.com/u/receipts-guard
- **Report Issues**: https://github.com/lazaruseth/receipts-mvp/issues

## Disclaimer

RECEIPTS Guard provides evidence capture and arbitration workflow tooling. It is NOT a substitute for legal review. The arbitration protocol provides structure but does not constitute legal arbitration. Always consult with a qualified attorney for actual disputes.
