import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testType = 'anomaly', recipient } = body;

    let result = false;

    switch (testType) {
      case 'anomaly':
        result = await emailService.sendAnomalyAlert(
          'success_rate_drop',
          'high',
          65.5,
          85.2,
          'Mathematics - Tutor John',
          {
            tutorId: 'tutor_123',
            subject: 'Mathematics',
            threshold: 15,
            detectedAt: new Date().toISOString()
          }
        );
        break;

      case 'churn':
        result = await emailService.sendChurnAlert(
          'customer_456',
          'Acme Corporation',
          0.85,
          'Critical',
          [
            'Declining session frequency (60% drop)',
            'Low average ratings (3.2/5)',
            'No sessions in last 14 days',
            'Canceled 3 scheduled sessions',
            'Support ticket opened'
          ]
        );
        break;

      case 'performance':
        result = await emailService.sendPerformanceAlert(
          'API Response Time',
          850,
          500,
          'Production Environment'
        );
        break;

      case 'custom':
        result = await emailService.sendAlert({
          type: 'system',
          severity: 'medium',
          subject: 'Test Alert from PulseMax',
          title: 'Test Alert',
          message: 'This is a test email to verify the email delivery system is working correctly.',
          details: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            requestedBy: session.user.email,
          },
          recipients: recipient ? [recipient] : undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message: result
        ? 'Test email sent successfully (or logged in mock mode)'
        : 'Failed to send test email',
      testType,
      mockMode: !process.env.SENDGRID_API_KEY,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
