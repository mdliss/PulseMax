import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { generateMockAnomalyDetection } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

interface Anomaly {
  type: 'success_rate_drop' | 'low_performance' | 'high_volatility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tutorId?: string;
  tutorName?: string;
  subject?: string;
  segment?: string;
  currentValue: number;
  baselineValue: number;
  threshold: number;
  message: string;
  detectedAt: string;
}

// Thresholds for anomaly detection
const THRESHOLDS = {
  SUCCESS_RATE_DROP_CRITICAL: 20, // 20% drop from baseline
  SUCCESS_RATE_DROP_HIGH: 15,
  SUCCESS_RATE_DROP_MEDIUM: 10,
  LOW_PERFORMANCE_CRITICAL: 50,
  LOW_PERFORMANCE_HIGH: 60,
  LOW_PERFORMANCE_MEDIUM: 70,
  VOLATILITY_THRESHOLD: 25 // Standard deviation threshold
};

export async function GET() {
  try {
    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(generateMockAnomalyDetection());
    }

    const anomalies: Anomaly[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get recent sessions (last 7 days)
    const recentSessionsQuery = query(
      collection(db, 'sessions'),
      where('created_at', '>=', Timestamp.fromDate(sevenDaysAgo)),
      where('is_first_session', '==', true)
    );
    const recentSessionsSnapshot = await getDocs(recentSessionsQuery);

    // Get baseline sessions (30 days ago to 7 days ago)
    const baselineSessionsQuery = query(
      collection(db, 'sessions'),
      where('created_at', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      where('created_at', '<', Timestamp.fromDate(sevenDaysAgo)),
      where('is_first_session', '==', true)
    );
    const baselineSessionsSnapshot = await getDocs(baselineSessionsQuery);

    // Calculate success rates for recent period
    const recentRates = calculateSuccessRates(recentSessionsSnapshot);
    const baselineRates = calculateSuccessRates(baselineSessionsSnapshot);

    // Detect anomalies by tutor and subject
    for (const [key, recentRate] of recentRates.tutorSubject.entries()) {
      const baselineRate = baselineRates.tutorSubject.get(key);

      if (baselineRate) {
        const drop = baselineRate.rate - recentRate.rate;

        // Check for significant drops
        if (drop >= THRESHOLDS.SUCCESS_RATE_DROP_CRITICAL) {
          anomalies.push({
            type: 'success_rate_drop',
            severity: 'critical',
            tutorId: recentRate.tutorId,
            tutorName: recentRate.tutorName,
            subject: recentRate.subject,
            currentValue: recentRate.rate,
            baselineValue: baselineRate.rate,
            threshold: THRESHOLDS.SUCCESS_RATE_DROP_CRITICAL,
            message: `Critical drop in success rate for ${recentRate.tutorName} in ${recentRate.subject}: ${recentRate.rate.toFixed(1)}% (baseline: ${baselineRate.rate.toFixed(1)}%)`,
            detectedAt: now.toISOString()
          });
        } else if (drop >= THRESHOLDS.SUCCESS_RATE_DROP_HIGH) {
          anomalies.push({
            type: 'success_rate_drop',
            severity: 'high',
            tutorId: recentRate.tutorId,
            tutorName: recentRate.tutorName,
            subject: recentRate.subject,
            currentValue: recentRate.rate,
            baselineValue: baselineRate.rate,
            threshold: THRESHOLDS.SUCCESS_RATE_DROP_HIGH,
            message: `High drop in success rate for ${recentRate.tutorName} in ${recentRate.subject}: ${recentRate.rate.toFixed(1)}% (baseline: ${baselineRate.rate.toFixed(1)}%)`,
            detectedAt: now.toISOString()
          });
        } else if (drop >= THRESHOLDS.SUCCESS_RATE_DROP_MEDIUM) {
          anomalies.push({
            type: 'success_rate_drop',
            severity: 'medium',
            tutorId: recentRate.tutorId,
            tutorName: recentRate.tutorName,
            subject: recentRate.subject,
            currentValue: recentRate.rate,
            baselineValue: baselineRate.rate,
            threshold: THRESHOLDS.SUCCESS_RATE_DROP_MEDIUM,
            message: `Moderate drop in success rate for ${recentRate.tutorName} in ${recentRate.subject}: ${recentRate.rate.toFixed(1)}% (baseline: ${baselineRate.rate.toFixed(1)}%)`,
            detectedAt: now.toISOString()
          });
        }
      }

      // Check for consistently low performance
      if (recentRate.total >= 5) { // Only if sufficient sample size
        if (recentRate.rate < THRESHOLDS.LOW_PERFORMANCE_CRITICAL) {
          anomalies.push({
            type: 'low_performance',
            severity: 'critical',
            tutorId: recentRate.tutorId,
            tutorName: recentRate.tutorName,
            subject: recentRate.subject,
            currentValue: recentRate.rate,
            baselineValue: THRESHOLDS.LOW_PERFORMANCE_CRITICAL,
            threshold: THRESHOLDS.LOW_PERFORMANCE_CRITICAL,
            message: `Critical low performance for ${recentRate.tutorName} in ${recentRate.subject}: ${recentRate.rate.toFixed(1)}% success rate`,
            detectedAt: now.toISOString()
          });
        } else if (recentRate.rate < THRESHOLDS.LOW_PERFORMANCE_HIGH) {
          anomalies.push({
            type: 'low_performance',
            severity: 'high',
            tutorId: recentRate.tutorId,
            tutorName: recentRate.tutorName,
            subject: recentRate.subject,
            currentValue: recentRate.rate,
            baselineValue: THRESHOLDS.LOW_PERFORMANCE_HIGH,
            threshold: THRESHOLDS.LOW_PERFORMANCE_HIGH,
            message: `Low performance for ${recentRate.tutorName} in ${recentRate.subject}: ${recentRate.rate.toFixed(1)}% success rate`,
            detectedAt: now.toISOString()
          });
        }
      }
    }

    // Detect anomalies by customer segment
    for (const [segment, recentRate] of recentRates.segment.entries()) {
      const baselineRate = baselineRates.segment.get(segment);

      if (baselineRate) {
        const drop = baselineRate.rate - recentRate.rate;

        if (drop >= THRESHOLDS.SUCCESS_RATE_DROP_HIGH) {
          anomalies.push({
            type: 'success_rate_drop',
            severity: drop >= THRESHOLDS.SUCCESS_RATE_DROP_CRITICAL ? 'critical' : 'high',
            segment,
            currentValue: recentRate.rate,
            baselineValue: baselineRate.rate,
            threshold: THRESHOLDS.SUCCESS_RATE_DROP_HIGH,
            message: `Significant drop in success rate for ${segment} segment: ${recentRate.rate.toFixed(1)}% (baseline: ${baselineRate.rate.toFixed(1)}%)`,
            detectedAt: now.toISOString()
          });
        }
      }
    }

    // Store critical anomalies in database for alerting
    for (const anomaly of anomalies.filter(a => a.severity === 'critical')) {
      await addDoc(collection(db, 'anomaly_alerts'), {
        ...anomaly,
        created_at: Timestamp.now(),
        status: 'active',
        acknowledged: false
      });
    }

    return NextResponse.json({
      anomalies: anomalies.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      totalAnomalies: anomalies.length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length,
      highCount: anomalies.filter(a => a.severity === 'high').length,
      mediumCount: anomalies.filter(a => a.severity === 'medium').length,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}

function calculateSuccessRates(snapshot: any) {
  const tutorSubjectMap = new Map<string, {
    tutorId: string;
    tutorName: string;
    subject: string;
    total: number;
    successful: number;
    rate: number;
  }>();

  const segmentMap = new Map<string, {
    total: number;
    successful: number;
    rate: number;
  }>();

  snapshot.forEach((doc: any) => {
    const data = doc.data();
    const key = `${data.tutor_id}_${data.subject}`;

    if (!tutorSubjectMap.has(key)) {
      tutorSubjectMap.set(key, {
        tutorId: data.tutor_id,
        tutorName: data.tutor_name || 'Unknown',
        subject: data.subject || 'Unknown',
        total: 0,
        successful: 0,
        rate: 0
      });
    }

    const entry = tutorSubjectMap.get(key)!;
    entry.total++;
    if (data.status === 'completed' && data.rating >= 4) {
      entry.successful++;
    }
    entry.rate = (entry.successful / entry.total) * 100;

    // Track by segment
    const segment = data.customer_segment || 'Unknown';
    if (!segmentMap.has(segment)) {
      segmentMap.set(segment, { total: 0, successful: 0, rate: 0 });
    }
    const segmentEntry = segmentMap.get(segment)!;
    segmentEntry.total++;
    if (data.status === 'completed' && data.rating >= 4) {
      segmentEntry.successful++;
    }
    segmentEntry.rate = (segmentEntry.successful / segmentEntry.total) * 100;
  });

  return {
    tutorSubject: tutorSubjectMap,
    segment: segmentMap
  };
}
