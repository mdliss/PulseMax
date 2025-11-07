/**
 * Test Alert Generator
 * Utility to create sample alerts for testing the alert history dashboard
 */

import { alertManager } from './alertManager';

export async function generateTestAlerts() {
  const alerts = [];

  // Create various test alerts with different severities and types
  alerts.push(
    await alertManager.createAlert(
      'anomaly',
      'critical',
      'Critical: First Session Success Rate Drop',
      'First session success rate has dropped to 45% (expected 75%). Immediate attention required.',
      'anomaly-detector',
      {
        tutorId: 'T123',
        subject: 'Math',
        currentRate: 45,
        expectedRate: 75,
        threshold: 60,
      },
      ['dashboard', 'email']
    )
  );

  alerts.push(
    await alertManager.createAlert(
      'performance',
      'high',
      'High Tutor Availability Issue',
      'Available tutor count is below threshold during peak hours.',
      'supply-demand-monitor',
      {
        hour: 18,
        availableTutors: 15,
        requiredTutors: 35,
        shortfall: 20,
      },
      ['dashboard', 'email']
    )
  );

  alerts.push(
    await alertManager.createAlert(
      'threshold',
      'medium',
      'Customer Health Score Declining',
      'Customer C456 health score dropped from 85 to 62 in the last 7 days.',
      'health-scoring-system',
      {
        customerId: 'C456',
        previousScore: 85,
        currentScore: 62,
        trend: 'declining',
      },
      ['dashboard']
    )
  );

  alerts.push(
    await alertManager.createAlert(
      'system',
      'low',
      'Data Sync Delay Detected',
      'Rails API sync experienced a 5-minute delay. Data is now current.',
      'data-ingestion-service',
      {
        delayMinutes: 5,
        lastSyncTime: new Date(Date.now() - 5 * 60000).toISOString(),
        recordsProcessed: 1247,
      },
      ['dashboard']
    )
  );

  alerts.push(
    await alertManager.createAnomalyAlert(
      'Statistical Outlier',
      'high',
      125,
      75,
      'Session Volume',
      {
        hour: 14,
        percentageIncrease: 67,
        detectionMethod: 'ensemble',
      }
    )
  );

  console.log(`Created ${alerts.length} test alerts`);
  return alerts;
}

export async function acknowledgeRandomAlerts() {
  const alerts = alertManager.getActiveAlerts();
  const toAcknowledge = Math.floor(alerts.length * 0.3); // Acknowledge 30% of active alerts

  for (let i = 0; i < toAcknowledge; i++) {
    alertManager.acknowledgeAlert(alerts[i].id, 'test-user');
  }

  console.log(`Acknowledged ${toAcknowledge} alerts`);
}

export async function resolveRandomAlerts() {
  const alerts = alertManager.getAlerts({ status: 'acknowledged' });
  const toResolve = Math.floor(alerts.length * 0.5); // Resolve 50% of acknowledged alerts

  for (let i = 0; i < toResolve; i++) {
    alertManager.resolveAlert(alerts[i].id, 'test-user');
  }

  console.log(`Resolved ${toResolve} alerts`);
}

export async function createTestAlertScenario() {
  console.log('Creating test alert scenario...');

  await generateTestAlerts();

  // Wait a bit then acknowledge some
  setTimeout(async () => {
    await acknowledgeRandomAlerts();
  }, 2000);

  // Wait a bit more then resolve some
  setTimeout(async () => {
    await resolveRandomAlerts();
  }, 4000);

  console.log('Test scenario complete');
}
