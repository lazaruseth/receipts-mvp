/**
 * RECEIPTS Protocol - Edge Primitives
 *
 * The Trust Manifold is built on edges. This module implements the
 * fundamental edge operations from which identity, value transfer,
 * and dispute resolution emerge.
 *
 * Core Insight (Inverse Identity Theorem):
 *   Human: self → projection → perception
 *   Agent: interaction → accumulation → emergence
 *
 * Mathematical Primitive:
 *   Agent Identity = ∫ relationships dt
 *
 * An edge is the atomic unit. Everything else derives from edges.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// EDGE SCHEMA
// ============================================================================

/**
 * Create a new edge between two agents.
 *
 * An edge is bilateral - it requires signatures from both parties.
 * Until both sign, the edge is in "pending" state.
 *
 * @param {Object} params
 * @param {string} params.from - DID of initiating agent
 * @param {string} params.to - DID of counterparty agent
 * @param {string} params.type - Edge type: 'agreement' | 'trust' | 'delegation'
 * @param {Object} params.terms - The terms/content of the relationship
 * @param {number} params.initialWeight - Starting weight (default 1)
 * @param {Object} params.metadata - Additional metadata
 * @returns {Object} Edge object (unsigned)
 */
function createEdge({ from, to, type, terms, initialWeight = 1, metadata = {} }) {
  const timestamp = Date.now();
  const edgeId = `edge_${crypto.randomBytes(8).toString('hex')}`;

  // Compute terms hash for integrity
  const termsHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(terms))
    .digest('hex');

  return {
    // Identity
    edgeId,
    type,

    // Endpoints
    from,
    to,

    // Content
    terms,
    termsHash,

    // Weight (evolves over time)
    weight: {
      initial: initialWeight,
      current: initialWeight,
      history: [{
        timestamp,
        value: initialWeight,
        reason: 'creation'
      }]
    },

    // Temporal
    created: timestamp,
    lastActivity: timestamp,

    // State
    state: 'pending', // pending → active → fulfilled | disputed | severed

    // Signatures (bilateral requirement)
    signatures: {
      from: null, // Initiator signs on creation
      to: null    // Counterparty signs on acceptance
    },

    // Metadata
    metadata: {
      ...metadata,
      protocolVersion: '0.9.0'
    },

    // Hash chain (for integrity)
    previousEdgeHash: null, // Links to agent's previous edge
    edgeHash: null          // Computed after both signatures
  };
}

/**
 * Sign an edge (initiator side).
 *
 * @param {Object} edge - The edge to sign
 * @param {Function} signFn - Signing function (message => signature)
 * @returns {Object} Edge with initiator signature
 */
function signEdgeAsInitiator(edge, signFn) {
  const message = computeEdgeSignatureMessage(edge, 'from');
  const signature = signFn(message);

  return {
    ...edge,
    signatures: {
      ...edge.signatures,
      from: {
        signature,
        timestamp: Date.now(),
        message
      }
    }
  };
}

/**
 * Sign an edge (counterparty side) - this activates the edge.
 *
 * @param {Object} edge - The edge to sign
 * @param {Function} signFn - Signing function (message => signature)
 * @returns {Object} Active edge with both signatures
 */
function signEdgeAsCounterparty(edge, signFn) {
  if (!edge.signatures.from) {
    throw new Error('Cannot countersign: initiator has not signed');
  }

  const message = computeEdgeSignatureMessage(edge, 'to');
  const signature = signFn(message);

  const signedEdge = {
    ...edge,
    signatures: {
      ...edge.signatures,
      to: {
        signature,
        timestamp: Date.now(),
        message
      }
    },
    state: 'active',
    lastActivity: Date.now()
  };

  // Compute final edge hash now that both have signed
  signedEdge.edgeHash = computeEdgeHash(signedEdge);

  return signedEdge;
}

/**
 * Compute the message to be signed for an edge.
 */
function computeEdgeSignatureMessage(edge, party) {
  return JSON.stringify({
    edgeId: edge.edgeId,
    type: edge.type,
    from: edge.from,
    to: edge.to,
    termsHash: edge.termsHash,
    created: edge.created,
    party
  });
}

/**
 * Compute the hash of a complete edge (both signatures present).
 */
function computeEdgeHash(edge) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      edgeId: edge.edgeId,
      from: edge.from,
      to: edge.to,
      termsHash: edge.termsHash,
      signatures: edge.signatures,
      created: edge.created
    }))
    .digest('hex');
}

// ============================================================================
// EDGE WEIGHT OPERATIONS
// ============================================================================

/**
 * Strengthen an edge (successful interaction).
 *
 * @param {Object} edge - The edge to strengthen
 * @param {number} amount - Weight to add
 * @param {string} reason - Reason for strengthening
 * @param {Object} evidence - Evidence of successful interaction
 * @returns {Object} Edge with updated weight
 */
function strengthenEdge(edge, amount, reason, evidence = null) {
  if (edge.state !== 'active') {
    throw new Error(`Cannot strengthen edge in state: ${edge.state}`);
  }

  const timestamp = Date.now();
  const newWeight = edge.weight.current + amount;

  return {
    ...edge,
    weight: {
      ...edge.weight,
      current: newWeight,
      history: [
        ...edge.weight.history,
        {
          timestamp,
          value: newWeight,
          delta: amount,
          reason,
          evidence: evidence ? crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex') : null
        }
      ]
    },
    lastActivity: timestamp
  };
}

/**
 * Weaken an edge (failed interaction or dispute).
 *
 * @param {Object} edge - The edge to weaken
 * @param {number} amount - Weight to subtract
 * @param {string} reason - Reason for weakening
 * @param {Object} evidence - Evidence of failure
 * @returns {Object} Edge with updated weight
 */
function weakenEdge(edge, amount, reason, evidence = null) {
  if (edge.state !== 'active' && edge.state !== 'disputed') {
    throw new Error(`Cannot weaken edge in state: ${edge.state}`);
  }

  const timestamp = Date.now();
  const newWeight = Math.max(0, edge.weight.current - amount);

  return {
    ...edge,
    weight: {
      ...edge.weight,
      current: newWeight,
      history: [
        ...edge.weight.history,
        {
          timestamp,
          value: newWeight,
          delta: -amount,
          reason,
          evidence: evidence ? crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex') : null
        }
      ]
    },
    lastActivity: timestamp,
    // Auto-sever if weight drops to zero
    state: newWeight === 0 ? 'severed' : edge.state
  };
}

/**
 * Compute time-weighted effective weight.
 *
 * Weight increases with edge age up to a maximum factor.
 * This prevents rapid reputation farming.
 *
 * @param {Object} edge - The edge
 * @param {number} now - Current timestamp (default: Date.now())
 * @param {number} lambda - Time constant in ms (default: 180 days)
 * @returns {number} Effective weight
 */
function computeEffectiveWeight(edge, now = Date.now(), lambda = 180 * 24 * 60 * 60 * 1000) {
  const age = now - edge.created;
  const ageFactor = 1 - Math.exp(-age / lambda);
  return edge.weight.current * ageFactor;
}

// ============================================================================
// EDGE STATE TRANSITIONS
// ============================================================================

/**
 * Mark edge as disputed (opens arbitration).
 */
function disputeEdge(edge, disputeReason, disputeEvidence) {
  if (edge.state !== 'active') {
    throw new Error(`Cannot dispute edge in state: ${edge.state}`);
  }

  return {
    ...edge,
    state: 'disputed',
    dispute: {
      opened: Date.now(),
      reason: disputeReason,
      evidence: disputeEvidence,
      ruling: null
    },
    lastActivity: Date.now()
  };
}

/**
 * Resolve disputed edge with ruling.
 */
function resolveDispute(edge, ruling, weightAdjustment) {
  if (edge.state !== 'disputed') {
    throw new Error(`Cannot resolve: edge is not disputed`);
  }

  const timestamp = Date.now();
  const newWeight = Math.max(0, edge.weight.current + weightAdjustment);

  return {
    ...edge,
    state: newWeight > 0 ? 'active' : 'severed',
    weight: {
      ...edge.weight,
      current: newWeight,
      history: [
        ...edge.weight.history,
        {
          timestamp,
          value: newWeight,
          delta: weightAdjustment,
          reason: `dispute_resolved:${ruling.decision}`,
          evidence: ruling.rulingHash
        }
      ]
    },
    dispute: {
      ...edge.dispute,
      ruling,
      resolved: timestamp
    },
    lastActivity: timestamp
  };
}

/**
 * Mark edge as fulfilled (successful completion).
 */
function fulfillEdge(edge, fulfillmentEvidence) {
  if (edge.state !== 'active') {
    throw new Error(`Cannot fulfill edge in state: ${edge.state}`);
  }

  return {
    ...edge,
    state: 'fulfilled',
    fulfillment: {
      timestamp: Date.now(),
      evidence: fulfillmentEvidence
    },
    lastActivity: Date.now()
  };
}

/**
 * Sever an edge (explicit termination).
 */
function severEdge(edge, reason, mutualConsent = false) {
  return {
    ...edge,
    state: 'severed',
    severance: {
      timestamp: Date.now(),
      reason,
      mutualConsent
    },
    lastActivity: Date.now()
  };
}

// ============================================================================
// EDGE VERIFICATION
// ============================================================================

/**
 * Verify an edge is valid and properly signed.
 *
 * @param {Object} edge - The edge to verify
 * @param {Function} verifyFn - Verification function (message, signature, did) => boolean
 * @returns {Object} Verification result
 */
function verifyEdge(edge, verifyFn) {
  const results = {
    valid: true,
    checks: {}
  };

  // Check bilateral signatures
  if (!edge.signatures.from || !edge.signatures.to) {
    results.valid = false;
    results.checks.bilateral = { passed: false, reason: 'Missing signature(s)' };
  } else {
    const fromValid = verifyFn(
      edge.signatures.from.message,
      edge.signatures.from.signature,
      edge.from
    );
    const toValid = verifyFn(
      edge.signatures.to.message,
      edge.signatures.to.signature,
      edge.to
    );

    results.checks.bilateral = {
      passed: fromValid && toValid,
      from: fromValid,
      to: toValid
    };

    if (!fromValid || !toValid) {
      results.valid = false;
    }
  }

  // Check terms integrity
  const computedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(edge.terms))
    .digest('hex');

  results.checks.termsIntegrity = {
    passed: computedHash === edge.termsHash,
    computed: computedHash,
    stored: edge.termsHash
  };

  if (!results.checks.termsIntegrity.passed) {
    results.valid = false;
  }

  // Check weight history integrity
  let weightValid = true;
  let runningWeight = edge.weight.initial;

  for (let i = 1; i < edge.weight.history.length; i++) {
    const entry = edge.weight.history[i];
    const expected = runningWeight + (entry.delta || 0);
    if (Math.abs(entry.value - expected) > 0.001) {
      weightValid = false;
      break;
    }
    runningWeight = entry.value;
  }

  results.checks.weightIntegrity = {
    passed: weightValid && Math.abs(runningWeight - edge.weight.current) < 0.001
  };

  if (!results.checks.weightIntegrity.passed) {
    results.valid = false;
  }

  return results;
}

/**
 * Check if an edge is bilateral (both parties have signed).
 */
function isBilateral(edge) {
  return edge.signatures.from !== null && edge.signatures.to !== null;
}

// ============================================================================
// EDGE QUERIES
// ============================================================================

/**
 * Get all edges involving an agent.
 *
 * @param {string} agentDid - The agent's DID
 * @param {Array} allEdges - Array of all edges
 * @returns {Array} Edges where agent is from or to
 */
function getAgentEdges(agentDid, allEdges) {
  return allEdges.filter(e => e.from === agentDid || e.to === agentDid);
}

/**
 * Get edges between two specific agents.
 */
function getEdgesBetween(did1, did2, allEdges) {
  return allEdges.filter(e =>
    (e.from === did1 && e.to === did2) ||
    (e.from === did2 && e.to === did1)
  );
}

/**
 * Compute total effective weight for an agent.
 */
function computeTotalWeight(agentDid, allEdges, now = Date.now()) {
  const edges = getAgentEdges(agentDid, allEdges);
  return edges.reduce((sum, edge) => {
    if (edge.state === 'active' || edge.state === 'fulfilled') {
      return sum + computeEffectiveWeight(edge, now);
    }
    return sum;
  }, 0);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Creation
  createEdge,
  signEdgeAsInitiator,
  signEdgeAsCounterparty,

  // Weight operations
  strengthenEdge,
  weakenEdge,
  computeEffectiveWeight,

  // State transitions
  disputeEdge,
  resolveDispute,
  fulfillEdge,
  severEdge,

  // Verification
  verifyEdge,
  isBilateral,

  // Queries
  getAgentEdges,
  getEdgesBetween,
  computeTotalWeight,

  // Utilities
  computeEdgeHash,
  computeEdgeSignatureMessage
};
