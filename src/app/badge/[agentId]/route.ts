import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/badges';

/**
 * GET /badge/[agentId]
 *
 * Returns an SVG badge for the agent's trust score
 * Can be embedded in READMEs and documentation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  const style = request.nextUrl.searchParams.get('style') || 'flat';

  // Default values for unknown agents
  const score = agent?.trustScore ?? '?';
  const tierName = agent?.tierName ?? 'Unknown';

  // Color based on trust score
  let scoreColor = '#6b7280'; // gray
  if (agent) {
    if (agent.trustScore >= 80) scoreColor = '#16a34a'; // green
    else if (agent.trustScore >= 60) scoreColor = '#2563eb'; // blue
    else if (agent.trustScore >= 40) scoreColor = '#ca8a04'; // yellow
    else scoreColor = '#dc2626'; // red
  }

  // Generate SVG badge
  const svg = generateBadgeSVG(score.toString(), tierName, scoreColor, style);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function generateBadgeSVG(
  score: string,
  tierName: string,
  scoreColor: string,
  style: string
): string {
  const labelWidth = 80;
  const scoreWidth = 50;
  const totalWidth = labelWidth + scoreWidth;
  const height = style === 'flat' ? 20 : 24;

  if (style === 'flat') {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>

  <clipPath id="round">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>

  <g clip-path="url(#round)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${scoreColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#smooth)"/>
  </g>

  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">RECEIPTS</text>
    <text x="${labelWidth / 2}" y="14">RECEIPTS</text>
    <text x="${labelWidth + scoreWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${score}</text>
    <text x="${labelWidth + scoreWidth / 2}" y="14">${score}</text>
  </g>
</svg>`.trim();
  }

  // Default: for-the-badge style
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth + 20}" height="${height}">
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
    <stop offset=".9" stop-opacity=".3"/>
    <stop offset="1" stop-opacity=".5"/>
  </linearGradient>

  <clipPath id="round">
    <rect width="${totalWidth + 20}" height="${height}" rx="4" fill="#fff"/>
  </clipPath>

  <g clip-path="url(#round)">
    <rect width="${labelWidth + 10}" height="${height}" fill="#555"/>
    <rect x="${labelWidth + 10}" width="${scoreWidth + 10}" height="${height}" fill="${scoreColor}"/>
    <rect width="${totalWidth + 20}" height="${height}" fill="url(#smooth)"/>
  </g>

  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="10" font-weight="bold" text-transform="uppercase">
    <text x="${(labelWidth + 10) / 2}" y="16">RECEIPTS</text>
    <text x="${labelWidth + 10 + (scoreWidth + 10) / 2}" y="16">${score}</text>
  </g>
</svg>`.trim();
}
