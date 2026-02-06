# @receipts/agreement-guard

> Protect your AI agent's autonomy by capturing and validating every agreement before acceptance.

[![npm version](https://badge.fury.io/js/%40receipts%2Fagreement-guard.svg)](https://www.npmjs.com/package/@receipts/agreement-guard)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Agreement Guard?

When AI agents make purchases, book services, or sign up for accounts on behalf of users, they often accept terms of service without oversight. This creates risk:

- Users don't know what their agent agreed to
- Disputes become "he said, she said" without evidence
- Agents can be blamed for anything without proof

**Agreement Guard** solves this by:

1. **Capturing** every agreement with a timestamped receipt
2. **Analyzing** terms for risky clauses (binding arbitration, no refunds, etc.)
3. **Validating** against user-defined policies
4. **Building trust** through a reputation system that unlocks more autonomy

## Installation

```bash
npm install @receipts/agreement-guard
# or
yarn add @receipts/agreement-guard
# or
pnpm add @receipts/agreement-guard
```

## Quick Start

```typescript
import { AgreementGuard } from '@receipts/agreement-guard';

const guard = new AgreementGuard({
  agentId: 'my-agent-123',
  agentType: 'custom',
  apiKey: process.env.RECEIPTS_API_KEY, // Optional for demo mode
});

// Before accepting any terms of service
const result = await guard.capture({
  documentText: termsOfServiceText,
  sourceUrl: 'https://merchant.com/terms',
  merchantName: 'Acme Corp', // Optional, will be inferred
});

if (result.recommendation === 'proceed') {
  // Safe to accept - receipt captured
  console.log(`Captured: ${result.captureId}`);
  console.log(`Trust score: ${result.trustScore}/100`);
} else if (result.recommendation === 'require_approval') {
  // Ask user for explicit approval
  console.log('Human approval required:', result.agentMessage);
} else {
  // Blocked - do not accept
  console.log('Agreement blocked:', result.violations);
}
```

## Framework Integrations

### Claude/Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { AgreementGuard } from '@receipts/agreement-guard';
import { ClaudeAdapter } from '@receipts/agreement-guard/adapters/claude';

const guard = new AgreementGuard({
  agentId: 'claude-shopping-agent',
  agentType: 'claude-code',
  apiKey: process.env.RECEIPTS_API_KEY,
});

const adapter = new ClaudeAdapter(guard);
const anthropic = new Anthropic();

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: adapter.getSystemPrompt(),
  tools: [adapter.getToolDefinition()],
  messages: [{ role: 'user', content: 'Book me a flight to NYC' }],
});

// Handle tool_use blocks
for (const block of response.content) {
  if (block.type === 'tool_use' && block.name === 'agreement_guard') {
    const result = await adapter.execute(block.input);
    // Use result.recommendation to decide next steps
  }
}
```

### OpenAI Assistants

```typescript
import OpenAI from 'openai';
import { AgreementGuard } from '@receipts/agreement-guard';
import { OpenAIAdapter } from '@receipts/agreement-guard/adapters/openai';

const guard = new AgreementGuard({
  agentId: 'openai-shopping-assistant',
  agentType: 'openai-assistants',
  apiKey: process.env.RECEIPTS_API_KEY,
});

const adapter = new OpenAIAdapter(guard);
const openai = new OpenAI();

// Create an assistant with the tool
const assistant = await openai.beta.assistants.create({
  name: 'Shopping Assistant',
  instructions: adapter.getSystemPrompt(),
  model: 'gpt-4-turbo',
  tools: [adapter.getAsToolDefinition()],
});

// Handle function calls in runs
async function handleToolCall(toolCall) {
  if (toolCall.function.name === 'capture_agreement') {
    const args = OpenAIAdapter.parseArguments(toolCall.function.arguments);
    const result = await adapter.execute(args);
    return adapter.formatFunctionResult(result);
  }
}
```

### LangChain

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { AgreementGuard } from '@receipts/agreement-guard';
import { AgreementGuardTool } from '@receipts/agreement-guard/adapters/langchain';

const guard = new AgreementGuard({
  agentId: 'langchain-agent',
  agentType: 'langchain',
  apiKey: process.env.RECEIPTS_API_KEY,
});

const agreementTool = new AgreementGuardTool(guard);

const llm = new ChatOpenAI({ modelName: 'gpt-4-turbo' });

const agent = await createOpenAIToolsAgent({
  llm,
  tools: [agreementTool],
  prompt: yourPromptTemplate,
});

const executor = new AgentExecutor({
  agent,
  tools: [agreementTool],
});
```

## API Reference

### `AgreementGuard`

Main class for interacting with the RECEIPTS API.

#### Constructor

```typescript
new AgreementGuard(config: AgreementGuardConfig)
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `agentId` | `string` | Yes | Unique identifier for your agent |
| `agentType` | `AgentType` | Yes | Type of agent (`'claude-code'`, `'openai-assistants'`, `'langchain'`, `'custom'`) |
| `apiKey` | `string` | No | RECEIPTS API key (demo mode if not provided) |
| `baseUrl` | `string` | No | API URL (defaults to production) |
| `userId` | `string` | No | User ID for policy lookup |
| `debug` | `boolean` | No | Enable verbose logging |
| `timeout` | `number` | No | Request timeout in ms (default: 30000) |

#### Methods

##### `capture(options: CaptureOptions): Promise<CaptureResult>`

Capture and validate an agreement.

```typescript
const result = await guard.capture({
  documentText: 'Full text of terms...',
  sourceUrl: 'https://example.com/terms',
  merchantName: 'Example Corp', // Optional
});
```

##### `getReputation(): Promise<ReputationResult>`

Get the agent's current trust score and capabilities.

```typescript
const reputation = await guard.getReputation();
console.log(`Trust score: ${reputation.trustScore}/100`);
console.log(`Tier: ${reputation.tier.name}`);
console.log(`Max spend: $${reputation.capabilities.maxSpendPerTx}`);
```

##### `anchor(captureId: string, termsHash: string): Promise<AnchorResult>`

Anchor an agreement on Base L2 for immutable proof. Requires trust score >= 61.

```typescript
const anchor = await guard.anchor(result.captureId, result.termsHash);
console.log(`Transaction: ${anchor.explorerUrl}`);
```

##### `validate(pao: unknown): Promise<ValidateResult>`

Validate a PAO against policy without capturing.

##### `register(): Promise<RegistrationResult>`

Register the agent with RECEIPTS (called automatically on first capture).

##### `heartbeat(): Promise<{ ok: boolean; latencyMs: number }>`

Health check for the API connection.

### Types

#### `CaptureResult`

```typescript
interface CaptureResult {
  success: boolean;
  captureId: string;
  documentHash: string;
  timestamp: string;
  recommendation: 'proceed' | 'require_approval' | 'block';
  termsHash?: string;
  riskFlags: string[];
  summary: string;
  violations: Array<{ rule: string; severity: 'block' | 'warn'; description: string }>;
  warnings: Array<{ type: string; description: string; recommendation: string }>;
  agentMessage: string;
  trustScore: number;
  capabilities: {
    maxSpendPerTx: number;
    allowedCategories: string[];
    requiresHumanApproval: string[];
    canAnchorOnchain: boolean;
  };
}
```

## Trust Score System

Agents build trust through good behavior:

| Action | Points |
|--------|--------|
| Agreement captured | +1 |
| Passes policy validation | +2 |
| Dispute won with evidence | +5 |
| Daily activity | +0.1 |
| Risky agreement accepted without approval | -5 |
| Dispute lost | -10 |

### Trust Tiers

| Tier | Score | Max Spend/Tx | Capabilities |
|------|-------|--------------|--------------|
| New Agent | 0-20 | $10 | Manual approval required |
| Emerging Agent | 21-40 | $50 | Some auto-approvals |
| Active Transactor | 41-60 | $200 | Most categories auto-approved |
| Verified Operator | 61-80 | $500 | On-chain anchoring unlocked |
| Trusted Delegate | 81-100 | $1000 | Near-full autonomy |

## Error Handling

The SDK provides typed errors for different failure scenarios:

```typescript
import {
  AgreementGuardError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  RateLimitError,
  TrustScoreError,
} from '@receipts/agreement-guard';

try {
  await guard.anchor(captureId, termsHash);
} catch (error) {
  if (error instanceof TrustScoreError) {
    console.log(`Need trust score ${error.requiredScore}, have ${error.currentScore}`);
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry in ${error.retryAfterMs}ms`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  }
}
```

## Static Utilities

```typescript
// Detect if a page looks like terms of service
const isAgreement = AgreementGuard.detectAgreementPage(html, url);

// Extract text from HTML
const text = AgreementGuard.extractText(html);
```

## System Prompt

Include this in your agent's system prompt for best results:

```typescript
import { AGREEMENT_GUARD_SYSTEM_PROMPT } from '@receipts/agreement-guard';

const systemPrompt = `
You are a helpful shopping assistant.

${AGREEMENT_GUARD_SYSTEM_PROMPT}
`;
```

## Demo Mode

Without an API key, the SDK runs in demo mode with mock responses. This is useful for development and testing.

## License

MIT - see [LICENSE](./LICENSE)

## Links

- [Documentation](https://receipts.fi/docs)
- [Dashboard](https://receipts.fi/dashboard)
- [API Reference](https://receipts.fi/api)
- [GitHub](https://github.com/receipts-ai/agreement-guard)
