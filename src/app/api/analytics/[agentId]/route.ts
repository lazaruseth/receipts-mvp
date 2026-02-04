import { NextRequest, NextResponse } from 'next/server';
import { generateAnalytics } from '@/lib/analytics-engine';

/**
 * GET /api/analytics/[agentId]
 *
 * Get full performance analytics for an agent.
 * Shows score breakdown, opportunities, trajectory, and benchmarks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const analytics = generateAnalytics(agentId);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
