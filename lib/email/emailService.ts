import sgMail from '@sendgrid/mail';

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'alerts@pulsemax.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pulsemax.com';

export const isEmailConfigured = !!SENDGRID_API_KEY;

if (isEmailConfigured && SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailAlert {
  type: 'anomaly' | 'churn' | 'performance' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionUrl?: string;
  recipients?: string[];
}

class EmailService {
  async sendAlert(alert: EmailAlert): Promise<boolean> {
    if (!isEmailConfigured) {
      console.log('[Mock Email] Would send alert:', {
        to: alert.recipients || [ADMIN_EMAIL],
        subject: alert.subject,
        severity: alert.severity,
        type: alert.type
      });
      return true;
    }

    try {
      const html = this.generateAlertEmail(alert);
      const recipients = alert.recipients || [ADMIN_EMAIL];

      const msg = {
        to: recipients,
        from: FROM_EMAIL,
        subject: alert.subject,
        html,
      };

      await sgMail.send(msg);
      console.log(`Email alert sent to ${recipients.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  async sendAnomalyAlert(
    anomalyType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    currentValue: number,
    baselineValue: number,
    context: string,
    details?: Record<string, any>
  ): Promise<boolean> {
    const alert: EmailAlert = {
      type: 'anomaly',
      severity,
      subject: `[${severity.toUpperCase()}] Anomaly Detected: ${anomalyType}`,
      title: `Anomaly Detected in ${context}`,
      message: `A ${severity} severity anomaly has been detected in ${context}.\n\nCurrent Value: ${currentValue.toFixed(2)}\nBaseline Value: ${baselineValue.toFixed(2)}\nDeviation: ${((currentValue - baselineValue) / baselineValue * 100).toFixed(1)}%`,
      details,
      actionUrl: `${process.env.NEXTAUTH_URL}/dashboard?tab=anomalies`,
    };

    return this.sendAlert(alert);
  }

  async sendChurnAlert(
    customerId: string,
    customerName: string,
    churnProbability: number,
    riskLevel: string,
    riskFactors: string[]
  ): Promise<boolean> {
    const alert: EmailAlert = {
      type: 'churn',
      severity: churnProbability > 0.8 ? 'critical' : churnProbability > 0.6 ? 'high' : 'medium',
      subject: `[CHURN RISK] High risk customer: ${customerName}`,
      title: `Churn Risk Alert: ${customerName}`,
      message: `Customer "${customerName}" (ID: ${customerId}) has a ${(churnProbability * 100).toFixed(1)}% churn probability.\n\nRisk Level: ${riskLevel}\n\nTop Risk Factors:\n${riskFactors.slice(0, 5).map(f => `• ${f}`).join('\n')}`,
      details: { customerId, churnProbability, riskLevel, riskFactors },
      actionUrl: `${process.env.NEXTAUTH_URL}/churn-prediction?customerId=${customerId}`,
    };

    return this.sendAlert(alert);
  }

  async sendPerformanceAlert(
    metric: string,
    currentValue: number,
    threshold: number,
    context: string
  ): Promise<boolean> {
    const severity = currentValue < threshold * 0.5 ? 'critical' : currentValue < threshold * 0.7 ? 'high' : 'medium';

    const alert: EmailAlert = {
      type: 'performance',
      severity,
      subject: `[PERFORMANCE] ${metric} below threshold in ${context}`,
      title: `Performance Alert: ${metric}`,
      message: `${metric} has fallen below acceptable levels in ${context}.\n\nCurrent Value: ${currentValue.toFixed(2)}\nThreshold: ${threshold.toFixed(2)}\nPerformance: ${(currentValue / threshold * 100).toFixed(1)}% of target`,
      details: { metric, currentValue, threshold, context },
      actionUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
    };

    return this.sendAlert(alert);
  }

  private generateAlertEmail(alert: EmailAlert): string {
    const severityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    };

    const severityColor = severityColors[alert.severity];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background-color: ${severityColor}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                PulseMax Alert
              </h1>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <div style="display: inline-block; padding: 6px 12px; background-color: ${severityColor}; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                ${alert.severity} Severity
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 16px 32px 0;">
              <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">
                ${alert.title}
              </h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 16px 32px;">
              <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                ${alert.message}
              </p>
            </td>
          </tr>

          <!-- Details -->
          ${alert.details ? `
          <tr>
            <td style="padding: 16px 32px;">
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">
                  Additional Details
                </h3>
                ${Object.entries(alert.details).map(([key, value]) => `
                  <div style="margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 13px;">${this.formatKey(key)}:</span>
                    <span style="color: #111827; font-size: 13px; font-weight: 500; margin-left: 8px;">${this.formatValue(value)}</span>
                  </div>
                `).join('')}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Action Button -->
          ${alert.actionUrl ? `
          <tr>
            <td style="padding: 24px 32px;">
              <a href="${alert.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View in Dashboard
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated alert from PulseMax. You are receiving this because you are subscribed to ${alert.type} alerts.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} PulseMax. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}

export const emailService = new EmailService();
