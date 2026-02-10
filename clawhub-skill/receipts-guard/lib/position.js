/**
 * RECEIPTS Protocol - Position Computation
 *
 * Position in the Trust Manifold is not stored - it's computed from edges.
 * An agent's position is determined by its edges and the positions of
 * connected agents (recursive/PageRank-style).
 *
 * Key Properties:
 *   - Position is computed, not stored (distributed across counterparties)
 *   - Position is relative (meaning from relationships)
 *   - Position requires traversal (no teleportation)
 *
 * Sybil Resistance:
 *   Edges are bilateral. Creating fake agent B to boost A fails because:
 *   - B has no other edges
 *   - B's position is zero
 *   - Edges from zero-positioned agents don't improve A's position
 */

const { computeEffectiveWeight, getAgentEdges, isBilateral } = require('./edges');

// ============================================================================
// POSITION COMPUTATION
// ============================================================================

/**
 * Compute positions for all agents using EigenTrust-style iteration.
 *
 * Position is the principal eigenvector of the weighted adjacency matrix.
 *
 * @param {Array} edges - All edges in the graph
 * @param {Object} options - Configuration options
 * @param {number} options.maxIterations - Max iterations (default: 100)
 * @param {number} options.tolerance - Convergence tolerance (default: 1e-6)
 * @param {number} options.dampingFactor - Damping factor (default: 0.85)
 * @returns {Map} Map of DID -> position score
 */
function computePositions(edges, options = {}) {
  const {
    maxIterations = 100,
    tolerance = 1e-6,
    dampingFactor = 0.85,
    now = Date.now()
  } = options;

  // Extract all unique agents
  const agents = new Set();
  edges.forEach(edge => {
    if (isBilateral(edge)) {
      agents.add(edge.from);
      agents.add(edge.to);
    }
  });

  const agentList = Array.from(agents);
  const n = agentList.length;

  if (n === 0) {
    return new Map();
  }

  // Build agent index
  const agentIndex = new Map();
  agentList.forEach((did, i) => agentIndex.set(did, i));

  // Build weighted adjacency matrix
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

  edges.forEach(edge => {
    if (!isBilateral(edge)) return;
    if (edge.state !== 'active' && edge.state !== 'fulfilled') return;

    const i = agentIndex.get(edge.from);
    const j = agentIndex.get(edge.to);
    const weight = computeEffectiveWeight(edge, now);

    // Bidirectional edge weight
    matrix[i][j] += weight;
    matrix[j][i] += weight;
  });

  // Normalize rows to create transition matrix
  const transition = matrix.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    if (sum === 0) return row.map(() => 1 / n); // Dangling node handling
    return row.map(v => v / sum);
  });

  // Initialize position vector uniformly
  let position = Array(n).fill(1 / n);

  // Power iteration
  for (let iter = 0; iter < maxIterations; iter++) {
    const newPosition = Array(n).fill(0);

    // Matrix multiplication with damping
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newPosition[i] += dampingFactor * transition[j][i] * position[j];
      }
      // Add teleportation probability
      newPosition[i] += (1 - dampingFactor) / n;
    }

    // Check convergence
    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff += Math.abs(newPosition[i] - position[i]);
    }

    position = newPosition;

    if (diff < tolerance) {
      break;
    }
  }

  // Normalize to sum to 1
  const sum = position.reduce((a, b) => a + b, 0);
  position = position.map(p => p / sum);

  // Build result map
  const result = new Map();
  agentList.forEach((did, i) => {
    result.set(did, position[i]);
  });

  return result;
}

/**
 * Compute position for a single agent (local estimation).
 *
 * This is faster than full computation but less accurate.
 * Useful for agents to estimate their own position without
 * access to the full graph.
 *
 * @param {string} agentDid - The agent's DID
 * @param {Array} edges - Edges involving this agent
 * @param {Map} knownPositions - Known positions of counterparties
 * @returns {number} Estimated position score
 */
function estimateLocalPosition(agentDid, edges, knownPositions = new Map()) {
  const agentEdges = edges.filter(e =>
    (e.from === agentDid || e.to === agentDid) &&
    isBilateral(e) &&
    (e.state === 'active' || e.state === 'fulfilled')
  );

  if (agentEdges.length === 0) {
    return 0;
  }

  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;

  agentEdges.forEach(edge => {
    const counterparty = edge.from === agentDid ? edge.to : edge.from;
    const counterpartyPosition = knownPositions.get(counterparty) || 0.1; // Default non-zero
    const edgeWeight = computeEffectiveWeight(edge, now);

    weightedSum += edgeWeight * counterpartyPosition;
    totalWeight += edgeWeight;
  });

  // Position is weighted average of counterparty positions
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Compute position change if an edge were added/strengthened.
 *
 * Useful for agents to evaluate potential relationships.
 *
 * @param {string} agentDid - The agent's DID
 * @param {Object} potentialEdge - The potential new edge
 * @param {Array} currentEdges - Current edges
 * @returns {Object} Position impact analysis
 */
function analyzePositionImpact(agentDid, potentialEdge, currentEdges) {
  // Current position
  const currentPositions = computePositions(currentEdges);
  const currentPosition = currentPositions.get(agentDid) || 0;

  // Position with new edge
  const newEdges = [...currentEdges, potentialEdge];
  const newPositions = computePositions(newEdges);
  const newPosition = newPositions.get(agentDid) || 0;

  const counterparty = potentialEdge.from === agentDid
    ? potentialEdge.to
    : potentialEdge.from;

  return {
    currentPosition,
    projectedPosition: newPosition,
    absoluteChange: newPosition - currentPosition,
    percentageChange: currentPosition > 0
      ? ((newPosition - currentPosition) / currentPosition) * 100
      : Infinity,
    counterpartyPosition: currentPositions.get(counterparty) || 0,
    recommendation: newPosition > currentPosition ? 'beneficial' : 'neutral_or_negative'
  };
}

// ============================================================================
// SYBIL DETECTION
// ============================================================================

/**
 * Detect potential Sybil clusters.
 *
 * Sybil agents typically have:
 * - Few edges outside their cluster
 * - All edges within cluster are to low-position agents
 * - Rapid edge creation without time-weighting
 *
 * @param {Array} edges - All edges
 * @param {Object} options - Detection options
 * @returns {Array} Suspected Sybil clusters
 */
function detectSybilClusters(edges, options = {}) {
  const {
    minClusterSize = 3,
    maxExternalEdgeRatio = 0.2,
    positionThreshold = 0.01
  } = options;

  const positions = computePositions(edges);
  const suspectedClusters = [];

  // Find low-position agents
  const lowPositionAgents = [];
  positions.forEach((pos, did) => {
    if (pos < positionThreshold) {
      lowPositionAgents.push(did);
    }
  });

  // Build adjacency list for low-position agents
  const adjacency = new Map();
  lowPositionAgents.forEach(did => adjacency.set(did, new Set()));

  edges.forEach(edge => {
    if (!isBilateral(edge)) return;

    const fromLow = lowPositionAgents.includes(edge.from);
    const toLow = lowPositionAgents.includes(edge.to);

    if (fromLow && toLow) {
      adjacency.get(edge.from).add(edge.to);
      adjacency.get(edge.to).add(edge.from);
    }
  });

  // Find connected components among low-position agents
  const visited = new Set();

  function dfs(did, cluster) {
    if (visited.has(did)) return;
    visited.add(did);
    cluster.push(did);

    const neighbors = adjacency.get(did) || new Set();
    neighbors.forEach(neighbor => dfs(neighbor, cluster));
  }

  lowPositionAgents.forEach(did => {
    if (!visited.has(did)) {
      const cluster = [];
      dfs(did, cluster);

      if (cluster.length >= minClusterSize) {
        // Check external edge ratio
        let internalEdges = 0;
        let externalEdges = 0;

        edges.forEach(edge => {
          if (!isBilateral(edge)) return;

          const fromIn = cluster.includes(edge.from);
          const toIn = cluster.includes(edge.to);

          if (fromIn && toIn) {
            internalEdges++;
          } else if (fromIn || toIn) {
            externalEdges++;
          }
        });

        const ratio = externalEdges / (internalEdges + externalEdges + 1);

        if (ratio < maxExternalEdgeRatio) {
          suspectedClusters.push({
            agents: cluster,
            internalEdges,
            externalEdges,
            externalRatio: ratio,
            avgPosition: cluster.reduce((sum, did) =>
              sum + (positions.get(did) || 0), 0) / cluster.length,
            confidence: 1 - ratio
          });
        }
      }
    }
  });

  return suspectedClusters;
}

// ============================================================================
// POSITION ATTESTATION
// ============================================================================

/**
 * Create a position attestation (proves position without revealing all edges).
 *
 * This is a simplified version. Full ZK implementation requires zkSNARKs.
 *
 * @param {string} agentDid - The agent's DID
 * @param {Array} edges - Agent's edges
 * @param {Map} positions - Computed positions
 * @param {Function} signFn - Signing function
 * @returns {Object} Position attestation
 */
function createPositionAttestation(agentDid, edges, positions, signFn) {
  const agentEdges = getAgentEdges(agentDid, edges);
  const position = positions.get(agentDid) || 0;

  const attestation = {
    attestationType: 'position',
    agentDid,
    timestamp: Date.now(),

    // Position claim
    position: {
      value: position,
      rank: computeRank(agentDid, positions),
      percentile: computePercentile(agentDid, positions)
    },

    // Summary stats (without revealing specific edges)
    edgeStats: {
      totalEdges: agentEdges.length,
      activeEdges: agentEdges.filter(e => e.state === 'active').length,
      fulfilledEdges: agentEdges.filter(e => e.state === 'fulfilled').length,
      totalWeight: agentEdges.reduce((sum, e) =>
        sum + computeEffectiveWeight(e), 0),
      oldestEdgeAge: Math.min(...agentEdges.map(e => Date.now() - e.created)),
      avgEdgeAge: agentEdges.reduce((sum, e) =>
        sum + (Date.now() - e.created), 0) / agentEdges.length
    },

    // Merkle root of edges (for verification without revealing)
    edgeMerkleRoot: computeEdgeMerkleRoot(agentEdges)
  };

  // Sign the attestation
  const message = JSON.stringify(attestation);
  attestation.signature = signFn(message);

  return attestation;
}

/**
 * Verify a position attestation.
 *
 * Note: Full verification requires access to edges or ZK proof.
 * This verifies the signature and consistency only.
 */
function verifyPositionAttestation(attestation, verifyFn) {
  const { signature, ...content } = attestation;
  const message = JSON.stringify(content);

  return {
    signatureValid: verifyFn(message, signature, attestation.agentDid),
    statsConsistent: attestation.edgeStats.activeEdges +
      attestation.edgeStats.fulfilledEdges <= attestation.edgeStats.totalEdges
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function computeRank(agentDid, positions) {
  const sorted = Array.from(positions.entries())
    .sort((a, b) => b[1] - a[1]);

  const index = sorted.findIndex(([did]) => did === agentDid);
  return index + 1;
}

function computePercentile(agentDid, positions) {
  const rank = computeRank(agentDid, positions);
  const total = positions.size;
  return ((total - rank) / total) * 100;
}

function computeEdgeMerkleRoot(edges) {
  if (edges.length === 0) return null;

  const crypto = require('crypto');
  const hashes = edges.map(e =>
    crypto.createHash('sha256')
      .update(e.edgeId + e.edgeHash)
      .digest('hex')
  );

  // Simple merkle root (could be optimized)
  while (hashes.length > 1) {
    const newLevel = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      newLevel.push(
        crypto.createHash('sha256')
          .update(left + right)
          .digest('hex')
      );
    }
    hashes.length = 0;
    hashes.push(...newLevel);
  }

  return hashes[0];
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core computation
  computePositions,
  estimateLocalPosition,
  analyzePositionImpact,

  // Sybil detection
  detectSybilClusters,

  // Attestation
  createPositionAttestation,
  verifyPositionAttestation,

  // Helpers
  computeRank,
  computePercentile
};
