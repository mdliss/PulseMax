import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { generateMockSuccessTracking } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

interface SuccessRate {
  tutorId: string;
  tutorName: string;
  subject: string;
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
}

interface CustomerSegmentRate {
  segment: string;
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
}

export async function GET(request: Request) {
  try {
    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(generateMockSuccessTracking());
    }

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');
    const subject = searchParams.get('subject');
    const segment = searchParams.get('segment');

    // Get all sessions
    let sessionsQuery = query(collection(db, 'sessions'));

    if (tutorId) {
      sessionsQuery = query(
        collection(db, 'sessions'),
        where('tutor_id', '==', tutorId)
      );
    }

    const sessionsSnapshot = await getDocs(sessionsQuery);

    // Calculate success rates by tutor and subject
    const tutorSubjectMap = new Map<string, {
      tutorName: string;
      subject: string;
      total: number;
      successful: number;
    }>();

    // Calculate success rates by customer segment
    const segmentMap = new Map<string, {
      total: number;
      successful: number;
    }>();

    sessionsSnapshot.forEach(doc => {
      const data = doc.data();

      // Filter by subject if specified
      if (subject && data.subject !== subject) return;

      // Filter by segment if specified
      if (segment && data.customer_segment !== segment) return;

      // Count first sessions only
      if (data.is_first_session === true) {
        const key = `${data.tutor_id}_${data.subject}`;

        if (!tutorSubjectMap.has(key)) {
          tutorSubjectMap.set(key, {
            tutorName: data.tutor_name || 'Unknown',
            subject: data.subject || 'Unknown',
            total: 0,
            successful: 0
          });
        }

        const entry = tutorSubjectMap.get(key)!;
        entry.total++;

        // Consider session successful if completed with rating >= 4
        if (data.status === 'completed' && data.rating >= 4) {
          entry.successful++;
        }

        // Track by customer segment
        const customerSegment = data.customer_segment || 'Unknown';
        if (!segmentMap.has(customerSegment)) {
          segmentMap.set(customerSegment, { total: 0, successful: 0 });
        }
        const segmentEntry = segmentMap.get(customerSegment)!;
        segmentEntry.total++;
        if (data.status === 'completed' && data.rating >= 4) {
          segmentEntry.successful++;
        }
      }
    });

    // Convert to arrays and calculate success rates
    const successRatesByTutorSubject: SuccessRate[] = Array.from(
      tutorSubjectMap.entries()
    ).map(([key, value]) => {
      const [tutorId, subject] = key.split('_');
      return {
        tutorId,
        tutorName: value.tutorName,
        subject,
        totalSessions: value.total,
        successfulSessions: value.successful,
        successRate: value.total > 0
          ? parseFloat(((value.successful / value.total) * 100).toFixed(2))
          : 0
      };
    });

    const successRatesBySegment: CustomerSegmentRate[] = Array.from(
      segmentMap.entries()
    ).map(([segment, value]) => ({
      segment,
      totalSessions: value.total,
      successfulSessions: value.successful,
      successRate: value.total > 0
        ? parseFloat(((value.successful / value.total) * 100).toFixed(2))
        : 0
    }));

    // Calculate overall success rate
    let totalFirstSessions = 0;
    let totalSuccessful = 0;
    tutorSubjectMap.forEach(value => {
      totalFirstSessions += value.total;
      totalSuccessful += value.successful;
    });

    const overallSuccessRate = totalFirstSessions > 0
      ? parseFloat(((totalSuccessful / totalFirstSessions) * 100).toFixed(2))
      : 0;

    return NextResponse.json({
      overallSuccessRate,
      totalFirstSessions,
      totalSuccessful,
      byTutorAndSubject: successRatesByTutorSubject.sort(
        (a, b) => b.successRate - a.successRate
      ),
      byCustomerSegment: successRatesBySegment.sort(
        (a, b) => b.successRate - a.successRate
      ),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching success tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch success tracking data' },
      { status: 500 }
    );
  }
}
