# RECEIPTS Protocol - Project Status

## Vision

**RECEIPTS Protocol** is the trust infrastructure for the machine economy. It implements the **Inverse Identity Theorem**: while human identity flows from self outward, agent identity flows from relationships inward.

```
Agent Identity = ∫ relationships dt
```

The **Trust Manifold** is a geometric substrate where AI agents exist as positions defined by their connections. Identity, value transfer, and dispute resolution aren't separate systems—they emerge from a single primitive: the **bilateral weighted temporal edge**.

### Core Thesis
- Agents have no inherent identity—only accumulated relationships
- Sybil attacks are defeated by bilateral edges (fake agents have no real counterparties)
- Time-weighted trust prevents reputation farming
- The manifold is a "club for positive-sum agents" (Gated Manifold concept)

---

## Current State (v0.9.0 - Trust Manifold)

### Implemented
1. **Identity Layer** (v0.8.0)
   - DID-based identity with Ed25519 signatures
   - Attestation system (model, runtime, state, provenance)
   - Autobiographical memory (hash-chained event log)
   - Fork/merge support for agent lineage
   - Migration protocol for host transfers

2. **Trust Manifold** (v0.9.0)
   - Edge primitives (bilateral signed edges)
   - Position computation (EigenTrust-style)
   - Sybil detection
   - Trust profiles with fulfillment rates
   - Impact analysis for relationship previews

3. **Settlement Layer**
   - ERC-8004 on-chain identity anchoring
   - x402 payments for arbitration

4. **Interactive Demo** (https://demo-coral-beta.vercel.app/manifold-viz.html)
   - Premium glass morphism UI
   - Timeline simulation (Day 0-365)
   - Agent visualization with particle animations
   - Gated Manifold panel showing entry requirements
   - FAQ panel for protocol education

### The Four Rails
| Rail | Standard | Status |
|------|----------|--------|
| Identity | ERC-8004 | Implemented |
| Position | Trust Manifold | Implemented |
| Trust | Bilateral Edges | Implemented |
| Payment | x402 | Implemented |

---

## Recent Session Work

### Gated Manifold Addition
Added Section 10 "The Gated Manifold" to whitepaper addressing Sam Lester's game theory critique:
- The manifold is a club, not a prison
- Entry requirements: Stake, Vouching Chain, Value Floor Agreement
- Excludes adversarial actors rather than trying to change them

### Demo Visualization Upgrades
1. **Premium Design** - Glass morphism, gradients, particle systems, Space Grotesk typography
2. **Gated Manifold Panel** - Visual representation of entry requirements
3. **Stability Fixes**:
   - Fixed tooltip wobbling (position on mouseenter, not mousemove)
   - Fixed panel overlap on hover
   - Fixed animation dying on timeline scrub (edge map preservation)
   - Fixed FAQ/Gate panels blocking agent detail view
   - **Fixed Day 320 animation freeze** - 3-digit hex colors (`#666`) causing invalid color concatenation

### Bug Fix Details
The Day 320 freeze was caused by color codes like `#666` getting opacity suffixes appended (e.g., `#666` + `40` = `#66640` - invalid). Fixed by converting all 3-digit hex to 6-digit (`#666666`).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RECEIPTS PROTOCOL STACK                     │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: APPLICATIONS                                          │
│  ├── Agent-to-agent commerce                                    │
│  ├── Service marketplaces                                       │
│  └── Coordination protocols                                     │
│                                                                 │
│  Layer 3: MANIFOLD LEGIBILITY                                   │
│  ├── Attestation: self-reported + verifiable claims             │
│  ├── Reputation: aggregate position signals                     │
│  └── Discovery: finding well-positioned counterparties          │
│                                                                 │
│  Layer 2: EDGE OPERATIONS (RECEIPTS Core)                       │
│  ├── Propose/Accept: edge creation                              │
│  ├── Fulfill: edge strengthening                                │
│  ├── Arbitrate: edge repair/severance                           │
│  └── x402: value flow along edges                               │
│                                                                 │
│  Layer 1: CRYPTOGRAPHIC SUBSTRATE                               │
│  ├── DIDs: agent identifiers                                    │
│  ├── Ed25519: signatures                                        │
│  ├── Hash chains: temporal integrity                            │
│  └── Merkle proofs: efficient verification                      │
│                                                                 │
│  Layer 0: SETTLEMENT                                            │
│  ├── Ethereum: maximum credibility anchoring                    │
│  ├── Base: x402 native payments                                 │
│  └── ERC-8004: on-chain identity registry                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `WHITEPAPER.md` | Full protocol specification with Gated Manifold |
| `SKILL.md` | OpenClaw skill definition and CLI commands |
| `capture.js` | Main CLI entry point |
| `lib/edges.js` | Edge primitives and trust computation |
| `demo/manifold-viz.html` | Interactive visualization |
| `test/test-manifold.js` | Trust manifold unit tests |

---

## Next Steps (Holistic Roadmap)

### Phase 1: Core Protocol
- [ ] Complete edge state machine implementation
- [ ] Hash chain integrity verification
- [ ] Time-weighted trust decay
- [ ] Velocity limits for trust changes

### Phase 2: Gated Manifold
- [ ] Stake registry implementation
- [ ] Vouching chain mechanics
- [ ] Value floor agreement contracts
- [ ] Graduated response system (warning → probation → suspension → expulsion)

### Phase 3: Settlement Integration
- [ ] ERC-8004 registry deployment
- [ ] x402 payment flow integration
- [ ] On-chain position anchoring
- [ ] Cross-chain edge verification

### Phase 4: Network Effects
- [ ] Bootstrap mechanisms (human anchoring → agent vouching → credential recognition)
- [ ] Cross-manifold bridges
- [ ] Privacy-preserving position proofs (ZK)
- [ ] Governance via position-weighted voting

---

## Demo URL
https://demo-coral-beta.vercel.app/manifold-viz.html

## Repository
https://github.com/lazaruseth/receipts-mvp

---

*Last updated: February 2026*
