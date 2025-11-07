import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { generateMockMarketplaceHealth } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(generateMockMarketplaceHealth());
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get active sessions
    const activeSessionsQuery = query(
      collection(db, 'sessions'),
      where('status', '==', 'active')
    );
    const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
    const activeSessions = activeSessionsSnapshot.size;

    // Get today's session volume
    const todaySessionsQuery = query(
      collection(db, 'sessions'),
      where('created_at', '>=', Timestamp.fromDate(todayStart))
    );
    const todaySessionsSnapshot = await getDocs(todaySessionsQuery);
    const dailySessionVolume = todaySessionsSnapshot.size;

    // Calculate average session rating
    let totalRating = 0;
    let ratedSessions = 0;
    todaySessionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.rating) {
        totalRating += data.rating;
        ratedSessions++;
      }
    });
    const averageRating = ratedSessions > 0 ? totalRating / ratedSessions : 0;

    // Get tutor utilization
    const tutorsQuery = query(collection(db, 'tutors'));
    const tutorsSnapshot = await getDocs(tutorsQuery);
    let activeTutors = 0;
    tutorsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active' || data.status === 'in_session') {
        activeTutors++;
      }
    });
    const tutorUtilizationRate = tutorsSnapshot.size > 0
      ? (activeTutors / tutorsSnapshot.size) * 100
      : 0;

    // Get customer satisfaction from recent health scores
    const healthScoresQuery = query(
      collection(db, 'customer_health_scores'),
      where('calculated_at', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
    );
    const healthScoresSnapshot = await getDocs(healthScoresQuery);
    let totalHealthScore = 0;
    let scoreCount = 0;
    healthScoresSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.total_score) {
        totalHealthScore += data.total_score;
        scoreCount++;
      }
    });
    const customerSatisfactionScore = scoreCount > 0
      ? totalHealthScore / scoreCount
      : 0;

    // Calculate supply/demand balance
    const availableTutors = tutorsSnapshot.size - activeTutors;
    const waitingSessions = dailySessionVolume - activeSessions;
    const supplyDemandBalance = availableTutors > 0
      ? Math.min(100, (availableTutors / Math.max(waitingSessions, 1)) * 100)
      : 0;

    return NextResponse.json({
      activeSessions,
      dailySessionVolume,
      averageRating: parseFloat(averageRating.toFixed(2)),
      tutorUtilizationRate: parseFloat(tutorUtilizationRate.toFixed(2)),
      customerSatisfactionScore: parseFloat(customerSatisfactionScore.toFixed(2)),
      supplyDemandBalance: parseFloat(supplyDemandBalance.toFixed(2)),
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching marketplace health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace health metrics' },
      { status: 500 }
    );
  }
}
