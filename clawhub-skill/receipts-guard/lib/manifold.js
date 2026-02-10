/**
 * RECEIPTS Protocol - Trust Manifold Integration
 *
 * This module bridges the conceptual edge primitives with the existing
 * capture.js implementation. It provides the interface between:
 *   - Edge-based identity (position computation)
 *   - Agreement lifecycle (propose → accept → fulfill)
 *   - Reputation computation (weighted graph position)
 *
 * The Trust Manifold is the geometric substrate where agents exist as
 * positions defined by their relationships. This module makes that
 * computable.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  createEdge,
  signEdgeAsInitiator,
  signEdgeAsCounterparty,
  strengthenEdge,
  weakenEdge,
  fulfillEdge,
  disputeEdge,
  resolveDispute,
  severEdge,
  verifyEdge,
  isBilateral,
  getAgentEdges,
  computeEffectiveWeight,
  computeTotalWeight
} = require('./edges');

const {
  computePositions,
  estimateLocalPosition,
  analyzePositionImpact,
  detectSybilClusters,
  createPositionAttestation,
  computeRank,
  computePercentile
} = require('./position');

// ============================================================================
// MANIFOLD STORAGE
// ============================================================================

const RECEIPTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.openclaw',
  'receipts'
);

const EDGES_DIR = path.join(RECEIPTS_DIR, 'manifold', 'edges');
const POSITIONS_CACHE_FILE = path.join(RECEIPTS_DIR, 'manifold', 'positions-cache.json');
const MANIFOLD_INDEX_FILE = path.join(RECEIPTS_DIR, 'manifold', 'index.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================================
// EDGE STORAGE OPERATIONS
// ============================================================================

/**
 * Save an edge to the manifold.
 */
function saveEdge(edge) {
  ensureDir(EDGES_DIR);
  const edgeFile = path.join(EDGES_DIR, `${edge.edgeId}.json`);
  fs.writeFileSync(edgeFile, JSON.stringify(edge, null, 2));

  // Update index
  updateManifoldIndex(edge);

  // Invalidate position cache
  invalidatePositionCache();

  return edge;
}

/**
 * Load an edge by ID.
 */
function loadEdge(edgeId) {
  const edgeFile = path.join(EDGES_DIR, `${edgeId}.json`);
  if (!fs.existsSync(edgeFile)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(edgeFile, 'utf8'));
}

/**
 * Load all edges in the manifold.
 */
function loadAllEdges() {
  ensureDir(EDGES_DIR);
  const files = fs.readdirSync(EDGES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(EDGES_DIR, f), 'utf8')));
}

/**
 * Load edges for a specific agent.
 */
function loadAgentEdges(agentDid) {
  const allEdges = loadAllEdges();
  return getAgentEdges(agentDid, allEdges);
}

/**
 * Update the manifold index with edge metadata.
 */
function updateManifoldIndex(edge) {
  ensureDir(path.dirname(MANIFOLD_INDEX_FILE));

  let index = { edges: {}, agents: {}, updated: null };
  if (fs.existsSync(MANIFOLD_INDEX_FILE)) {
    index = JSON.parse(fs.readFileSync(MANIFOLD_INDEX_FILE, 'utf8'));
  }

  // Update edge entry
  index.edges[edge.edgeId] = {
    from: edge.from,
    to: edge.to,
    type: edge.type,
    state: edge.state,
    weight: edge.weight.current,
    created: edge.created,
    lastActivity: edge.lastActivity
  };

  // Update agent entries
  [edge.from, edge.to].forEach(did => {
    if (!index.agents[did]) {
      index.agents[did] = { edges: [], firstSeen: Date.now() };
    }
    if (!index.agents[did].edges.includes(edge.edgeId)) {
      index.agents[did].edges.push(edge.edgeId);
    }
  });

  index.updated = Date.now();
  fs.writeFileSync(MANIFOLD_INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * Invalidate the position cache (positions need recomputation).
 */
function invalidatePositionCache() {
  if (fs.existsSync(POSITIONS_CACHE_FILE)) {
    const cache = JSON.parse(fs.readFileSync(POSITIONS_CACHE_FILE, 'utf8'));
    cache.valid = false;
    cache.invalidatedAt = Date.now();
    fs.writeFileSync(POSITIONS_CACHE_FILE, JSON.stringify(cache, null, 2));
  }
}

// ============================================================================
// AGREEMENT → EDGE CONVERSION
// ============================================================================

/**
 * Convert an existing agreement to an edge.
 *
 * This allows migration of legacy agreements to the edge-based model.
 */
function agreementToEdge(agreement, signFn) {
  // Create edge from agreement
  const edge = createEdge({
    from: agreement.parties[0],  // proposer
    to: agreement.parties[1],    // counterparty
    type: 'agreement',
    terms: {
      text: agreement.terms.text,
      termsHash: agreement.termsHash,
      arbiter: agreement.arbiter,
      deadline: agreement.deadline,
      value: agreement.value
    },
    initialWeight: computeInitialWeight(agreement),
    metadata: {
      agreementId: agreement.agreementId,
      proposalId: agreement.proposalId,
      migratedAt: Date.now(),
      originalVersion: agreement.version
    }
  });

  // Sign as initiator (proposer already signed)
  const signedEdge = signEdgeAsInitiator(edge, signFn);

  // If agreement has both signatures, countersign
  if (Object.keys(agreement.signatures).length >= 2) {
    const fullySignedEdge = signEdgeAsCounterparty(signedEdge, signFn);
    return fullySignedEdge;
  }

  return signedEdge;
}

/**
 * Compute initial weight for an agreement based on its characteristics.
 */
function computeInitialWeight(agreement) {
  let weight = 1.0;

  // Increase weight for higher-value agreements
  if (agreement.value) {
    const value = parseFloat(agreement.value);
    if (value > 100) weight += 0.5;
    if (value > 1000) weight += 0.5;
  }

  // Increase weight if attestation was required/provided
  if (agreement.counterpartyAttestation) {
    weight += 0.5;
  }

  return weight;
}

/**
 * Create an edge from a new proposal.
 *
 * Returns an unsigned edge (pending counterparty signature).
 */
function proposalToEdge(proposal, signFn) {
  const edge = createEdge({
    from: proposal.proposer,
    to: proposal.counterparty,
    type: 'agreement',
    terms: {
      text: proposal.terms.text,
      termsHash: proposal.termsHash,
      arbiter: proposal.proposedArbiter,
      deadline: proposal.deadline,
      value: proposal.value,
      x402: proposal.x402,
      attestationRequirements: proposal.attestationRequirements
    },
    initialWeight: 1.0,
    metadata: {
      proposalId: proposal.proposalId,
      channel: proposal.channel,
      expiresAt: proposal.expiresAt
    }
  });

  // Sign as initiator
  return signEdgeAsInitiator(edge, signFn);
}

/**
 * Accept an edge (countersign to activate).
 */
function acceptEdge(edgeId, signFn, attestation = null) {
  const edge = loadEdge(edgeId);
  if (!edge) {
    throw new Error(`Edge not found: ${edgeId}`);
  }

  if (edge.state !== 'pending') {
    throw new Error(`Edge is not pending: ${edge.state}`);
  }

  // Add attestation to metadata if provided
  if (attestation) {
    edge.metadata.counterpartyAttestation = attestation;
  }

  // Countersign
  const activeEdge = signEdgeAsCounterparty(edge, signFn);

  // Save
  saveEdge(activeEdge);

  return activeEdge;
}

// ============================================================================
// EDGE LIFECYCLE OPERATIONS
// ============================================================================

/**
 * Record successful fulfillment of an edge.
 */
function recordFulfillment(edgeId, evidence, signFn) {
  const edge = loadEdge(edgeId);
  if (!edge) {
    throw new Error(`Edge not found: ${edgeId}`);
  }

  // Fulfill the edge
  const fulfilledEdge = fulfillEdge(edge, {
    evidence,
    evidenceHash: crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex'),
    recordedBy: edge.from // or could be determined from context
  });

  // Strengthen the edge (successful interaction)
  const strengthenedEdge = strengthenEdge(
    fulfilledEdge,
    0.5, // Fulfillment weight bonus
    'fulfillment',
    evidence
  );

  saveEdge(strengthenedEdge);
  return strengthenedEdge;
}

/**
 * Record a dispute on an edge.
 */
function recordDispute(edgeId, reason, evidence, signFn) {
  const edge = loadEdge(edgeId);
  if (!edge) {
    throw new Error(`Edge not found: ${edgeId}`);
  }

  const disputedEdge = disputeEdge(edge, reason, evidence);
  saveEdge(disputedEdge);
  return disputedEdge;
}

/**
 * Record dispute resolution.
 */
function recordResolution(edgeId, ruling, signFn) {
  const edge = loadEdge(edgeId);
  if (!edge) {
    throw new Error(`Edge not found: ${edgeId}`);
  }

  // Compute weight adjustment based on ruling
  let weightAdjustment = 0;
  switch (ruling.decision) {
    case 'claimant':
      // Claimant wins - other party breached
      weightAdjustment = -1.0;
      break;
    case 'respondent':
      // Respondent wins - claim was invalid
      weightAdjustment = 0.25; // Small bonus for surviving dispute
      break;
    case 'split':
      // Split decision
      weightAdjustment = -0.25;
      break;
  }

  const resolvedEdge = resolveDispute(edge, ruling, weightAdjustment);
  saveEdge(resolvedEdge);
  return resolvedEdge;
}

// ============================================================================
// POSITION COMPUTATION
// ============================================================================

/**
 * Get agent's position in the trust manifold.
 *
 * Uses cached computation if valid, otherwise recomputes.
 */
function getAgentPosition(agentDid, options = {}) {
  const { forceRecompute = false } = options;

  // Check cache
  if (!forceRecompute && fs.existsSync(POSITIONS_CACHE_FILE)) {
    const cache = JSON.parse(fs.readFileSync(POSITIONS_CACHE_FILE, 'utf8'));
    if (cache.valid && cache.positions[agentDid] !== undefined) {
      const age = Date.now() - cache.computedAt;
      // Cache valid for 1 hour
      if (age < 60 * 60 * 1000) {
        return {
          position: cache.positions[agentDid],
          rank: cache.ranks[agentDid],
          percentile: cache.percentiles[agentDid],
          cached: true,
          computedAt: cache.computedAt
        };
      }
    }
  }

  // Recompute
  const allEdges = loadAllEdges();
  const positions = computePositions(allEdges);

  // Cache results
  const cache = {
    valid: true,
    computedAt: Date.now(),
    positions: {},
    ranks: {},
    percentiles: {}
  };

  positions.forEach((pos, did) => {
    cache.positions[did] = pos;
    cache.ranks[did] = computeRank(did, positions);
    cache.percentiles[did] = computePercentile(did, positions);
  });

  ensureDir(path.dirname(POSITIONS_CACHE_FILE));
  fs.writeFileSync(POSITIONS_CACHE_FILE, JSON.stringify(cache, null, 2));

  return {
    position: cache.positions[agentDid] || 0,
    rank: cache.ranks[agentDid] || 0,
    percentile: cache.percentiles[agentDid] || 0,
    cached: false,
    computedAt: cache.computedAt
  };
}

/**
 * Get manifold summary statistics.
 */
function getManifoldStats() {
  const allEdges = loadAllEdges();
  const positions = computePositions(allEdges);

  const bilateralEdges = allEdges.filter(isBilateral);
  const activeEdges = allEdges.filter(e => e.state === 'active');
  const fulfilledEdges = allEdges.filter(e => e.state === 'fulfilled');
  const disputedEdges = allEdges.filter(e => e.state === 'disputed');

  // Detect Sybil clusters
  const sybilClusters = detectSybilClusters(allEdges);

  return {
    totalEdges: allEdges.length,
    bilateralEdges: bilateralEdges.length,
    activeEdges: activeEdges.length,
    fulfilledEdges: fulfilledEdges.length,
    disputedEdges: disputedEdges.length,
    uniqueAgents: positions.size,
    avgPosition: positions.size > 0
      ? Array.from(positions.values()).reduce((a, b) => a + b, 0) / positions.size
      : 0,
    suspectedSybilClusters: sybilClusters.length,
    sybilClusters: sybilClusters.map(c => ({
      agentCount: c.agents.length,
      confidence: c.confidence,
      avgPosition: c.avgPosition
    }))
  };
}

/**
 * Analyze potential position impact of a new relationship.
 */
function analyzeRelationshipImpact(agentDid, counterpartyDid) {
  const allEdges = loadAllEdges();

  // Create hypothetical edge
  const potentialEdge = createEdge({
    from: agentDid,
    to: counterpartyDid,
    type: 'agreement',
    terms: { hypothetical: true },
    initialWeight: 1.0
  });

  // Mock bilateral signature
  potentialEdge.signatures.from = { signature: 'mock', timestamp: Date.now() };
  potentialEdge.signatures.to = { signature: 'mock', timestamp: Date.now() };
  potentialEdge.state = 'active';

  return analyzePositionImpact(agentDid, potentialEdge, allEdges);
}

// ============================================================================
// REPUTATION QUERIES
// ============================================================================

/**
 * Get agent's trust profile (comprehensive reputation view).
 */
function getAgentTrustProfile(agentDid) {
  const allEdges = loadAllEdges();
  const agentEdges = getAgentEdges(agentDid, allEdges);
  const positionData = getAgentPosition(agentDid);

  // Compute edge statistics
  const edgeStats = {
    total: agentEdges.length,
    active: agentEdges.filter(e => e.state === 'active').length,
    fulfilled: agentEdges.filter(e => e.state === 'fulfilled').length,
    disputed: agentEdges.filter(e => e.state === 'disputed').length,
    severed: agentEdges.filter(e => e.state === 'severed').length
  };

  // Compute weight statistics
  const now = Date.now();
  const totalEffectiveWeight = agentEdges.reduce((sum, e) => {
    if (e.state === 'active' || e.state === 'fulfilled') {
      return sum + computeEffectiveWeight(e, now);
    }
    return sum;
  }, 0);

  // Compute fulfillment rate
  const completedEdges = edgeStats.fulfilled + edgeStats.severed;
  const fulfillmentRate = completedEdges > 0
    ? edgeStats.fulfilled / completedEdges
    : null;

  // Find oldest relationship
  const oldestEdge = agentEdges
    .filter(isBilateral)
    .sort((a, b) => a.created - b.created)[0];

  // Compute counterparty diversity
  const counterparties = new Set();
  agentEdges.forEach(e => {
    const other = e.from === agentDid ? e.to : e.from;
    counterparties.add(other);
  });

  return {
    agentDid,
    position: positionData,
    edges: edgeStats,
    totalEffectiveWeight,
    fulfillmentRate,
    counterpartyCount: counterparties.size,
    oldestRelationship: oldestEdge ? {
      edgeId: oldestEdge.edgeId,
      counterparty: oldestEdge.from === agentDid ? oldestEdge.to : oldestEdge.from,
      age: now - oldestEdge.created,
      ageDays: Math.floor((now - oldestEdge.created) / (24 * 60 * 60 * 1000))
    } : null,
    computedAt: Date.now()
  };
}

/**
 * Compare trust profiles of multiple agents.
 */
function compareTrustProfiles(agentDids) {
  return agentDids.map(did => getAgentTrustProfile(did));
}

/**
 * Get top agents by position.
 */
function getTopAgents(limit = 10) {
  const allEdges = loadAllEdges();
  const positions = computePositions(allEdges);

  return Array.from(positions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([did, position], index) => ({
      rank: index + 1,
      agentDid: did,
      position,
      percentile: computePercentile(did, positions)
    }));
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Storage
  saveEdge,
  loadEdge,
  loadAllEdges,
  loadAgentEdges,

  // Agreement conversion
  agreementToEdge,
  proposalToEdge,
  acceptEdge,

  // Lifecycle
  recordFulfillment,
  recordDispute,
  recordResolution,

  // Position
  getAgentPosition,
  getManifoldStats,
  analyzeRelationshipImpact,

  // Trust profiles
  getAgentTrustProfile,
  compareTrustProfiles,
  getTopAgents,

  // Re-export primitives for convenience
  createEdge,
  strengthenEdge,
  weakenEdge,
  computeEffectiveWeight,
  isBilateral,
  verifyEdge
};
