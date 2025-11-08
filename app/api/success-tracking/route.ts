import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { generateMockSuccessTracking } from '@/lib/mockData';
import { getCached, setCache, CACHE_TTL } from '@/lib/cache/redis';

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
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');
    const subject = searchParams.get('subject');
    const segment = searchParams.get('segment');

    // Check cache first
    const cacheKey = `success-tracking:tutor:${tutorId || 'all'}:subject:${subject || 'all'}:segment:${segment || 'all'}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      const successData = generateMockSuccessTracking();

      // Generate anomaly data based on success rates
      const anomalies: any[] = [];
      successData.byTutorAndSubject.forEach(rate => {
        if (rate.successRate < 50 && rate.totalSessions >= 5) {
          anomalies.push({
            type: 'low_performance',
            severity: rate.successRate < 30 ? 'critical' : rate.successRate < 40 ? 'high' : 'medium',
            tutorName: rate.tutorName,
            subject: rate.subject,
            currentValue: rate.successRate,
            baselineValue: 70,
            message: `${rate.tutorName} success rate dropped in ${rate.subject}: ${rate.successRate.toFixed(1)}%`,
            detectedAt: new Date().toISOString()
          });
        }
      });

      const mockData = {
        successData,
        anomalyData: {
          anomalies,
          totalAnomalies: anomalies.length,
          criticalCount: anomalies.filter(a => a.severity === 'critical').length,
          highCount: anomalies.filter(a => a.severity === 'high').length,
          mediumCount: anomalies.filter(a => a.severity === 'medium').length,
          timestamp: new Date().toISOString()
        }
      };
      // Cache mock data (shorter TTL)
      await setCache(cacheKey, mockData, CACHE_TTL.METRICS);
      return NextResponse.json(mockData);
    }

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

    const successData = {
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
    };

    // Simple anomaly detection
    const anomalies: any[] = [];
    successRatesByTutorSubject.forEach(rate => {
      if (rate.successRate < 50 && rate.totalSessions >= 5) {
        anomalies.push({
          type: 'low_performance',
          severity: rate.successRate < 30 ? 'critical' : 'high',
          tutorName: rate.tutorName,
          subject: rate.subject,
          currentValue: rate.successRate,
          baselineValue: 70,
          message: `Low success rate for ${rate.tutorName} in ${rate.subject}: ${rate.successRate.toFixed(1)}%`,
          detectedAt: new Date().toISOString()
        });
      }
    });

    const anomalyData = {
      anomalies,
      totalAnomalies: anomalies.length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length,
      highCount: anomalies.filter(a => a.severity === 'high').length,
      mediumCount: anomalies.filter(a => a.severity === 'medium').length,
      timestamp: new Date().toISOString()
    };

    const responseData = {
      successData,
      anomalyData
    };

    // Cache the result (15 minute TTL)
    await setCache(cacheKey, responseData, CACHE_TTL.CUSTOMERS);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching success tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch success tracking data' },
      { status: 500 }
    );
  }
}
