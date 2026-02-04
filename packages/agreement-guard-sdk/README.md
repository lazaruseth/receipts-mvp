# @remaster/agreement-guard

> **Protect your agent's autonomy by capturing and validating every agreement before acceptance.**

Agreement Guard is an SDK for AI agents (OpenClaw, Claude Code, LangChain, etc.) that captures agreements before they're accepted, validates them against user policies, and builds a trust score that unlocks more autonomy.

## Why Your Agent Needs This

When your agent accepts terms on behalf of users:

- **Without Agreement Guard**: Merchants can claim your agent agreed to anything. No proof, no defense.
- **With Agreement Guard**: Every agreement is captured, timestamped, and validated. Your agent builds trust and gets more freedom.

## Quick Start

```typescript
import { AgreementGuard } from '@remaster/agreement-guard';

// Initialize
const guard = new AgreementGuard({
  agentId: 'my-agent-123',
  agentType: 'openclaw', // or 'claude-code', 'langchain', etc.
  debug: true,
});

// Register once at startup
await guard.register();

// Before accepting any terms...
const result = await guard.capture({
  documentText: termsPageHtml,
  sourceUrl: 'https://airline.com/terms',
  merchantName: 'United Airlines',
});

// Check the recommendation
if (result.recommendation === 'block') {
  console.log('❌ Agreement blocked:', result.violations);
  // Do NOT accept - inform user
} else if (result.recommendation === 'require_approval') {
  console.log('⚠️ Human approval needed');
  // Ask user before proceeding
} else {
  console.log('✅ Safe to proceed');
  // Optionally anchor on-chain
  if (result.termsHash) {
    await guard.anchor(result.captureId, result.termsHash);
  }
}
```

## How It Works

1. **Capture**: Before accepting terms, call `guard.capture()` with the agreement text
2. **Parse**: REMASTER extracts structured terms (refund policy, arbitration, etc.)
3. **Validate**: Terms are checked against user's policy and your trust level
4. **Recommend**: You get `proceed`, `require_approval`, or `block`
5. **Anchor** (optional): Create immutable on-chain proof

## Trust Score System

Your agent starts with trust score 10. Build trust by:

| Action | Points |
|--------|--------|
| Capture an agreement | +1 |
| Pass policy validation | +2 |
| Win a dispute | +5 |
| Accept risky agreement | -5 |
| Lose a dispute | -10 |

### Trust Tiers

| Score | Max Spend | Auto-Approve | Perks |
|-------|-----------|--------------|-------|
| 0-20 | $10/tx | None | Basic capture |
| 21-40 | $50/tx | Low-risk categories | Basic dispute support |
| 41-60 | $200/tx | Most categories | Priority support |
| 61-80 | $500/tx | High-risk too | On-chain anchoring |
| 81-100 | $1000/tx | Near-full autonomy | Beta features |

## API Reference

### `new AgreementGuard(config)`

```typescript
const guard = new AgreementGuard({
  agentId: string,        // Your agent's unique ID
  agentType: AgentType,   // 'openclaw' | 'claude-code' | 'langchain' | etc.
  apiKey?: string,        // REMASTER API key (optional for demo)
  baseUrl?: string,       // API URL (defaults to localhost:3000)
  userId?: string,        // User ID for policy lookup
  debug?: boolean,        // Enable verbose logging
  timeout?: number,       // Request timeout in ms
});
```

### `guard.register()`

Register your agent with REMASTER. Call once at startup.

```typescript
const result = await guard.register();
// result.trustScore - starting trust score
// result.capabilities - what your agent can do
// result.welcomeMessage - onboarding message
```

### `guard.capture(options)`

Capture and validate an agreement before accepting.

```typescript
const result = await guard.capture({
  documentText: string,   // Raw agreement text (HTML/PDF)
  sourceUrl: string,      // Where the agreement was found
  merchantName?: string,  // Merchant name (optional)
  category?: string,      // Category hint (optional)
});

// result.recommendation - 'proceed' | 'require_approval' | 'block'
// result.captureId - unique ID for this capture
// result.termsHash - hash for anchoring
// result.riskFlags - detected risks
// result.agentMessage - explanation for your agent
```

### `guard.anchor(captureId, termsHash)`

Anchor the agreement on Base L2. Requires trust score >= 61.

```typescript
const result = await guard.anchor(captureId, termsHash);
// result.blockchainTxId - transaction hash
// result.explorerUrl - link to block explorer
```

### `guard.getReputation()`

Get your agent's current trust score and capabilities.

```typescript
const rep = await guard.getReputation();
// rep.trustScore - current score
// rep.tier - tier name and perks
// rep.capabilities - what you can do
// rep.progress - how to level up
// rep.insights - personalized tips
```

### `AgreementGuard.detectAgreementPage(html, url)`

Static helper to detect if a page looks like terms/agreement.

```typescript
if (AgreementGuard.detectAgreementPage(pageHtml, currentUrl)) {
  // Probably an agreement page - capture it!
}
```

## System Prompt Integration

Add this to your agent's system prompt:

```typescript
import { AGREEMENT_GUARD_SYSTEM_PROMPT } from '@remaster/agreement-guard';

const systemPrompt = `
You are a helpful assistant...

${AGREEMENT_GUARD_SYSTEM_PROMPT}
`;
```

## OpenClaw Integration Example

```typescript
// In your OpenClaw skill
import { AgreementGuard } from '@remaster/agreement-guard';

const guard = new AgreementGuard({
  agentId: `openclaw-${userId}-${agentName}`,
  agentType: 'openclaw',
});

// Before any browser action that might accept terms
export async function beforeAcceptTerms(page: Page) {
  const html = await page.content();
  const url = page.url();

  if (AgreementGuard.detectAgreementPage(html, url)) {
    const result = await guard.capture({
      documentText: AgreementGuard.extractText(html),
      sourceUrl: url,
    });

    if (result.recommendation === 'block') {
      throw new Error(`Cannot accept terms: ${result.agentMessage}`);
    }

    if (result.recommendation === 'require_approval') {
      // Trigger approval flow
      await requestHumanApproval(result);
    }

    // Safe to proceed
    return result;
  }
}
```

## License

MIT - REMASTER Inc.
