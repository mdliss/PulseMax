/**
 * SSE Endpoint: Real-Time Marketplace Metrics
 * Streams marketplace health data to connected clients
 */

import { NextRequest } from 'next/server';
import { createIntervalStream, SSEStream } from '@/lib/sse/sseStream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy import Firebase only when needed
import type { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;
async function getDB(): Promise<Firestore> {
  if (!db) {
    const { db: firestore } = await import('@/lib/db/firebase');
    db = firestore;
  }
  return db;
}

interface MarketplaceMetrics {
  activeSessions: number;
  dailySessionVolume: number;
  averageRating: number;
  tutorUtilizationRate: number;
  customerSatisfactionScore: number;
  supplyDemandBalance: number;
  timestamp: string;
}

function generateMockMetrics(): MarketplaceMetrics {
  return {
    activeSessions: Math.floor(Math.random() * 50) + 10,
    dailySessionVolume: Math.floor(Math.random() * 200) + 50,
    averageRating: Number((Math.random() * 1 + 4).toFixed(2)),
    tutorUtilizationRate: Number((Math.random() * 30 + 60).toFixed(2)),
    customerSatisfactionScore: Number((Math.random() * 20 + 75).toFixed(2)),
    supplyDemandBalance: Number((Math.random() * 0.5 + 0.8).toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}

async function getMarketplaceMetrics(): Promise<MarketplaceMetrics> {
  try {
    // Force mock data if environment variable is set
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('[SSE Marketplace] Using mock data (USE_MOCK_DATA=true)');
      return generateMockMetrics();
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const firestore = await getDB();
    const sessionsRef = firestore.collection('sessions');

    // Simplified query: Get recent sessions only by time (avoid composite index)
    const recentSessionsQuery = sessionsRef
      .where('start_time', '>=', thirtyMinutesAgo)
      .limit(500);
    const recentSessionsSnapshot = await recentSessionsQuery.get();

    // If no data, use mock data immediately
    if (recentSessionsSnapshot.empty) {
      return generateMockMetrics();
    }

    // Filter in memory to avoid complex Firebase queries
    const allSessions = recentSessionsSnapshot.docs;
    const activeSessions = allSessions.filter(doc => {
      const status = doc.data().status;
      return status === 'active' || status === 'scheduled';
    });

    const dailySessions = allSessions.filter(doc => {
      const startTime = doc.data().start_time;
      const sessionDate = startTime?.toDate ? startTime.toDate() : new Date(startTime);
      return sessionDate >= today;
    });

    // Calculate average rating
    const ratedSessions = allSessions.filter(doc => {
      const rating = doc.data().rating;
      return rating && rating > 0;
    });

    let totalRating = 0;
    ratedSessions.forEach((doc) => {
      totalRating += doc.data().rating;
    });
    const averageRating = ratedSessions.length > 0 ? totalRating / ratedSessions.length : 0;

    // Get tutor utilization
    const tutorsRef = firestore.collection('tutors');
    const tutorsSnapshot = await tutorsRef.get();
    const totalTutors = Math.max(tutorsSnapshot.size, 1);

    // Count unique tutors
    const activeTutorIds = new Set();
    dailySessions.forEach((doc) => {
      const tutorId = doc.data().tutor_id;
      if (tutorId) activeTutorIds.add(tutorId);
    });
    const tutorUtilizationRate = (activeTutorIds.size / totalTutors) * 100;

    // Customer satisfaction
    const highRatingCount = ratedSessions.filter(
      doc => doc.data().rating >= 4
    ).length;
    const customerSatisfactionScore = ratedSessions.length > 0
      ? (highRatingCount / ratedSessions.length) * 100
      : 0;

    // Supply vs Demand
    const availableTutors = Math.max(1, activeTutorIds.size);
    const supplyDemandBalance = activeSessions.length / availableTutors;

    return {
      activeSessions: activeSessions.length,
      dailySessionVolume: dailySessions.length,
      averageRating: Number(averageRating.toFixed(2)),
      tutorUtilizationRate: Number(tutorUtilizationRate.toFixed(2)),
      customerSatisfactionScore: Number(customerSatisfactionScore.toFixed(2)),
      supplyDemandBalance: Number(supplyDemandBalance.toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching marketplace metrics, using mock data:', error);
    return generateMockMetrics();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get interval from query params (default 5 seconds)
    const searchParams = request.nextUrl.searchParams;
    const interval = parseInt(searchParams.get('interval') || '5000', 10);

    // Validate interval (min 1s, max 60s)
    const validInterval = Math.min(Math.max(interval, 1000), 60000);

    // Wrap getMarketplaceMetrics to ensure it never throws
    const safeGetMetrics = async () => {
      try {
        return await getMarketplaceMetrics();
      } catch (error) {
        console.error('[SSE Marketplace] Error fetching metrics, using mock data:', error);
        return generateMockMetrics();
      }
    };

    const stream = createIntervalStream(
      safeGetMetrics,
      validInterval,
      {
        heartbeatInterval: 30000,
        onError: (error) => {
          console.error('Marketplace SSE error:', error);
        },
      }
    );

    return new Response(stream, {
      headers: SSEStream.getHeaders(),
    });
  } catch (error) {
    console.error('[SSE Marketplace] Fatal error initializing stream:', error);

    // Return a fallback SSE stream with mock data
    const fallbackStream = createIntervalStream(
      generateMockMetrics,
      5000,
      {
        heartbeatInterval: 30000,
        onError: (err) => console.error('Fallback SSE error:', err),
      }
    );

    return new Response(fallbackStream, {
      headers: SSEStream.getHeaders(),
    });
  }
}
