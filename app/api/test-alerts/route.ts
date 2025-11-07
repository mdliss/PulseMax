import { NextResponse } from 'next/server';
import { generateTestAlerts } from '@/lib/alerts/testAlerts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-alerts
 * Generate test alerts for development
 */
export async function GET() {
  try {
    const alerts = await generateTestAlerts();

    return NextResponse.json({
      message: 'Test alerts generated successfully',
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error('Error generating test alerts:', error);
    return NextResponse.json(
      { error: 'Failed to generate test alerts' },
      { status: 500 }
    );
  }
}
