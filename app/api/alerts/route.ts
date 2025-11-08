import { NextResponse } from 'next/server';
import { alertManager } from '@/lib/alerts/alertManager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts
 * Fetch alerts with optional filters
 *
 * Query params:
 * - status: active | acknowledged | resolved | dismissed
 * - severity: low | medium | high | critical
 * - type: anomaly | threshold | system | performance
 * - limit: number
 */
// Mock data generation
const severities = ['low', 'medium', 'high', 'critical'] as const;
const types = ['anomaly', 'threshold', 'system', 'performance'] as const;
const statuses = ['active', 'acknowledged', 'resolved'] as const;

const alertTitles = {
  anomaly: [
    'Unusual Session Pattern Detected',
    'Anomalous Booking Behavior',
    'Unexpected Traffic Spike',
    'Irregular Payment Activity'
  ],
  threshold: [
    'Session Volume Exceeded Threshold',
    'Response Time Threshold Breached',
    'Tutor Availability Below Minimum',
    'Customer Satisfaction Dropped'
  ],
  system: [
    'Database Connection Pool Saturated',
    'API Rate Limit Approaching',
    'Cache Hit Rate Degraded',
    'Memory Usage High'
  ],
  performance: [
    'Page Load Time Increased',
    'API Response Time Degraded',
    'Video Quality Issues Detected',
    'Search Performance Slow'
  ]
};

const alertMessages = {
  anomaly: [
    'Detected unusual session booking pattern - 300% increase in last hour',
    'Anomalous cancellation rate detected in Math tutoring sessions',
    'Unexpected surge in new customer registrations from specific region',
    'Irregular payment processing times observed'
  ],
  threshold: [
    'Session volume exceeded 85% capacity threshold - action required',
    'Average response time exceeded 2s threshold across all endpoints',
    'Available tutors dropped below minimum required level',
    'Customer satisfaction score dropped to 3.2/5.0'
  ],
  system: [
    'Database connection pool at 95% capacity - scaling recommended',
    'API rate limit approaching 80% - consider increasing quota',
    'Cache hit rate dropped to 45% - investigating cause',
    'Memory usage at 85% - possible memory leak detected'
  ],
  performance: [
    'Average page load time increased to 4.5s - 50% above baseline',
    'API response time degraded to 1.8s average - investigating',
    'Video quality complaints increased by 40% in last 2 hours',
    'Search query performance degraded - indexing may be required'
  ]
};

function generateMockAlert(index: number) {
  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const titleIndex = Math.floor(Math.random() * alertTitles[type].length);
  const title = alertTitles[type][titleIndex];
  const message = alertMessages[type][titleIndex];

  const createdAt = new Date(Date.now() - Math.random() * 86400000 * 2); // Last 2 days

  const alert: any = {
    id: `alert_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    title,
    message,
    source: type === 'system' ? 'Infrastructure Monitor' : type === 'performance' ? 'Performance Monitor' : type === 'anomaly' ? 'Anomaly Detector' : 'Threshold Monitor',
    metadata: {
      detectedAt: createdAt.toISOString(),
      environment: 'production',
      region: ['us-east-1', 'us-west-2', 'eu-west-1'][Math.floor(Math.random() * 3)],
      affectedUsers: Math.floor(Math.random() * 1000),
    },
    channels: ['email', 'slack'],
    status,
    createdAt: createdAt.toISOString(),
  };

  if (status === 'acknowledged' || status === 'resolved') {
    const ackTime = new Date(createdAt.getTime() + Math.random() * 3600000);
    alert.acknowledgedAt = ackTime.toISOString();
    alert.acknowledgedBy = ['admin', 'ops-team', 'support'][Math.floor(Math.random() * 3)];
  }

  if (status === 'resolved') {
    const resolveTime = new Date(createdAt.getTime() + Math.random() * 7200000);
    alert.resolvedAt = resolveTime.toISOString();
    alert.resolvedBy = ['admin', 'ops-team', 'support'][Math.floor(Math.random() * 3)];
  }

  return alert;
}

export async function GET(request: Request) {
  try {
    // Generate fresh mock data on each request
    const numAlerts = Math.floor(Math.random() * 8) + 3; // 3-10 alerts
    const alerts = Array.from({ length: numAlerts }, (_, i) => generateMockAlert(i));

    const statistics = {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      byType: {
        anomaly: alerts.filter(a => a.type === 'anomaly').length,
        threshold: alerts.filter(a => a.type === 'threshold').length,
        system: alerts.filter(a => a.type === 'system').length,
        performance: alerts.filter(a => a.type === 'performance').length,
      },
    };

    return NextResponse.json({
      alerts: alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      statistics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Create a new alert
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      severity,
      title,
      message,
      source,
      metadata = {},
      channels = ['dashboard']
    } = body;

    if (!type || !severity || !title || !message || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, title, message, source' },
        { status: 400 }
      );
    }

    const alert = await alertManager.createAlert(
      type,
      severity,
      title,
      message,
      source,
      metadata,
      channels
    );

    return NextResponse.json({
      alert,
      message: 'Alert created successfully',
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts/:id
 * Update alert status (acknowledge or resolve)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId, action, userId = 'system' } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, action' },
        { status: 400 }
      );
    }

    let success = false;

    switch (action) {
      case 'acknowledge':
        success = alertManager.acknowledgeAlert(alertId, userId);
        break;
      case 'resolve':
        success = alertManager.resolveAlert(alertId, userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "acknowledge" or "resolve"' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update alert. Alert not found or invalid status.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Alert ${action}d successfully`,
      alertId,
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
