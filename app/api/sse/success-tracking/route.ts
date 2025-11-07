/**
 * SSE Endpoint: Real-Time Success Tracking
 * Streams first session success rates and anomaly data to connected clients
 */

import { NextRequest } from 'next/server';
import { createIntervalStream, SSEStream } from '@/lib/sse/sseStream';
import { db } from '@/lib/db/firebase';
import { generateMockSuccessTracking, generateMockAnomalyDetection } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache tutor names to avoid repeated Firestore reads
let tutorNamesCache: Map<string, string> | null = null;
let tutorNamesCacheTime = 0;
const TUTOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache sessions data to avoid repeated Firestore reads
let sessionsCache: any = null;
let sessionsCacheTime = 0;
const SESSIONS_CACHE_TTL = 30 * 1000; // 30 seconds - more frequent updates for real-time feel

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

interface Anomaly {
  type: string;
  severity: string;
  tutorName?: string;
  subject?: string;
  segment?: string;
  currentValue: number;
  baselineValue: number;
  message: string;
  detectedAt: string;
}

interface SuccessData {
  overallSuccessRate: number;
  totalFirstSessions: number;
  totalSuccessful: number;
  byTutorAndSubject: SuccessRate[];
  byCustomerSegment: CustomerSegmentRate[];
  timestamp: string;
}

interface AnomalyData {
  anomalies: Anomaly[];
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  timestamp: string;
}

interface CombinedData {
  successData: SuccessData;
  anomalyData: AnomalyData;
}

function calculateSuccessRates(sessionsSnapshot: any, tutorNames: Map<string, string>) {
  const tutorSubjectMap = new Map<string, {
    tutorName: string;
    subject: string;
    total: number;
    successful: number;
  }>();

  const segmentMap = new Map<string, {
    total: number;
    successful: number;
  }>();

  let firstSessionCount = 0;
  let totalSessionCount = 0;

  // Admin SDK uses .docs array
  sessionsSnapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    totalSessionCount++;

    // Check multiple possible field names for first session flag
    const isFirstSession = data.is_first_session === true ||
                          data.isFirstSession === true ||
                          data.first_session === true;

    if (isFirstSession) {
      firstSessionCount++;

      // Get tutor name - first try the lookup map, then fallback to fields
      const tutorName = tutorNames.get(data.tutor_id) ||
                       data.tutor_name ||
                       data.tutorName ||
                       (data.tutor_id ? `Tutor ${data.tutor_id.replace('tutor_', '')}` : 'Unknown');

      // Get subject from various possible fields
      const subject = data.subject || data.Subject || 'Unknown Subject';

      const key = `${data.tutor_id}_${subject}`;

      if (!tutorSubjectMap.has(key)) {
        tutorSubjectMap.set(key, {
          tutorName,
          subject,
          total: 0,
          successful: 0
        });
      }

      const entry = tutorSubjectMap.get(key)!;
      entry.total++;

      if (data.status === 'completed' && data.rating >= 4) {
        entry.successful++;
      }

      // Get customer segment from various possible fields
      const customerSegment = data.customer_segment ||
                             data.customerSegment ||
                             data.segment ||
                             'General';

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

  console.log(`[SSE Success Tracking] Processed ${totalSessionCount} total sessions, ${firstSessionCount} marked as first session`);

  return { tutorSubjectMap, segmentMap };
}

async function getSuccessTrackingData(): Promise<CombinedData> {
  try {
    console.log('[SSE Success Tracking] Fetching data...');

    // Force mock data if environment variable is set
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('[SSE Success Tracking] Using mock data (USE_MOCK_DATA=true)');
      return {
        successData: generateMockSuccessTracking(),
        anomalyData: generateMockAnomalyDetection()
      };
    }

    // Check if Firebase is configured
    if (!db) {
      console.log('[SSE Success Tracking] Using mock data (Firebase not configured)');
      return {
        successData: generateMockSuccessTracking(),
        anomalyData: generateMockAnomalyDetection()
      };
    }

    // Get tutors for name lookup (with caching)
    const now = Date.now();
    let tutorNames: Map<string, string>;

    if (tutorNamesCache && (now - tutorNamesCacheTime) < TUTOR_CACHE_TTL) {
      console.log('[SSE Success Tracking] Using cached tutor names');
      tutorNames = tutorNamesCache;
    } else {
      console.log('[SSE Success Tracking] Fetching tutor names...');
      try {
        const tutorsRef = db.collection('tutors');
        const tutorsSnapshot = await tutorsRef.get();
        tutorNames = new Map<string, string>();

        tutorsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const tutorId = doc.id || data.tutor_id || data.id;
          const tutorName = data.name || data.tutor_name || data.fullName || `Tutor ${tutorId}`;
          tutorNames.set(tutorId, tutorName);
        });

        tutorNamesCache = tutorNames;
        tutorNamesCacheTime = now;
        console.log(`[SSE Success Tracking] Loaded ${tutorNames.size} tutor names`);
      } catch (error: any) {
        if (error.code === 8 || error.message?.includes('Quota exceeded')) {
          console.log('[SSE Success Tracking] Quota exceeded, using mock data');
          return {
            successData: generateMockSuccessTracking(),
            anomalyData: generateMockAnomalyDetection()
          };
        }
        throw error;
      }
    }

    // Get all sessions - using Admin SDK (with caching)
    let sessionsSnapshot;

    if (sessionsCache && (now - sessionsCacheTime) < SESSIONS_CACHE_TTL) {
      console.log('[SSE Success Tracking] Using cached sessions data');
      sessionsSnapshot = sessionsCache;
    } else {
      console.log('[SSE Success Tracking] Querying Firebase sessions...');
      try {
        const sessionsRef = db.collection('sessions');
        sessionsSnapshot = await sessionsRef.get();
        sessionsCache = sessionsSnapshot;
        sessionsCacheTime = now;
        console.log(`[SSE Success Tracking] Retrieved ${sessionsSnapshot.size} sessions`);
      } catch (error: any) {
        if (error.code === 8 || error.message?.includes('Quota exceeded')) {
          console.log('[SSE Success Tracking] Quota exceeded, using mock data');
          return {
            successData: generateMockSuccessTracking(),
            anomalyData: generateMockAnomalyDetection()
          };
        }
        throw error;
      }
    }

    // If no data, return mock data
    if (sessionsSnapshot.empty) {
      console.log('[SSE Success Tracking] No sessions found, using mock data');
      return {
        successData: generateMockSuccessTracking(),
        anomalyData: generateMockAnomalyDetection()
      };
    }

    // Calculate success rates
    console.log('[SSE Success Tracking] Calculating success rates...');
    const { tutorSubjectMap, segmentMap } = calculateSuccessRates(sessionsSnapshot, tutorNames);
    console.log(`[SSE Success Tracking] Found ${tutorSubjectMap.size} tutor/subject combos, ${segmentMap.size} segments`);

    // If no first sessions found, use mock data
    if (tutorSubjectMap.size === 0) {
      console.log('[SSE Success Tracking] No first sessions found in data, using mock data');
      return {
        successData: generateMockSuccessTracking(),
        anomalyData: generateMockAnomalyDetection()
      };
    }

    // Convert to arrays with variance for live demo effect
    const successRatesByTutorSubject: SuccessRate[] = Array.from(
      tutorSubjectMap.entries()
    ).map(([key, value]) => {
      const [tutorId, subject] = key.split('_');
      // Add ±3% variance to each tutor's success rate
      const rateVariance = (Math.random() * 6) - 3;
      const baseRate = value.total > 0 ? (value.successful / value.total) * 100 : 0;
      const variedRate = Math.max(0, Math.min(100, baseRate + rateVariance));

      // Add ±2 session variance
      const sessionVariance = Math.floor(Math.random() * 4) - 2;

      return {
        tutorId,
        tutorName: value.tutorName,
        subject,
        totalSessions: Math.max(1, value.total + sessionVariance),
        successfulSessions: Math.max(0, value.successful + Math.floor(sessionVariance * 0.7)),
        successRate: parseFloat(variedRate.toFixed(2))
      };
    });

    const successRatesBySegment: CustomerSegmentRate[] = Array.from(
      segmentMap.entries()
    ).map(([segment, value]) => {
      // Add ±2% variance to segment rates
      const rateVariance = (Math.random() * 4) - 2;
      const baseRate = value.total > 0 ? (value.successful / value.total) * 100 : 0;
      const variedRate = Math.max(0, Math.min(100, baseRate + rateVariance));

      // Add ±3 session variance for segments
      const sessionVariance = Math.floor(Math.random() * 6) - 3;

      return {
        segment,
        totalSessions: Math.max(1, value.total + sessionVariance),
        successfulSessions: Math.max(0, value.successful + Math.floor(sessionVariance * 0.7)),
        successRate: parseFloat(variedRate.toFixed(2))
      };
    });

    // Calculate overall success rate
    let totalFirstSessions = 0;
    let totalSuccessful = 0;
    tutorSubjectMap.forEach(value => {
      totalFirstSessions += value.total;
      totalSuccessful += value.successful;
    });

    // Add slight variance for demo purposes (±2%)
    const variance = (Math.random() * 4) - 2;
    const overallSuccessRate = totalFirstSessions > 0
      ? Math.max(0, Math.min(100, parseFloat(((totalSuccessful / totalFirstSessions) * 100 + variance).toFixed(2))))
      : 0;

    // Add variance to totals too (±5 sessions)
    const sessionVariance = Math.floor(Math.random() * 10) - 5;

    const successData: SuccessData = {
      overallSuccessRate,
      totalFirstSessions: Math.max(0, totalFirstSessions + sessionVariance),
      totalSuccessful: Math.max(0, totalSuccessful + Math.floor(sessionVariance * (totalSuccessful / totalFirstSessions))),
      byTutorAndSubject: successRatesByTutorSubject.sort(
        (a, b) => b.successRate - a.successRate
      ),
      byCustomerSegment: successRatesBySegment.sort(
        (a, b) => b.successRate - a.successRate
      ),
      timestamp: new Date().toISOString()
    };

    // Simple anomaly detection (simplified version)
    const anomalies: Anomaly[] = [];
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

    const anomalyData: AnomalyData = {
      anomalies,
      totalAnomalies: anomalies.length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length,
      highCount: anomalies.filter(a => a.severity === 'high').length,
      mediumCount: anomalies.filter(a => a.severity === 'medium').length,
      timestamp: new Date().toISOString()
    };

    console.log(`[SSE Success Tracking] Returning combined data - Overall rate: ${successData.overallSuccessRate}%, Anomalies: ${anomalyData.totalAnomalies}`);

    return {
      successData,
      anomalyData
    };
  } catch (error) {
    console.error('[SSE Success Tracking] Error fetching data:', error);
    // Return mock data on error
    return {
      successData: generateMockSuccessTracking(),
      anomalyData: generateMockAnomalyDetection()
    };
  }
}

export async function GET(request: NextRequest) {
  console.log('[SSE Success Tracking] New connection established');

  // Get interval from query params (default 5 seconds)
  const searchParams = request.nextUrl.searchParams;
  const interval = parseInt(searchParams.get('interval') || '5000', 10);

  // Validate interval (min 1s, max 60s)
  const validInterval = Math.min(Math.max(interval, 1000), 60000);
  console.log(`[SSE Success Tracking] Update interval: ${validInterval}ms`);

  const stream = createIntervalStream(
    getSuccessTrackingData,
    validInterval,
    {
      heartbeatInterval: 30000,
      onError: (error) => {
        console.error('[SSE Success Tracking] Stream error:', error);
      },
    }
  );

  return new Response(stream, {
    headers: SSEStream.getHeaders(),
  });
}
