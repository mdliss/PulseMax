import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { generateMockVelocityAlerts } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

interface VelocityAlert {
  alertId?: string;
  type: 'low_velocity' | 'declining_velocity' | 'inactive_customer';
  severity: 'low' | 'medium' | 'high' | 'critical';
  customerId: string;
  customerName: string;
  cohort: string;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  sessionsPerWeek: number;
  daysSinceLastSession: number;
  threshold: number;
  message: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

// Alert thresholds
const THRESHOLDS = {
  CRITICAL_INACTIVE_DAYS: 21,
  HIGH_INACTIVE_DAYS: 14,
  MEDIUM_INACTIVE_DAYS: 10,
  CRITICAL_VELOCITY: 0.25, // sessions per week
  HIGH_VELOCITY: 0.5,
  MEDIUM_VELOCITY: 1.0,
  DECLINE_RATE_CRITICAL: 0.5, // 50% decline
  DECLINE_RATE_HIGH: 0.7 // 30% decline
};

export async function GET() {
  try {
    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(generateMockVelocityAlerts());
    }

    const now = new Date();

    // Fetch velocity data from the session-velocity endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const velocityResponse = await fetch(`${baseUrl}/api/session-velocity`);

    if (!velocityResponse.ok) {
      throw new Error('Failed to fetch velocity data');
    }

    const velocityData = await velocityResponse.json();
    const alerts: VelocityAlert[] = [];

    // Analyze each customer for velocity issues
    for (const customer of velocityData.customerVelocities) {
      const lastSessionDate = new Date(customer.lastSessionDate);
      const daysSinceLastSession = Math.floor(
        (now.getTime() - lastSessionDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Check for inactive customers
      if (daysSinceLastSession >= THRESHOLDS.CRITICAL_INACTIVE_DAYS) {
        alerts.push({
          type: 'inactive_customer',
          severity: 'critical',
          customerId: customer.customerId,
          customerName: customer.customerName,
          cohort: customer.cohort,
          sessionsThisWeek: customer.sessionsThisWeek,
          sessionsLastWeek: customer.sessionsLastWeek,
          sessionsPerWeek: customer.sessionsPerWeek,
          daysSinceLastSession,
          threshold: THRESHOLDS.CRITICAL_INACTIVE_DAYS,
          message: `CRITICAL: ${customer.customerName} has been inactive for ${daysSinceLastSession} days`,
          createdAt: now.toISOString(),
          status: 'active'
        });
      } else if (daysSinceLastSession >= THRESHOLDS.HIGH_INACTIVE_DAYS) {
        alerts.push({
          type: 'inactive_customer',
          severity: 'high',
          customerId: customer.customerId,
          customerName: customer.customerName,
          cohort: customer.cohort,
          sessionsThisWeek: customer.sessionsThisWeek,
          sessionsLastWeek: customer.sessionsLastWeek,
          sessionsPerWeek: customer.sessionsPerWeek,
          daysSinceLastSession,
          threshold: THRESHOLDS.HIGH_INACTIVE_DAYS,
          message: `${customer.customerName} has been inactive for ${daysSinceLastSession} days`,
          createdAt: now.toISOString(),
          status: 'active'
        });
      } else if (daysSinceLastSession >= THRESHOLDS.MEDIUM_INACTIVE_DAYS) {
        alerts.push({
          type: 'inactive_customer',
          severity: 'medium',
          customerId: customer.customerId,
          customerName: customer.customerName,
          cohort: customer.cohort,
          sessionsThisWeek: customer.sessionsThisWeek,
          sessionsLastWeek: customer.sessionsLastWeek,
          sessionsPerWeek: customer.sessionsPerWeek,
          daysSinceLastSession,
          threshold: THRESHOLDS.MEDIUM_INACTIVE_DAYS,
          message: `${customer.customerName} has been inactive for ${daysSinceLastSession} days`,
          createdAt: now.toISOString(),
          status: 'active'
        });
      }

      // Check for low velocity
      if (customer.sessionsPerWeek < THRESHOLDS.CRITICAL_VELOCITY) {
        alerts.push({
          type: 'low_velocity',
          severity: 'critical',
          customerId: customer.customerId,
          customerName: customer.customerName,
          cohort: customer.cohort,
          sessionsThisWeek: customer.sessionsThisWeek,
          sessionsLastWeek: customer.sessionsLastWeek,
          sessionsPerWeek: customer.sessionsPerWeek,
          daysSinceLastSession,
          threshold: THRESHOLDS.CRITICAL_VELOCITY,
          message: `CRITICAL: ${customer.customerName} has very low session velocity (${customer.sessionsPerWeek.toFixed(2)} sessions/week)`,
          createdAt: now.toISOString(),
          status: 'active'
        });
      } else if (customer.sessionsPerWeek < THRESHOLDS.HIGH_VELOCITY) {
        alerts.push({
          type: 'low_velocity',
          severity: 'high',
          customerId: customer.customerId,
          customerName: customer.customerName,
          cohort: customer.cohort,
          sessionsThisWeek: customer.sessionsThisWeek,
          sessionsLastWeek: customer.sessionsLastWeek,
          sessionsPerWeek: customer.sessionsPerWeek,
          daysSinceLastSession,
          threshold: THRESHOLDS.HIGH_VELOCITY,
          message: `${customer.customerName} has low session velocity (${customer.sessionsPerWeek.toFixed(2)} sessions/week)`,
          createdAt: now.toISOString(),
          status: 'active'
        });
      } else if (customer.sessionsPerWeek < THRESHOLDS.MEDIUM_VELOCITY) {
        alerts.push({
          type: 'low_velocity',
          severity: 'medium',
          customerId: customer.customerId,
          customerName: customer.customerName,
          cohort: customer.cohort,
          sessionsThisWeek: customer.sessionsThisWeek,
          sessionsLastWeek: customer.sessionsLastWeek,
          sessionsPerWeek: customer.sessionsPerWeek,
          daysSinceLastSession,
          threshold: THRESHOLDS.MEDIUM_VELOCITY,
          message: `${customer.customerName} has below-average session velocity (${customer.sessionsPerWeek.toFixed(2)} sessions/week)`,
          createdAt: now.toISOString(),
          status: 'active'
        });
      }

      // Check for declining velocity
      if (customer.sessionsLastWeek > 0) {
        const declineRate = customer.sessionsThisWeek / customer.sessionsLastWeek;

        if (declineRate <= THRESHOLDS.DECLINE_RATE_CRITICAL) {
          alerts.push({
            type: 'declining_velocity',
            severity: 'critical',
            customerId: customer.customerId,
            customerName: customer.customerName,
            cohort: customer.cohort,
            sessionsThisWeek: customer.sessionsThisWeek,
            sessionsLastWeek: customer.sessionsLastWeek,
            sessionsPerWeek: customer.sessionsPerWeek,
            daysSinceLastSession,
            threshold: THRESHOLDS.DECLINE_RATE_CRITICAL,
            message: `CRITICAL: ${customer.customerName} sessions dropped ${((1 - declineRate) * 100).toFixed(0)}% this week`,
            createdAt: now.toISOString(),
            status: 'active'
          });
        } else if (declineRate <= THRESHOLDS.DECLINE_RATE_HIGH) {
          alerts.push({
            type: 'declining_velocity',
            severity: 'high',
            customerId: customer.customerId,
            customerName: customer.customerName,
            cohort: customer.cohort,
            sessionsThisWeek: customer.sessionsThisWeek,
            sessionsLastWeek: customer.sessionsLastWeek,
            sessionsPerWeek: customer.sessionsPerWeek,
            daysSinceLastSession,
            threshold: THRESHOLDS.DECLINE_RATE_HIGH,
            message: `${customer.customerName} sessions dropped ${((1 - declineRate) * 100).toFixed(0)}% this week`,
            createdAt: now.toISOString(),
            status: 'active'
          });
        }
      }
    }

    // Sort alerts by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Store critical alerts in database
    for (const alert of alerts.filter(a => a.severity === 'critical')) {
      try {
        const alertDoc = await addDoc(collection(db, 'velocity_alerts'), {
          ...alert,
          created_at: Timestamp.now(),
          acknowledged: false
        });
        alert.alertId = alertDoc.id;
      } catch (error) {
        console.error('Error storing alert:', error);
      }
    }

    return NextResponse.json({
      alerts,
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      highCount: alerts.filter(a => a.severity === 'high').length,
      mediumCount: alerts.filter(a => a.severity === 'medium').length,
      lowCount: alerts.filter(a => a.severity === 'low').length,
      atRiskCustomers: velocityData.atRiskCount,
      decreasingTrendCustomers: velocityData.decreasingCount,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error generating velocity alerts:', error);
    return NextResponse.json(
      { error: 'Failed to generate velocity alerts' },
      { status: 500 }
    );
  }
}

// Acknowledge an alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Update alert status in database
    const alertsQuery = query(
      collection(db, 'velocity_alerts'),
      where('__name__', '==', alertId)
    );

    const alertsSnapshot = await getDocs(alertsQuery);

    if (alertsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged',
      alertId
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
