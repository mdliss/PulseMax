/**
 * Alert Management System
 * Handles creation, distribution, and tracking of anomaly alerts
 */

import { emailService } from '../email/emailService';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertChannel = 'dashboard' | 'email' | 'sms' | 'webhook';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  type: 'anomaly' | 'threshold' | 'system' | 'performance';
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  metadata: Record<string, any>;
  channels: AlertChannel[];
  status: AlertStatus;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  severity: AlertSeverity;
  channels: AlertChannel[];
  conditions: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
  }[];
  cooldownMinutes: number; // Minimum time between alerts for same rule
}

export class AlertManager {
  private static instance: AlertManager;
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();

  private constructor() {}

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Create and dispatch a new alert
   */
  async createAlert(
    type: Alert['type'],
    severity: AlertSeverity,
    title: string,
    message: string,
    source: string,
    metadata: Record<string, any> = {},
    channels: AlertChannel[] = ['dashboard']
  ): Promise<Alert> {
    const alertId = this.generateAlertId();

    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      source,
      metadata,
      channels,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.alerts.set(alertId, alert);

    // Dispatch to channels
    await this.dispatchAlert(alert);

    return alert;
  }

  /**
   * Create alert from anomaly detection
   */
  async createAnomalyAlert(
    anomalyType: string,
    severity: AlertSeverity,
    currentValue: number,
    expectedValue: number,
    metric: string,
    metadata: Record<string, any> = {}
  ): Promise<Alert> {
    const title = this.generateAnomalyTitle(anomalyType, metric, severity);
    const message = this.generateAnomalyMessage(
      anomalyType,
      metric,
      currentValue,
      expectedValue,
      severity
    );

    // Determine channels based on severity
    const channels = this.getChannelsForSeverity(severity);

    return this.createAlert(
      'anomaly',
      severity,
      title,
      message,
      'anomaly-detector',
      {
        anomalyType,
        metric,
        currentValue,
        expectedValue,
        ...metadata,
      },
      channels
    );
  }

  /**
   * Dispatch alert to configured channels
   */
  private async dispatchAlert(alert: Alert): Promise<void> {
    const dispatchers = alert.channels.map(async (channel) => {
      try {
        switch (channel) {
          case 'dashboard':
            await this.sendToDashboard(alert);
            break;
          case 'email':
            await this.sendEmail(alert);
            break;
          case 'webhook':
            await this.sendWebhook(alert);
            break;
          case 'sms':
            // SMS implementation placeholder
            console.log(`SMS alert: ${alert.title}`);
            break;
        }
      } catch (error) {
        console.error(`Failed to dispatch alert to ${channel}:`, error);
      }
    });

    await Promise.allSettled(dispatchers);
  }

  /**
   * Send alert to dashboard (store in memory/database)
   */
  private async sendToDashboard(alert: Alert): Promise<void> {
    // In production, this would store in Redis/Firebase for real-time dashboard updates
    console.log(`Dashboard alert created: ${alert.id}`);

    // Could use Firebase Firestore
    // await addDoc(collection(db, 'alerts'), alert);
  }

  /**
   * Send email alert
   */
  private async sendEmail(alert: Alert): Promise<void> {
    try {
      // Use the emailService to send alerts
      await emailService.sendAlert({
        type: alert.type === 'anomaly' ? 'anomaly' : alert.type === 'performance' ? 'performance' : 'system',
        severity: alert.severity,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        title: alert.title,
        message: alert.message,
        details: alert.metadata,
        actionUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
        recipients: process.env.ADMIN_EMAIL?.split(',').map(e => e.trim()),
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(alert: Alert): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log('Webhook URL not configured');
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Webhook dispatch failed:', error);
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;

    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = resolvedBy;

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity?: AlertSeverity): Alert[] {
    const alerts = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active');

    if (severity) {
      return alerts.filter(alert => alert.severity === severity);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get all alerts with optional filters
   */
  getAlerts(filters?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    type?: Alert['type'];
    limit?: number;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters?.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }
    if (filters?.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters?.type) {
      alerts = alerts.filter(a => a.type === filters.type);
    }

    // Sort by creation time (newest first)
    alerts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filters?.limit) {
      return alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  /**
   * Helper: Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Helper: Generate anomaly alert title
   */
  private generateAnomalyTitle(
    anomalyType: string,
    metric: string,
    severity: AlertSeverity
  ): string {
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    };

    return `${severityEmoji[severity]} ${severity.toUpperCase()}: ${anomalyType} in ${metric}`;
  }

  /**
   * Helper: Generate anomaly alert message
   */
  private generateAnomalyMessage(
    anomalyType: string,
    metric: string,
    currentValue: number,
    expectedValue: number,
    severity: AlertSeverity
  ): string {
    const deviation = ((currentValue - expectedValue) / expectedValue * 100).toFixed(1);
    const direction = currentValue > expectedValue ? 'above' : 'below';

    return `Anomaly detected in ${metric}: Current value ${currentValue.toFixed(2)} is ${Math.abs(parseFloat(deviation))}% ${direction} expected value of ${expectedValue.toFixed(2)}. Severity: ${severity}.`;
  }

  /**
   * Helper: Determine alert channels based on severity
   */
  private getChannelsForSeverity(severity: AlertSeverity): AlertChannel[] {
    switch (severity) {
      case 'critical':
        return ['dashboard', 'email', 'webhook'];
      case 'high':
        return ['dashboard', 'email'];
      case 'medium':
        return ['dashboard'];
      case 'low':
        return ['dashboard'];
      default:
        return ['dashboard'];
    }
  }

  /**
   * Helper: Format email body
   */
  private formatEmailBody(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px;">
            <h1 style="margin: 0;">${alert.title}</h1>
          </div>
          <div style="padding: 20px; background-color: #f5f5f5;">
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Source:</strong> ${alert.source}</p>
            <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
          </div>
          <div style="padding: 20px;">
            <h2>Message</h2>
            <p>${alert.message}</p>
            ${Object.keys(alert.metadata).length > 0 ? `
              <h3>Additional Details</h3>
              <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${JSON.stringify(alert.metadata, null, 2)}</pre>
            ` : ''}
          </div>
          <div style="padding: 20px; background-color: #f5f5f5; text-align: center;">
            <p style="color: #666; font-size: 12px;">
              This is an automated alert from PulseMax Monitoring System
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Helper: Get color for severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }

  /**
   * Get alert statistics
   */
  getStatistics() {
    const alerts = Array.from(this.alerts.values());

    return {
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
  }
}

export const alertManager = AlertManager.getInstance();
