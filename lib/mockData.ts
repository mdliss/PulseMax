// Mock data generators for demo purposes

export function generateMockMarketplaceHealth() {
  return {
    activeSessions: Math.floor(Math.random() * 50) + 20,
    dailySessionVolume: Math.floor(Math.random() * 200) + 100,
    averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(2)),
    tutorUtilizationRate: parseFloat((Math.random() * 30 + 60).toFixed(2)),
    customerSatisfactionScore: parseFloat((Math.random() * 20 + 70).toFixed(2)),
    supplyDemandBalance: parseFloat((Math.random() * 30 + 60).toFixed(2)),
    timestamp: new Date().toISOString()
  };
}

export function generateMockSuccessTracking() {
  const tutors = ['Sarah Johnson', 'Michael Chen', 'Emily Davis', 'James Wilson', 'Maria Garcia'];
  const subjects = ['Math', 'Science', 'English', 'History', 'Programming'];
  const segments = ['K-12', 'College', 'Professional', 'Test Prep'];

  const byTutorAndSubject = tutors.flatMap(tutor =>
    subjects.slice(0, Math.floor(Math.random() * 3) + 1).map(subject => ({
      tutorId: `tutor_${tutor.replace(/\s/g, '_').toLowerCase()}`,
      tutorName: tutor,
      subject,
      totalSessions: Math.floor(Math.random() * 50) + 10,
      successfulSessions: Math.floor(Math.random() * 40) + 5,
      successRate: parseFloat((Math.random() * 30 + 60).toFixed(2))
    }))
  ).sort((a, b) => b.successRate - a.successRate);

  const byCustomerSegment = segments.map(segment => ({
    segment,
    totalSessions: Math.floor(Math.random() * 100) + 50,
    successfulSessions: Math.floor(Math.random() * 80) + 30,
    successRate: parseFloat((Math.random() * 25 + 65).toFixed(2))
  }));

  const totalFirstSessions = byTutorAndSubject.reduce((sum, item) => sum + item.totalSessions, 0);
  const totalSuccessful = byTutorAndSubject.reduce((sum, item) => sum + item.successfulSessions, 0);

  return {
    overallSuccessRate: parseFloat(((totalSuccessful / totalFirstSessions) * 100).toFixed(2)),
    totalFirstSessions,
    totalSuccessful,
    byTutorAndSubject,
    byCustomerSegment,
    timestamp: new Date().toISOString()
  };
}

export function generateMockAnomalyDetection() {
  const anomalies = [];
  const tutors = ['Sarah Johnson', 'Michael Chen', 'Emily Davis'];
  const subjects = ['Math', 'Science', 'English'];
  const severities = ['critical', 'high', 'medium'] as const;

  // Generate 3-5 random anomalies
  const count = Math.floor(Math.random() * 3) + 3;
  for (let i = 0; i < count; i++) {
    anomalies.push({
      type: Math.random() > 0.5 ? 'success_rate_drop' : 'low_performance',
      severity: severities[i % 3],
      tutorName: tutors[i % tutors.length],
      subject: subjects[i % subjects.length],
      currentValue: parseFloat((Math.random() * 30 + 40).toFixed(2)),
      baselineValue: parseFloat((Math.random() * 20 + 70).toFixed(2)),
      threshold: Math.random() > 0.5 ? 10 : 15,
      message: `${severities[i % 3].toUpperCase()}: ${tutors[i % tutors.length]} success rate dropped in ${subjects[i % subjects.length]}`,
      detectedAt: new Date().toISOString()
    });
  }

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    criticalCount: anomalies.filter(a => a.severity === 'critical').length,
    highCount: anomalies.filter(a => a.severity === 'high').length,
    mediumCount: anomalies.filter(a => a.severity === 'medium').length,
    timestamp: new Date().toISOString()
  };
}

export function generateMockSessionVelocity() {
  const cohorts = ['January 2024', 'February 2024', 'March 2024'];
  const customers = ['Alice Brown', 'Bob Smith', 'Carol White', 'David Lee', 'Emma Wilson'];

  const cohortData = cohorts.map((cohort, idx) => {
    const weeklyData = Array.from({ length: 12 }, (_, week) => ({
      weekNumber: week,
      weekStartDate: new Date(Date.now() - (11 - week) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalSessions: Math.floor(Math.random() * 50) + 20,
      activeCustomers: Math.floor(Math.random() * 20) + 10,
      averageSessionsPerCustomer: parseFloat((Math.random() * 3 + 1).toFixed(2))
    }));

    return {
      cohortId: `cohort_${idx}`,
      cohortName: cohort,
      startDate: new Date(2024, idx, 1).toISOString(),
      totalCustomers: Math.floor(Math.random() * 50) + 30,
      weeklyData,
      averageVelocity: parseFloat((Math.random() * 2 + 1.5).toFixed(2)),
      retentionRate: parseFloat((Math.random() * 30 + 60).toFixed(2))
    };
  });

  const customerVelocities = customers.map((name, idx) => ({
    customerId: `customer_${idx}`,
    customerName: name,
    cohort: cohorts[idx % cohorts.length],
    sessionsThisWeek: Math.floor(Math.random() * 5) + 1,
    sessionsLastWeek: Math.floor(Math.random() * 5) + 1,
    sessionsPerWeek: parseFloat((Math.random() * 2 + 1).toFixed(2)),
    velocityTrend: ['increasing', 'stable', 'decreasing', 'at-risk'][idx % 4] as any,
    lastSessionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

  return {
    cohorts: cohortData,
    customerVelocities,
    atRiskCount: customerVelocities.filter(c => c.velocityTrend === 'at-risk').length,
    decreasingCount: customerVelocities.filter(c => c.velocityTrend === 'decreasing').length,
    timestamp: new Date().toISOString()
  };
}

export function generateMockVelocityAlerts() {
  const customers = ['Alice Brown', 'Bob Smith', 'Carol White', 'David Lee'];
  const alerts = customers.map((name, idx) => ({
    type: ['low_velocity', 'declining_velocity', 'inactive_customer'][idx % 3] as any,
    severity: ['critical', 'high', 'medium', 'low'][idx % 4] as any,
    customerId: `customer_${idx}`,
    customerName: name,
    cohort: 'January 2024',
    sessionsThisWeek: Math.floor(Math.random() * 3),
    sessionsLastWeek: Math.floor(Math.random() * 5) + 2,
    sessionsPerWeek: parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)),
    daysSinceLastSession: Math.floor(Math.random() * 20) + 5,
    threshold: 1.0,
    message: `${name} has ${['low velocity', 'declining sessions', 'been inactive'][idx % 3]}`,
    createdAt: new Date().toISOString(),
    status: 'active'
  }));

  return {
    alerts,
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    highCount: alerts.filter(a => a.severity === 'high').length,
    mediumCount: alerts.filter(a => a.severity === 'medium').length,
    lowCount: alerts.filter(a => a.severity === 'low').length,
    atRiskCustomers: 2,
    decreasingTrendCustomers: 1,
    timestamp: new Date().toISOString()
  };
}
