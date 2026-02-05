import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tosUrl, merchantName } = body;

    if (!email || !tosUrl) {
      return NextResponse.json(
        { error: 'Email and ToS URL are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if already subscribed to this ToS
    const existing = await prisma.tosSubscription.findFirst({
      where: {
        email,
        tosUrl,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Already subscribed to this ToS' },
        { status: 200 }
      );
    }

    // Create subscription
    const subscription = await prisma.tosSubscription.create({
      data: {
        email,
        tosUrl,
        merchantName: merchantName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
      id: subscription.id,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

// Get subscriptions for a specific ToS (admin use)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tosUrl = searchParams.get('tosUrl');

  if (!tosUrl) {
    return NextResponse.json(
      { error: 'ToS URL required' },
      { status: 400 }
    );
  }

  const subscriptions = await prisma.tosSubscription.findMany({
    where: { tosUrl },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    count: subscriptions.length,
    subscriptions,
  });
}
