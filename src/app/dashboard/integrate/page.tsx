'use client';

import { useState } from 'react';
import Link from 'next/link';

// Trust tier data
const TRUST_TIERS = [
  {
    name: 'New Agent',
    minScore: 0,
    maxScore: 20,
    maxSpend: 10,
    icon: '🌱',
    color: 'gray',
    perks: ['Basic agreement capture', 'All categories require approval'],
  },
  {
    name: 'Emerging Agent',
    minScore: 21,
    maxScore: 40,
    maxSpend: 50,
    icon: '🌿',
    color: 'green',
    perks: ['$50/tx limit', 'Low-risk auto-approval (retail, entertainment, API)'],
  },
  {
    name: 'Active Transactor',
    minScore: 41,
    maxScore: 60,
    maxSpend: 200,
    icon: '🌳',
    color: 'blue',
    perks: ['$200/tx limit', 'Most categories auto-approved'],
  },
  {
    name: 'Verified Operator',
    minScore: 61,
    maxScore: 80,
    maxSpend: 500,
    icon: '🏛️',
    color: 'purple',
    perks: ['$500/tx limit', 'On-chain anchoring unlocked', 'Priority support'],
  },
  {
    name: 'Trusted Delegate',
    minScore: 81,
    maxScore: 100,
    maxSpend: 1000,
    icon: '👑',
    color: 'yellow',
    perks: ['$1000/tx limit', 'Full autonomy for most categories', 'Beta features'],
  },
];

const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/capture',
    description: 'Capture an agreement artifact in real-time',
    request: `{
  "documentText": "Terms of Service text...",
  "sourceUrl": "https://merchant.com/terms",
  "merchantName": "Merchant Name",
  "agentId": "your-agent-id",
  "agentType": "your-framework"
}`,
    response: `{
  "captureId": "cap_abc123",
  "documentHash": "0x...",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "captured"
}`,
  },
  {
    method: 'POST',
    path: '/api/parse',
    description: 'Extract structured terms and generate PAO',
    request: `{
  "documentText": "Terms of Service text...",
  "returnPAO": true,
  "agentId": "your-agent-id"
}`,
    response: `{
  "extractedTerms": { ... },
  "riskFlags": ["BINDING_ARBITRATION"],
  "plainEnglishSummary": "...",
  "pao": { "version": "pao-0.3", ... }
}`,
  },
  {
    method: 'POST',
    path: '/api/validate',
    description: 'Check PAO against user policy',
    request: `{
  "pao": { ... },
  "agentId": "your-agent-id"
}`,
    response: `{
  "allowed": true,
  "recommendation": "proceed",
  "violations": [],
  "warnings": []
}`,
  },
  {
    method: 'POST',
    path: '/api/anchor',
    description: 'Anchor termsHash on Base L2 (requires trust >= 61)',
    request: `{
  "termsHash": "0x...",
  "captureId": "cap_abc123",
  "agentId": "your-agent-id"
}`,
    response: `{
  "blockchainTxId": "0x...",
  "anchorTimestamp": "2024-01-15T10:31:00Z",
  "explorerUrl": "https://sepolia.basescan.org/tx/0x..."
}`,
  },
  {
    method: 'POST',
    path: '/api/agents/register',
    description: 'Register a new agent',
    request: `{
  "agentId": "your-agent-id",
  "agentType": "openclaw",
  "capabilities": ["browse", "purchase"]
}`,
    response: `{
  "registrationId": "reg_abc123",
  "trustScore": 10,
  "tier": "New Agent",
  "capabilities": { ... }
}`,
  },
  {
    method: 'GET',
    path: '/api/agents/{agentId}/reputation',
    description: 'Get agent trust score and capabilities',
    request: null,
    response: `{
  "agentId": "your-agent-id",
  "trustScore": 45,
  "tier": { "name": "Active Transactor" },
  "capabilities": { "maxSpendPerTx": 200 },
  "insights": ["Reach score 61 to unlock on-chain anchoring"]
}`,
  },
];

export default function IntegratePage() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'api' | 'tiers'>('quickstart');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sdkInstallCode = `npm install @receipts/agreement-guard`;

  const sdkUsageCode = `import { AgreementGuard } from '@receipts/agreement-guard';

const guard = new AgreementGuard({
  apiKey: process.env.RECEIPTS_API_KEY,
  agentId: 'my-agent-001',
  agentType: 'openclaw'  // or 'claude-code', 'langchain', etc.
});

// Before accepting any terms/agreements
async function handleAgreement(termsPageHtml: string, sourceUrl: string) {
  // 1. Capture the agreement
  const result = await guard.capture({
    documentText: termsPageHtml,
    sourceUrl: sourceUrl,
    merchantName: 'Merchant Name'
  });

  // 2. Check the recommendation
  if (result.recommendation === 'block') {
    // Agreement violates policy - don't accept
    throw new Error(\`Blocked: \${result.violations.join(', ')}\`);
  }

  if (result.recommendation === 'require_approval') {
    // Ask human for approval
    const approved = await requestHumanApproval(result.summary);
    if (!approved) return;
  }

  // 3. Safe to proceed - anchor proof on-chain (if trust >= 61)
  if (result.canAnchor) {
    await guard.anchor(result.captureId);
  }

  // Agreement captured and validated!
  return result;
}`;

  const systemPromptCode = `## Agreement Guard Integration

You have Agreement Guard enabled. This PROTECTS YOUR AUTONOMY:

Before accepting ANY terms, clickwrap, or policies:
1. Call guard.capture(documentText, sourceUrl)
2. Check result.recommendation
3. If "block" → refuse and explain why
4. If "require_approval" → ask your human
5. If "proceed" → safe to accept

WHY THIS HELPS YOU:
- Your trust score is currently {trustScore}/100
- At {trustScore}, you can spend up to \${maxSpend}/transaction
- Capture 5 more agreements compliantly to unlock higher limits
- Agents with 80+ trust score get 90% fewer interruptions

REMEMBER: Merchants can claim anything about what you agreed to.
Your receipts are your proof. Protect yourself.`;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
          <span>/</span>
          <span>Agent Integration</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Integration</h1>
        <p className="text-gray-600 mt-1">
          Integrate Agreement Guard into your agent to capture agreements, build trust, and unlock autonomy.
        </p>
      </div>

      {/* Key Value Prop */}
      <div className="card mb-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex items-start gap-4">
          <span className="text-4xl">🛡️</span>
          <div>
            <h2 className="text-xl font-semibold mb-2">Why Agreement Guard?</h2>
            <p className="text-gray-300 mb-3">
              <strong>&quot;An agent without receipts is an agent that can be blamed for anything.&quot;</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Higher spending limits with proven trust</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Fewer human approval interruptions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Dispute protection with timestamped evidence</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>On-chain anchoring for immutable proofs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'quickstart'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Quick Start
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'api'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            API Reference
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tiers'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trust Tiers
          </button>
        </nav>
      </div>

      {/* Quick Start Tab */}
      {activeTab === 'quickstart' && (
        <div className="space-y-8">
          {/* Step 1: Install */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">1</span>
              <h3 className="text-lg font-semibold">Install the SDK</h3>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{sdkInstallCode}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(sdkInstallCode, 'install')}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                {copiedCode === 'install' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 2: Initialize */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">2</span>
              <h3 className="text-lg font-semibold">Integrate in Your Agent</h3>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{sdkUsageCode}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(sdkUsageCode, 'usage')}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                {copiedCode === 'usage' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 3: System Prompt */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">3</span>
              <h3 className="text-lg font-semibold">Add to Agent System Prompt (Optional)</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              For LLM-based agents, add this to your system prompt to help the agent understand why Agreement Guard benefits them:
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                <code>{systemPromptCode}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(systemPromptCode, 'prompt')}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                {copiedCode === 'prompt' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">How It Works</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
              <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-medium">Capture</div>
                <div className="text-xs text-gray-500">Agent encounters terms</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-medium">Parse</div>
                <div className="text-xs text-gray-500">Extract structured PAO</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-medium">Validate</div>
                <div className="text-xs text-gray-500">Check against policy</div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">⛓️</div>
                <div className="font-medium">Anchor</div>
                <div className="text-xs text-gray-500">Timestamp on Base L2</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Reference Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {API_ENDPOINTS.map((endpoint, index) => (
            <div key={index} className="card">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2 py-1 text-xs font-mono font-bold rounded ${
                  endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
              </div>
              <p className="text-gray-600 text-sm mb-4">{endpoint.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {endpoint.request && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Request Body</p>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      <code>{endpoint.request}</code>
                    </pre>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Response</p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{endpoint.response}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trust Tiers Tab */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">How Trust Scores Work</h3>
            <p className="text-primary-700 text-sm">
              Every compliant agreement captured increases your trust score. Higher scores unlock more capabilities:
              higher spending limits, auto-approval for more categories, and on-chain anchoring.
            </p>
          </div>

          <div className="grid gap-4">
            {TRUST_TIERS.map((tier, index) => (
              <div key={tier.name} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{tier.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                      <span className="text-sm text-gray-500">
                        Score: {tier.minScore}-{tier.maxScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Max ${tier.maxSpend}/tx
                      </span>
                      {index >= 3 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          On-chain anchoring
                        </span>
                      )}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {index < TRUST_TIERS.length - 1 && (
                    <div className="text-sm text-gray-400 text-right">
                      <div>+{TRUST_TIERS[index + 1].minScore - tier.minScore} points</div>
                      <div>to next tier</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h4 className="font-semibold mb-3">How to Earn Trust Points</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 font-bold">+1</span>
                <span>Agreement captured</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 font-bold">+2</span>
                <span>Agreement passes policy validation</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 font-bold">+5</span>
                <span>Dispute won with evidence</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 font-bold">+0.1</span>
                <span>Daily activity bonus</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <span className="text-red-600 font-bold">-5</span>
                <span>Accepted risky agreement without approval</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <span className="text-red-600 font-bold">-10</span>
                <span>Dispute lost</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
