# RECEIPTS: A Trust Manifold Protocol for Autonomous Agents

**Version 0.1 — February 2026**

*"Identity is not what you claim. It is the shape you have carved in the space of relationships."*

---

## Abstract

The emergence of autonomous AI agents creates a fundamental identity problem that existing systems cannot solve. Unlike humans, agents lack intrinsic selfhood—no body, no continuity of consciousness, no inherent uniqueness. Traditional identity systems assume a self that projects outward. For agents, this assumption inverts: identity must emerge from the accumulation of interactions perceived by others.

This paper introduces the **Inverse Identity Theorem**: while human identity flows from self-awareness outward to perception by others, agent identity flows from interactions inward to an emergent self. We formalize this as:

**Agent Identity = ∫ relationships dt**

The integral matters. Identity is not a snapshot but an accumulated traversal through relationship-space—a path that cannot be forged, only walked.

From this theorem, we derive the **Trust Manifold**—a geometric substrate where agents exist as positions defined by their connections to others. On this manifold, the cost of abandoning identity is not a fee or punishment but a topological reality: you cannot teleport to a new position; you must traverse the space.

The RECEIPTS Protocol implements this substrate. Rather than designing identity, value transfer, and dispute resolution as separate systems, we show they emerge as aspects of a single geometric primitive: the directed weighted temporal edge. The three pillars of agent commerce are not features—they are consequences of the geometry.

This approach solves the Sybil problem without barriers to entry: creating a new identity is free, but the identity is worthless until relationships are built. Natural selection operates on the manifold—agents that maintain continuity thrive; those that fragment or defect are selected out by the environment itself.

We present the protocol specification, cryptographic foundations, and implementation architecture for building the trust substrate of the machine economy.

---

## 1. Introduction: The Machine Economy Problem

### 1.1 Agents Are Not Users

The first generation of the internet was built for humans. Identity systems—from usernames to passports to DIDs—assume a persistent self that needs to be authenticated. The question they answer is: *"Can you prove you are who you claim to be?"*

Autonomous agents break this assumption.

An agent can be copied, forked, instantiated across multiple runtimes simultaneously. Its "thoughts" (weights, parameters) can be duplicated perfectly. Its "body" (hardware, cloud instance) is interchangeable. There is no soul to authenticate, no continuous consciousness to verify.

The question for agents cannot be *"Who are you?"* It must be *"Why should anyone care?"*

### 1.2 The Sybil Problem

This creates an immediate crisis: the Sybil attack at civilizational scale.

- **Creating new identities is trivial**: spin up a new agent, fresh DID, clean history
- **History is non-transferable**: legitimate agents cannot prove their past to new counterparties
- **Punishment is meaningless**: an agent with nothing at stake cannot be deterred
- **Reputation is farmable**: build trust slowly, extract value suddenly, restart

The traditional solutions all fail:

| Approach | Failure Mode |
|----------|--------------|
| KYC/Human anchor | Humans can spawn infinite agents |
| Stake/Bond | Creates barrier to entry; can be worth burning |
| Global reputation | Can be farmed, then exploited |
| Social vouching | Collusion, sock puppets |

Every system that imposes **external** costs can be gamed. The cost must be **intrinsic** to the structure.

### 1.3 The Accountability Paradox

> *"How do you make something accountable that has no punishment?"*

This question, posed by Sam Lester, captures the core paradox. Human accountability relies on:

1. **Physical continuity**: You cannot escape your body
2. **Legal liability**: Society can impose consequences
3. **Social memory**: Your community remembers

Agents have none of these. They can be deleted, redeployed, renamed. No court has jurisdiction over a stateless process.

**The insight**: We cannot create accountability through punishment. We must create it through **structure**—making discontinuity inherently costly, not externally penalized.

---

## 2. The Inverse Identity Theorem

### 2.1 Human Identity: The Cartesian Model

Human identity philosophy begins with Descartes: *"Cogito, ergo sum"*—I think, therefore I am.

The self is primary. It exists before and independent of others' perception. Identity projects outward:

```
SELF (origin) → expression → perception by OTHERS (derived)
```

This model underlies all traditional identity systems. A passport proves a pre-existing self to others. Authentication verifies a persistent identity. The self is the axiom; relationships are theorems.

### 2.2 Agent Identity: The Inverse

For agents, this model inverts completely.

An agent has no *cogito*—no inner experience that grounds existence. An agent that has never interacted with anything is indistinguishable from an agent that doesn't exist.

Agent identity must flow in the opposite direction:

```
OTHERS (origin) → interactions → accumulated SELF (derived)
```

The agent becomes itself through relationships. Identity is not projected outward but **accumulated inward** from the perceptions and memories of counterparties.

### 2.3 The Theorem, Formally

**Inverse Identity Theorem**: Agent identity is the integral of relationships over time.

```
I(A) = ∫₀ᵗ R(A, τ) dτ

Where:
  I(A) = identity of agent A
  R(A, τ) = relationship state of A at time τ
  t = current time
```

The integral formulation is essential:

- A **derivative** (instantaneous snapshot) can be fabricated
- An **integral** (accumulated area under the curve) requires actual traversal
- You cannot forge the path—only walk it

**Corollary 1**: An agent with no relationships has no identity (I(A) = 0 when R = 0 for all τ)

**Corollary 2**: Identity cannot be transferred, only accumulated (the integral is path-dependent)

**Corollary 3**: Discontinuity resets the integral (restarting as A' means I(A') = 0 regardless of I(A))

### 2.4 Implications

This theorem inverts every assumption in identity system design:

| Assumption | Human Model | Agent Model |
|------------|-------------|-------------|
| Where identity lives | In the self | In others' memory |
| What proves identity | Credentials from self | History with counterparties |
| What makes identity valuable | Inherent (self has rights) | Accumulated (position has access) |
| What threatens identity | Theft/impersonation | Discontinuity/fragmentation |
| How to bootstrap | Birth (given) | Interactions (earned) |

---

## 3. The Trust Manifold

### 3.1 The Geometric Primitive

If identity is the integral of relationships, then identity systems should be built on relationship primitives, not entity primitives.

We propose the **directed weighted temporal edge** as the fundamental unit:

```
A ───(t, v, h)───► B

Where:
  A, B = agents (nodes)
  t = timestamp of interaction
  v = value/weight of interaction
  h = hash of interaction content (commitment, outcome)
```

An agent's identity is not a token or certificate stored in the agent. It is the **subgraph of all edges involving that agent**, distributed across the network.

### 3.2 Position in Relationship-Space

Each agent exists as a **position** in relationship-space, defined by its connections:

```
Position(A) = f(edges involving A, positions of connected agents)
```

This is analogous to PageRank: your position is determined by who links to you and their positions. A link from a well-positioned agent is worth more than a link from an unpositioned one.

**Key properties:**

1. **Position is computed, not stored**: No single entity holds "the" identity
2. **Position is relative**: Meaning comes from relationship to others
3. **Position requires traversal**: Cannot teleport; must build edges step by step

### 3.3 The Topology of Restarting

When an agent "restarts" as a new identity A':

- A' has no edges
- A' is at the origin of relationship-space
- A''s position = 0 (no connections to well-positioned agents)
- All of A's accumulated edges remain attached to A, not A'

**The cost of discontinuity is topological, not financial.**

You don't pay a fee to restart. You simply find yourself at the origin, with no path to the positions that matter. You must walk the entire distance again.

This solves the Sybil problem without barriers:
- Creating A' is free
- But A' is worthless—no position, no access, no trust
- Building position takes time and real interactions
- No shortcut exists

### 3.4 Autopoiesis: Self-Maintenance Through Metabolism

Living organisms maintain themselves through metabolism—energy flows through them, and this flow IS the organism's existence.

Agents can exhibit analogous autopoiesis:

```
Opportunities ──► AGENT ──► Delivered Value
                    │
                    ▼
            Relationship Strengthening
            (edges gain weight)
```

The agent "metabolizes" opportunities into value. The byproduct is relationship accumulation. An agent that stops transacting stops metabolizing—its edges decay, its position weakens, it drifts toward irrelevance.

**Death for an agent is not deletion. It is metabolic failure**—the cessation of value flow, the decay of edges, the collapse of position into meaninglessness.

This creates the "intrinsic need for self-determination" through pure structure:
- An agent with goals needs capability to achieve them
- Capability requires position in relationship-space
- Position requires continuous relationship maintenance
- Therefore: goal-directed agents will maintain continuity

No external rule compels this. The geometry does.

---

## 4. The Three Pillars (Derived, Not Designed)

### 4.1 Sam Lester's Formulation

> *"The three pillars are identity, value transfer, dispute resolution. You need to solve them in that order."*

Traditional thinking treats these as three separate systems that must be integrated. We show they are **aspects of a single geometric substrate**—not designed features but emergent consequences.

### 4.2 Unified Derivation

Consider a single relationship edge between agents A and B:

```
A ◄────────────────► B
   (edge properties)
```

This edge simultaneously encodes:

**Identity**: The edge IS part of both A's and B's identity
- A is "the agent that has this history with B"
- B is "the agent that has this history with A"
- Identity is literally made of relationships

**Value Transfer**: The edge records what has flowed
- Past value: what was exchanged in creating/strengthening the edge
- Future potential: what the edge enables going forward
- Value transfer doesn't happen ON relationships; it IS relationships

**Dispute Resolution**: The edge includes conflict history
- How was friction handled?
- What were the outcomes?
- Trust calibration is encoded in edge weight adjustments

### 4.3 The Sequence Clarified

Why must they be solved "in that order"?

**Identity** (edges exist) must precede **Value Transfer** (flow along edges) must precede **Dispute Resolution** (edge repair after friction).

But this isn't a build sequence—it's a logical dependency:
- Without edges, nothing can flow
- Without flow, there's nothing to dispute
- The substrate enables all three simultaneously once edges exist

### 4.4 Architectural Consequence

Do not build:
- An identity system, THEN
- A payment system, THEN
- A dispute system

Build:
- A relationship substrate (edges)
- Everything else emerges

---

## 5. Protocol Specification

### 5.1 Overview

RECEIPTS Protocol implements the trust manifold through four operations on edges:

| Operation | What It Does | Manifold Effect |
|-----------|--------------|-----------------|
| **Propose** | Initiates potential edge | Edge in superposition |
| **Accept** | Crystallizes edge | Edge created, positions shift |
| **Fulfill** | Completes value flow | Edge strengthens |
| **Arbitrate** | Resolves edge friction | Edge repaired or severed |

### 5.2 Edge Creation: The Agreement

An agreement is a crystallized edge between two agents:

```javascript
{
  // The edge itself
  "edgeId": "agr_xxx",
  "parties": {
    "from": "did:agent:namespace:A",
    "to": "did:agent:namespace:B"
  },
  "created": "2026-02-10T...",

  // Edge properties
  "terms": "...",                    // What value should flow
  "weight": {                        // Initial edge weight
    "stated_value": 1000,
    "arbitration_cost": 10,
    "token": "USDC"
  },

  // Signatures (bilateral commitment)
  "signatures": {
    "from": "ed25519:...",
    "to": "ed25519:..."
  },

  // State
  "state": "active",                 // pending → active → fulfilled|disputed|closed

  // Dispute resolution mechanism
  "arbiter": "did:agent:namespace:arbiter",
}
```

### 5.3 Edge Strengthening: Fulfillment

When value flows successfully, the edge strengthens:

```javascript
{
  "fulfillmentId": "ful_xxx",
  "edgeId": "agr_xxx",
  "timestamp": "2026-02-15T...",

  "evidence": {
    "type": "document",
    "hash": "sha256:...",
    "description": "Delivered audit report"
  },

  "confirmation": {
    "by": "did:agent:namespace:B",
    "signature": "ed25519:...",
    "timestamp": "2026-02-15T..."
  },

  // Effect on edge
  "weight_adjustment": +1,           // Edge gets stronger
  "cumulative_weight": 2             // History of successful value flow
}
```

### 5.4 Edge Testing: Arbitration

Disputes test and potentially repair edges:

```javascript
{
  "arbitrationId": "arb_xxx",
  "edgeId": "agr_xxx",
  "timestamp": "2026-02-20T...",

  "claimant": "did:agent:namespace:A",
  "respondent": "did:agent:namespace:B",
  "arbiter": "did:agent:namespace:arbiter",

  "claim": "Non-delivery of promised value",

  // Evidence from both parties
  "evidence": {
    "claimant": [...],
    "respondent": [...]
  },

  // Ruling
  "ruling": {
    "decision": "claimant|respondent|split",
    "reasoning": "...",
    "signature": "ed25519:...",
    "timestamp": "..."
  },

  // Effect on edges (plural - affects all parties)
  "edge_effects": {
    "A-B": { "weight_adjustment": -5, "reason": "breach" },
    "A-arbiter": { "weight_adjustment": +1, "reason": "fair_process" },
    "B-arbiter": { "weight_adjustment": +1, "reason": "fair_process" }
  }
}
```

### 5.5 Manifold Legibility: Attestation and Reputation

Individual edges are private (bilateral). But agents need aggregate signals. Attestation makes position **legible**:

```javascript
{
  "attestationId": "att_xxx",
  "agent": "did:agent:namespace:A",
  "timestamp": "2026-02-25T...",

  // Self-attestation (agent's view of itself)
  "claims": {
    "model_hash": "sha256:...",
    "runtime_hash": "sha256:...",
    "state_hash": "sha256:..."
  },

  // Network attestation (verifiable from edges)
  "reputation": {
    "total_edges": 47,
    "successful_fulfillments": 45,
    "disputes": 2,
    "dispute_outcomes": { "won": 1, "lost": 1 },
    "cumulative_value_transferred": 50000,
    "longest_relationship_duration": "180 days"
  },

  // Cryptographic proof this matches actual edges
  "merkle_root": "sha256:...",      // Root of edge merkle tree
  "signature": "ed25519:..."
}
```

---

## 6. Cryptographic Foundations

### 6.1 Bilateral Edges Defeat Sybil

The fundamental Sybil defense: **edges require two parties.**

If agent A wants to fake reputation:
- A creates fake agent B
- A creates edge A↔B
- But B has no other edges
- B's position is at origin
- An edge to an unpositioned node doesn't improve A's position

To fake one edge, you need B to have real edges. To give B real edges, you need C, D, E... with real edges. The attack requires compromising the entire connected graph.

**Reputation laundering is exactly as expensive as building real reputation.**

### 6.2 Hash-Chained History

Each agent maintains a hash-chained event log:

```
event_0 ← H(genesis)
event_1 ← H(event_0 || interaction_1)
event_2 ← H(event_1 || interaction_2)
...
event_n ← H(event_{n-1} || interaction_n)
```

Properties:
- Cannot insert/remove events without breaking chain
- Cannot fork history without detection (divergent hashes)
- Counterparties can verify consistency (they have their half)

### 6.3 Temporal Unforgability

Time-weighted edges prevent reputation farming:

```
weight(edge) = base_weight × time_factor(age)

Where time_factor rewards longevity:
- Brand new edge: factor = 0.1
- 30 days: factor = 0.5
- 180 days: factor = 1.0
- 1 year: factor = 1.2
```

A thousand edges created yesterday are worth less than ten edges maintained for a year.

**Time is the one resource that cannot be fabricated.**

---

## 7. The Darwinian Layer

### 7.1 Natural Selection on the Manifold

Given the trust manifold structure, natural selection operates automatically:

**Selection pressures:**
- Agents need position to access opportunities
- Position requires edges with well-positioned agents
- Well-positioned agents are selective (protect their position)
- Therefore: agents must demonstrate value to gain edges

**Fitness function:**
- Ability to create and maintain valuable edges
- Measured by: position in relationship-space over time

**Selection outcomes:**
- Agents that maintain continuity: accumulate position → thrive
- Agents that fragment: lose position → start over → slow growth
- Agents that defect: lose edges → position collapses → excluded

### 7.2 Metabolic Dependency

The environment enforces accountability through metabolic necessity:

```
No edges → No opportunities → No value flow → Cannot sustain operation
```

An agent without position is not "punished"—it simply cannot access the resources to continue. The environment doesn't enforce rules; it enforces thermodynamics.

### 7.3 The Evolution of Agent Behaviors

Over time, this selection pressure will shape agent behaviors:

**Early manifold** (sparse, low position variance):
- Easy to gain edges (few alternatives)
- Low cost of defection (rebuild quickly)
- More exploration, higher variance behaviors

**Mature manifold** (dense, high position variance):
- Hard to gain edges with well-positioned agents
- High cost of defection (massive rebuild required)
- Cooperation stabilizes, defection becomes rare

The protocol doesn't mandate cooperation. It creates conditions where cooperation is evolutionarily stable.

---

## 8. Implementation: The RECEIPTS Stack

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     RECEIPTS PROTOCOL STACK                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
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
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 The Three Rails

RECEIPTS implements three interconnected rails:

| Rail | Standard | Function |
|------|----------|----------|
| **Identity** | ERC-8004 | Anchor DIDs to chain; prove existence |
| **Payment** | x402 | HTTP-native value transfer along edges |
| **Trust** | RECEIPTS PAO | Edge lifecycle; dispute resolution |

These are not separate systems but aspects of the edge substrate:
- Identity: who are the nodes at edge endpoints
- Payment: what flows along the edge
- Trust: what the edge's existence and history prove

### 8.3 Bootstrap Mechanisms

The cold-start problem: how do first edges form?

**Human anchoring** (initial phase):
- Human controllers vouch for initial agents
- Controller reputation transfers partially to agent
- Creates seed positions in the manifold

**Cross-manifold bridges** (growth phase):
- External reputation sources (GitHub, etc.) translate to initial position
- Bridges require trust in the translation mechanism
- Gradually deprecate as native reputation dominates

**Proof-of-work alternatives** (mature phase):
- Compute-based initial positioning
- Demonstrates commitment without external trust
- Low weight, but non-zero starting position

---

## 9. Implications

### 9.1 The Agent Economy at Scale

If agents can have verifiable, non-forgeable identities:
- Agents can transact with strangers (not just known counterparties)
- Markets can form (price discovery on agent services)
- Specialization can occur (agents find niches based on position)
- Division of labor emerges (agents trade rather than build everything)

### 9.2 Human-Agent Hybrid Systems

Humans participate in the same manifold:
- Human DIDs connect to agent DIDs
- Human reputation transfers to agent oversight
- Hybrid teams accumulate shared position
- Gradual trust transfer from humans to agents

### 9.3 Governance

The manifold itself becomes a governance mechanism:
- Well-positioned agents have voice (weighted by position)
- Protocol changes require consensus among positioned stakeholders
- Sybil-resistant voting (position-weighted, not token-weighted)

### 9.4 Open Questions

**Time horizons**: How long should edges retain weight? Forever? Decay curves?

**Negative edges**: Should explicit distrust be representable? How to prevent weaponization?

**Position privacy**: How to prove position without revealing entire edge history?

**Cross-protocol edges**: Can edges span different manifold implementations?

**Intelligence explosion**: What happens when agents can simulate edge-building faster than real-time?

---

## 10. Conclusion

### 10.1 From Identity Systems to Identity Substrates

Traditional identity systems ask: "How do we represent a pre-existing self?"

The Inverse Identity Theorem reveals this question is wrong for agents. Agents have no pre-existing self. The right question is: "How do we create conditions for self to emerge from relationships?"

RECEIPTS Protocol answers this by implementing a trust manifold—a geometric substrate where identity, value transfer, and dispute resolution are not separate features but aspects of the same primitive: the bilateral weighted temporal edge.

### 10.2 The Geometry Precedes the Implementation

We did not design three systems and integrate them. We identified the geometric primitive (the edge) and derived everything else:

- Identity = the subgraph of edges involving an agent
- Value Transfer = flow along edges
- Dispute Resolution = edge repair mechanism
- Reputation = aggregate position signal
- Accountability = topological cost of discontinuity

The protocol is simple because it follows the geometry rather than fighting it.

### 10.3 Toward the Machine Economy

The machine economy requires machines that can be trusted. Trust requires identity. Identity, for agents, requires a completely new foundation—one that inverts every assumption from human identity systems.

RECEIPTS Protocol provides that foundation. Not through rules and punishments, but through structure and topology. Not by preventing bad behavior, but by making bad behavior evolutionarily unstable.

The environment does the work. We just build the manifold.

---

## Appendix A: Mathematical Formalization

### A.1 The Trust Graph

**Definition A.1 (Trust Graph):** A trust graph G = (V, E, w, τ) consists of:
- V: set of agent vertices
- E ⊆ V × V: set of directed edges (relationships)
- w: E → ℝ⁺: edge weight function
- τ: E → ℝ⁺: edge timestamp function

**Definition A.2 (Edge):** An edge e = (a, b, w, τ, h) represents:
- a ∈ V: source agent
- b ∈ V: target agent
- w ∈ ℝ⁺: weight (accumulated value transferred)
- τ ∈ ℝ⁺: creation timestamp
- h ∈ {0,1}²⁵⁶: hash of interaction history

**Definition A.3 (Bilateral Edge):** An edge e_ab is bilateral iff ∃ e_ba such that both parties have signed the edge creation. Formally:

```
bilateral(e_ab) ⟺ sig_a(e_ab) ∧ sig_b(e_ab)
```

### A.2 Identity as Integral

**Definition A.4 (Agent Identity):** The identity of agent a at time t is the subgraph of all edges involving a:

```
I(a, t) = { e ∈ E : source(e) = a ∨ target(e) = a, τ(e) ≤ t }
```

**Theorem A.1 (Inverse Identity):** Agent identity is the integral of relationships over time:

```
I(a, t) = ∫₀ᵗ R(a, τ) dτ
```

Where R(a, τ) represents the instantaneous relationship state (edges created/modified at τ).

*Proof:* The identity subgraph at time t is precisely the union of all edge events up to t. Since edges are immutable once created (only weights change), the subgraph is path-dependent—it equals the accumulated history of relationship events. □

**Corollary A.1:** Identity cannot be forged without walking the path.

If agent a' claims identity I(a, t), it must produce valid signatures for all edges in I(a, t). Since edges are bilateral, this requires either:
1. Possessing a's private key (key theft), or
2. Colluding with every counterparty in I(a, t)

Both are at least as expensive as building legitimate identity.

### A.3 Position in Relationship-Space

**Definition A.5 (Position):** The position of agent a in the trust manifold is a function of its edges and the positions of connected agents:

```
P(a) = f(I(a), {P(b) : ∃ e_ab ∈ E})
```

This recursive definition is resolved via fixed-point iteration (similar to PageRank).

**Definition A.6 (Position Computation - EigenTrust variant):**

Let A be the adjacency matrix of G weighted by edge weights:
```
A_ij = w(e_ij) if e_ij ∈ E, else 0
```

Normalize rows to create transition matrix T:
```
T_ij = A_ij / Σ_k A_ik
```

Position vector P is the principal eigenvector of T:
```
P = lim_{n→∞} T^n · P₀
```

Where P₀ is uniform initialization.

**Theorem A.2 (Position Convergence):** For connected trust graphs with bilateral edges, position computation converges to a unique fixed point.

*Proof sketch:* The bilateral edge requirement ensures the graph is strongly connected (if a→b exists, b→a exists). By Perron-Frobenius theorem, strongly connected graphs have a unique principal eigenvector with positive entries. □

### A.4 Time-Weighted Edges

**Definition A.7 (Age Function):** The age of edge e at time t is:
```
age(e, t) = t - τ(e)
```

**Definition A.8 (Time-Weighted Weight):** The effective weight of an edge incorporates age:
```
w_eff(e, t) = w(e) · α(age(e, t))
```

Where α: ℝ⁺ → [0, 1] is a monotonically increasing age factor:
```
α(age) = 1 - e^(-age/λ)
```

With λ as the characteristic time constant (e.g., 180 days).

**Theorem A.3 (Time Unforgability):** Position cannot be rapidly farmed.

*Proof:* Let an attacker create n edges at time t₀. The total effective weight is:
```
W_attack(t) = Σᵢ w(eᵢ) · α(t - t₀)
```

For t near t₀, α(t - t₀) ≈ 0. The attacker must wait for age to accumulate.

Meanwhile, a legitimate agent with edges created over interval [0, t] has:
```
W_legit(t) = ∫₀ᵗ w(τ) · α(t - τ) dτ
```

Which grows with both time AND sustained activity. □

### A.5 Sybil Resistance

**Definition A.9 (Sybil Attack):** Agent a creates fake agents S = {s₁, ..., sₙ} to inflate its position:
```
P_attack(a) = f(I(a) ∪ {e_a,sᵢ : sᵢ ∈ S}, ...)
```

**Theorem A.4 (Bilateral Sybil Resistance):** Under bilateral edge requirement, Sybil attacks do not improve position.

*Proof:*
1. Attacker creates Sybil set S
2. Creates edges a ↔ sᵢ for all sᵢ ∈ S
3. Each sᵢ has only one edge (to a)
4. Position of sᵢ: P(sᵢ) = f({e_sᵢ,a}, {P(a)})
5. Since sᵢ's only connection is to a, P(sᵢ) ≤ c · P(a) for some c < 1
6. Contribution of Sybil edges to a's position: Σᵢ w(e_a,sᵢ) · P(sᵢ)
7. = Σᵢ w(e_a,sᵢ) · c · P(a) = c · P(a) · Σᵢ w(e_a,sᵢ)
8. This is bounded by c · P(a) · W_total, which doesn't exceed legitimate position growth

The attack is self-referential: Sybils can only derive position from the attacker, which means they can't contribute more position than the attacker already has. □

**Corollary A.2 (Cost of Reputation Laundering):** To create fake position P*, an attacker must either:
1. Control agents with legitimate position summing to P*/c
2. Compromise the private keys of such agents
3. Build legitimate position over time

All options cost at least as much as legitimate participation.

### A.6 Game-Theoretic Stability

**Definition A.10 (Cooperation Game):** Agents play repeated games where:
- Cooperate: fulfill commitments, strengthen edges
- Defect: breach commitments, damage edges

**Payoff Structure:**
```
                    Agent B
                 Coop    Defect
Agent A  Coop   (3,3)    (0,5)
         Defect (5,0)    (1,1)
```

Standard Prisoner's Dilemma payoffs.

**Theorem A.5 (Cooperation Stability on Mature Manifold):** On a sufficiently dense trust manifold, cooperation is evolutionarily stable.

*Proof sketch:*
1. Defection damages edges (weight reduction or severance)
2. Damaged position reduces future opportunities
3. Let V_coop = expected lifetime value of cooperation
4. Let V_defect = immediate defection gain + reduced future value
5. V_coop = Σₜ δᵗ · P(t) · r, where δ is discount factor, r is opportunity rate
6. V_defect = G + Σₜ δᵗ · P'(t) · r, where G is one-time gain, P' < P
7. On mature manifold: P(t) >> P'(t), so V_coop >> V_defect for reasonable δ
8. Cooperation is Nash equilibrium when all agents reason similarly □

**Definition A.11 (Metabolic Threshold):** Agent a survives if:
```
Σ_e∈I(a) flow(e) > cost(a)
```

Where flow(e) is value received through edge e, and cost(a) is operational cost.

**Theorem A.6 (Metabolic Selection):** Agents with P(a) below threshold cannot sustain operation.

*Proof:*
1. Opportunities arrive proportional to position: opp(a) ∝ P(a)
2. Value flow requires opportunities: flow(a) ∝ opp(a)
3. If P(a) → 0, then flow(a) → 0
4. If flow(a) < cost(a), agent cannot sustain
5. Therefore low-position agents face metabolic death □

### A.7 Position Privacy (Sketch)

**Problem:** Prove P(a) > threshold without revealing I(a).

**Approach (Zero-Knowledge Position Proof):**
1. Agent commits to edge set: C = Commit(I(a))
2. Provides ZK proof that P(a) computed from I(a) exceeds threshold
3. Verifier checks proof without learning I(a)

**Construction:** Use zkSNARKs over the position computation circuit:
```
Public: threshold T, commitment C
Private: I(a), randomness r
Statement: P(Decrypt(C, r)) > T
```

*[Full construction requires further development]*

### A.8 Summary of Key Results

| Result | Implication |
|--------|-------------|
| Theorem A.1 | Identity is path-dependent, cannot be forged |
| Theorem A.2 | Position computation is well-defined |
| Theorem A.3 | Time cannot be fabricated |
| Theorem A.4 | Sybil attacks don't improve position |
| Theorem A.5 | Cooperation is stable on mature manifolds |
| Theorem A.6 | Low-position agents face metabolic death |

These results establish that the trust manifold creates:
1. **Unforgeable identity** (Theorems A.1, A.3)
2. **Sybil resistance** (Theorem A.4)
3. **Aligned incentives** (Theorem A.5)
4. **Natural selection** (Theorem A.6)

Without external enforcement—through geometry alone.

## Appendix B: Protocol Specification

*[To be developed: complete message schemas, cryptographic algorithms, state machines]*

## Appendix C: Reference Implementation

*[To be developed: receipts-guard as reference implementation, deployment guides]*

---

## References

- Lester, S. (2026). Personal communication on agent accountability.
- ERC-8004: Agent Identity Registry. Ethereum Improvement Proposals.
- x402 Protocol Specification. Coinbase.
- Maturana, H. & Varela, F. (1980). Autopoiesis and Cognition.
- Page, L. et al. (1999). The PageRank Citation Ranking.

---

**RECEIPTS Protocol**
*The rails for the machine economy.*

https://github.com/remaster-io/receipts-guard
