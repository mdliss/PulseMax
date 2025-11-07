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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: any = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('severity')) {
      filters.severity = searchParams.get('severity');
    }
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type');
    }
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    const alerts = alertManager.getAlerts(filters);
    const stats = alertManager.getStatistics();

    return NextResponse.json({
      alerts,
      statistics: stats,
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
