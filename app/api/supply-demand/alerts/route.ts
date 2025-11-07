import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

interface SupplyDemandAlert {
  alertId?: string;
  type: 'supply_shortage' | 'demand_surge' | 'critical_imbalance' | 'capacity_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  predictedTime: string;
  predictedSessionVolume: number;
  predictedAvailableTutors: number;
  supplyDemandRatio: number;
  hoursUntil: number;
  message: string;
  recommendation: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

// Thresholds for alerts
const ALERT_THRESHOLDS = {
  CRITICAL_RATIO: 1.5, // 1.5x more demand than supply
  HIGH_RATIO: 1.2,
  MEDIUM_RATIO: 0.9,
  MINIMUM_VOLUME: 5 // Minimum session volume to trigger alerts
};

function generateAlertMessage(
  type: SupplyDemandAlert['type'],
  severity: SupplyDemandAlert['severity'],
  predictedVolume: number,
  predictedTutors: number,
  hoursUntil: number
): { message: string; recommendation: string } {
  const timeDesc = hoursUntil < 1 ? 'within the hour' : `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
  const shortage = predictedVolume - predictedTutors;

  let message = '';
  let recommendation = '';

  switch (type) {
    case 'critical_imbalance':
      message = `CRITICAL: Expected ${predictedVolume} sessions but only ${predictedTutors} tutors available ${timeDesc}`;
      recommendation = `Urgently activate ${Math.ceil(shortage)} additional tutors. Consider emergency notifications to on-call tutors.`;
      break;
    case 'supply_shortage':
      message = `Supply shortage predicted: ${predictedVolume} sessions expected vs ${predictedTutors} tutors ${timeDesc}`;
      recommendation = `Schedule ${Math.ceil(shortage)} more tutors. Send availability requests to part-time tutors.`;
      break;
    case 'demand_surge':
      message = `Demand surge expected: ${predictedVolume} sessions ${timeDesc} (${Math.round((predictedVolume / predictedTutors - 1) * 100)}% over capacity)`;
      recommendation = `Prepare for high volume. Brief tutors on quick session transitions. Enable waitlist if needed.`;
      break;
    case 'capacity_warning':
      message = `Approaching capacity: ${predictedVolume} sessions vs ${predictedTutors} tutors ${timeDesc}`;
      recommendation = `Monitor closely. Have backup tutors on standby.`;
      break;
  }

  return { message, recommendation };
}

export async function GET() {
  try {
    // Fetch predictions from the predict endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const predictResponse = await fetch(`${baseUrl}/api/supply-demand/predict?hours=24`);

    if (!predictResponse.ok) {
      throw new Error('Failed to fetch predictions');
    }

    const predictResult = await predictResponse.json();
    const predictions = predictResult.predictions;
    const now = new Date();

    const alerts: SupplyDemandAlert[] = [];

    // Analyze predictions and generate alerts
    predictions.forEach((prediction: any) => {
      const predictedTime = new Date(prediction.timestamp);
      const hoursUntil = Math.round((predictedTime.getTime() - now.getTime()) / (60 * 60 * 1000));

      // Skip if volume is too low to matter
      if (prediction.predictedSessionVolume < ALERT_THRESHOLDS.MINIMUM_VOLUME) {
        return;
      }

      const ratio = prediction.predictedSupplyDemandRatio;
      let alertType: SupplyDemandAlert['type'] | null = null;
      let severity: SupplyDemandAlert['severity'] = 'low';

      // Determine alert type and severity
      if (ratio >= ALERT_THRESHOLDS.CRITICAL_RATIO) {
        alertType = 'critical_imbalance';
        severity = 'critical';
      } else if (ratio >= ALERT_THRESHOLDS.HIGH_RATIO) {
        alertType = 'supply_shortage';
        severity = 'high';
      } else if (ratio >= ALERT_THRESHOLDS.MEDIUM_RATIO) {
        alertType = ratio > 1 ? 'demand_surge' : 'capacity_warning';
        severity = ratio > 1 ? 'medium' : 'low';
      }

      if (alertType) {
        const { message, recommendation } = generateAlertMessage(
          alertType,
          severity,
          prediction.predictedSessionVolume,
          prediction.predictedAvailableTutors,
          hoursUntil
        );

        alerts.push({
          type: alertType,
          severity,
          predictedTime: prediction.timestamp,
          predictedSessionVolume: prediction.predictedSessionVolume,
          predictedAvailableTutors: prediction.predictedAvailableTutors,
          supplyDemandRatio: ratio,
          hoursUntil,
          message,
          recommendation,
          createdAt: now.toISOString(),
          status: 'active'
        });
      }
    });

    // Sort by severity and hours until
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.hoursUntil - b.hoursUntil;
    });

    // Store critical alerts in database if Firebase is configured
    if (isFirebaseConfigured && db) {
      for (const alert of alerts.filter(a => a.severity === 'critical')) {
        try {
          const alertDoc = await addDoc(collection(db, 'supply_demand_alerts'), {
            ...alert,
            created_at: Timestamp.now(),
            acknowledged: false
          });
          alert.alertId = alertDoc.id;
        } catch (error) {
          console.error('Error storing alert:', error);
        }
      }
    }

    return NextResponse.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalCount: alerts.filter(a => a.severity === 'critical').length,
        highCount: alerts.filter(a => a.severity === 'high').length,
        mediumCount: alerts.filter(a => a.severity === 'medium').length,
        lowCount: alerts.filter(a => a.severity === 'low').length,
        nextCriticalAlert: alerts.find(a => a.severity === 'critical') || null
      },
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error generating supply-demand alerts:', error);
    return NextResponse.json(
      { error: 'Failed to generate alerts' },
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

    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({
        success: true,
        message: 'Alert acknowledged (mock mode)',
        alertId
      });
    }

    // Update alert status in database
    const alertsQuery = query(
      collection(db, 'supply_demand_alerts'),
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
