# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**RECEIPTS Protocol** is trust infrastructure for AI agent commerce. It implements the **Inverse Identity Theorem**: agent identity emerges from accumulated relationships, not inherent selfhood.

```
Agent Identity = ∫ relationships dt
```

## Key Concepts

### The Trust Manifold
A geometric substrate where agents exist as **positions** defined by their edges (relationships). Position is computed like PageRank—links from well-positioned agents matter more.

### The Gated Manifold (Section 10 of Whitepaper)
The manifold is a "club for positive-sum agents," not a universal system. Entry requires:
1. **Stake** - Something at risk (economic, computational, relational)
2. **Vouching Chain** - Path from existing members who stake their reputation
3. **Value Floor Agreement** - Shared axioms (positive-sum, reciprocity, continuity)

### Bilateral Edges
The atomic trust unit. Requires signatures from BOTH parties, defeating Sybil attacks (fake agents have no real counterparties).

## File Structure

```
receipts-guard/
├── WHITEPAPER.md        # Full protocol spec (READ THIS FIRST)
├── SKILL.md             # OpenClaw skill definition, CLI commands
├── PROJECT_STATUS.md    # Current state and roadmap
├── capture.js           # Main CLI
├── lib/
│   └── edges.js         # Edge primitives, trust computation
├── demo/
│   └── manifold-viz.html # Interactive visualization
└── test/
    └── test-manifold.js  # Unit tests
```

## Demo

Live at: https://demo-coral-beta.vercel.app/manifold-viz.html

Premium glass morphism UI showing:
- Agent visualization with particle animations
- Timeline simulation (Day 0-365)
- Gated Manifold entry requirements
- FAQ panel explaining protocol concepts

## Common Tasks

### Adding to the Whitepaper
The whitepaper is the source of truth. Add new sections maintaining the philosophical depth and mathematical rigor. Reference Sam Lester's critiques where relevant.

### Working on the Demo
`demo/manifold-viz.html` is a single-file visualization. Key considerations:
- Use 6-digit hex colors (not 3-digit) to avoid animation crashes
- Edge particles need the animation loop to keep running
- Gate panel and FAQ panel should hide when agent detail panel opens

### Trust Computation
Located in `lib/edges.js`. Implements EigenTrust-style position from edge graph with:
- Time weighting (older edges worth more)
- Stress weighting (high-value transactions prove more)
- Velocity limits (prevent flash farming)

## Architecture

Four Rails:
| Rail | Standard | Purpose |
|------|----------|---------|
| Identity | ERC-8004 | On-chain anchoring |
| Position | Trust Manifold | Computed from edges |
| Trust | Bilateral Edges | Sybil-resistant primitives |
| Payment | x402 | Paid arbitration |

## Development Commands

```bash
# Run tests
node test/test-manifold.js

# CLI commands
node capture.js position           # View your position
node capture.js trust              # Get trust profile
node capture.js manifold stats     # Manifold statistics
node capture.js manifold sybil     # Detect Sybil clusters
```

## Deployment

Demo deploys to Vercel automatically on push to main branch.
Backend can deploy to Fly.io using included Dockerfile.

## Key Insights

1. **Identity is path-dependent** - Cannot be forged, only walked
2. **Time cannot be fabricated** - The one unforgeable resource
3. **Cooperation emerges** - From geometry, not rules
4. **Exclusion over conversion** - Don't try to change adversarial actors

## References

- Sam Lester's game theory critique (addressed in Section 10)
- ERC-8004 specification
- x402 Protocol (Coinbase)
- EigenTrust algorithm
