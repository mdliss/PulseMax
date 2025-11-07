/**
 * SSE Endpoint: Real-Time Alerts
 * Streams new alerts to connected clients as they're created
 */

import { NextRequest } from 'next/server';
import { createIntervalStream, SSEStream } from '@/lib/sse/sseStream';
import { alertManager } from '@/lib/alerts/alertManager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface AlertUpdate {
  alerts: any[];
  stats: {
    active: number;
    acknowledged: number;
    resolved: number;
    total: number;
  };
  newAlerts: number;
  timestamp: string;
}

let lastAlertCount = 0;

async function getAlertUpdates(): Promise<AlertUpdate> {
  try {
    // Get all active alerts
    const activeAlerts = alertManager.getAlerts({ status: 'active' });

    // Get stats
    const stats = alertManager.getStatistics();

    // Check for new alerts
    const currentTotal = stats.total;
    const newAlerts = Math.max(0, currentTotal - lastAlertCount);
    lastAlertCount = currentTotal;

    return {
      alerts: activeAlerts.slice(0, 10), // Only send last 10 alerts
      stats: {
        active: stats.active,
        acknowledged: stats.acknowledged,
        resolved: stats.resolved,
        total: stats.total,
      },
      newAlerts,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return {
      alerts: [],
      stats: {
        active: 0,
        acknowledged: 0,
        resolved: 0,
        total: 0,
      },
      newAlerts: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function GET(request: NextRequest) {
  // Get interval from query params (default 3 seconds for alerts)
  const searchParams = request.nextUrl.searchParams;
  const interval = parseInt(searchParams.get('interval') || '3000', 10);

  // Validate interval (min 1s, max 30s for alerts - need faster updates)
  const validInterval = Math.min(Math.max(interval, 1000), 30000);

  // Reset last alert count on new connection
  lastAlertCount = alertManager.getStatistics().total;

  const stream = createIntervalStream(
    getAlertUpdates,
    validInterval,
    {
      heartbeatInterval: 30000,
      onError: (error) => {
        console.error('Alerts SSE error:', error);
      },
    }
  );

  return new Response(stream, {
    headers: SSEStream.getHeaders(),
  });
}
