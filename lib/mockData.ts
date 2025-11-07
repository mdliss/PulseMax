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

  // Add more variance for visible live updates
  const variance = Math.random() * 20 - 10; // -10 to +10 variance

  const byTutorAndSubject = tutors.flatMap(tutor =>
    subjects.slice(0, Math.floor(Math.random() * 3) + 1).map(subject => {
      const totalSessions = Math.floor(Math.random() * 50) + 10;
      const successfulSessions = Math.floor(Math.random() * totalSessions); // Can't exceed total
      const successRate = Math.min(100, parseFloat(((successfulSessions / totalSessions) * 100).toFixed(2)));

      return {
        tutorId: `tutor_${tutor.replace(/\s/g, '_').toLowerCase()}`,
        tutorName: tutor,
        subject,
        totalSessions,
        successfulSessions,
        successRate
      };
    })
  ).sort((a, b) => b.successRate - a.successRate);

  const byCustomerSegment = segments.map(segment => {
    const totalSessions = Math.floor(Math.random() * 100) + 50;
    const successfulSessions = Math.floor(Math.random() * totalSessions); // Can't exceed total
    const successRate = Math.min(100, parseFloat(((successfulSessions / totalSessions) * 100).toFixed(2)));

    return {
      segment,
      totalSessions,
      successfulSessions,
      successRate
    };
  });

  const totalFirstSessions = byTutorAndSubject.reduce((sum, item) => sum + item.totalSessions, 0);
  const totalSuccessful = byTutorAndSubject.reduce((sum, item) => sum + item.successfulSessions, 0);

  return {
    overallSuccessRate: Math.min(100, parseFloat(((totalSuccessful / totalFirstSessions) * 100).toFixed(2))),
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

export function generateMockSupplyDemandPredictions() {
  const now = new Date();
  const predictions = [];

  for (let i = 1; i <= 24; i++) {
    const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = futureTime.getHours();
    const isPeakHour = hour >= 14 && hour <= 20;

    const baseSessionVolume = isPeakHour ? 20 : 10;
    const baseTutorCount = isPeakHour ? 18 : 12;

    const predictedSessionVolume = Math.max(5, baseSessionVolume + Math.floor(Math.random() * 10 - 5));
    const predictedAvailableTutors = Math.max(5, baseTutorCount + Math.floor(Math.random() * 8 - 4));
    const predictedSupplyDemandRatio = parseFloat((predictedSessionVolume / predictedAvailableTutors).toFixed(2));

    let imbalanceRisk: 'low' | 'medium' | 'high' | 'critical';
    if (predictedSupplyDemandRatio > 1.5) imbalanceRisk = 'critical';
    else if (predictedSupplyDemandRatio > 1.2) imbalanceRisk = 'high';
    else if (predictedSupplyDemandRatio > 0.9) imbalanceRisk = 'medium';
    else imbalanceRisk = 'low';

    predictions.push({
      timestamp: futureTime.toISOString(),
      hour: futureTime.getHours(),
      dayOfWeek: futureTime.getDay(),
      predictedSessionVolume,
      predictedAvailableTutors,
      predictedSupplyDemandRatio,
      confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
      imbalanceRisk
    });
  }

  const criticalRiskHours = predictions.filter(p => p.imbalanceRisk === 'critical').length;
  const highRiskHours = predictions.filter(p => p.imbalanceRisk === 'high').length;
  const mediumRiskHours = predictions.filter(p => p.imbalanceRisk === 'medium').length;
  const lowRiskHours = predictions.filter(p => p.imbalanceRisk === 'low').length;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  return {
    predictions,
    summary: {
      totalPredictions: predictions.length,
      hoursAhead: 24,
      criticalRiskHours,
      highRiskHours,
      mediumRiskHours,
      lowRiskHours,
      averageConfidence: parseFloat(avgConfidence.toFixed(2))
    },
    modelInfo: {
      method: 'Holt-Winters Exponential Smoothing',
      dataPoints: 720,
      historicalDays: 30
    },
    timestamp: new Date().toISOString()
  };
}

export function generateMockSupplyDemandAlerts() {
  const now = new Date();
  const alerts = [];
  const predictions = generateMockSupplyDemandPredictions().predictions;

  // Generate alerts from high-risk predictions
  const highRiskPredictions = predictions.filter(p =>
    p.imbalanceRisk === 'critical' || p.imbalanceRisk === 'high'
  ).slice(0, 5);

  highRiskPredictions.forEach((prediction, idx) => {
    const hoursUntil = Math.round((new Date(prediction.timestamp).getTime() - now.getTime()) / (60 * 60 * 1000));
    const shortage = prediction.predictedSessionVolume - prediction.predictedAvailableTutors;

    let message = '';
    let recommendation = '';
    let severity: 'low' | 'medium' | 'high' | 'critical' = prediction.imbalanceRisk === 'critical' ? 'critical' : 'high';

    if (prediction.imbalanceRisk === 'critical') {
      message = `CRITICAL: Expected ${prediction.predictedSessionVolume} sessions but only ${prediction.predictedAvailableTutors} tutors available in ${hoursUntil} hours`;
      recommendation = `Urgently activate ${Math.ceil(shortage)} additional tutors. Consider emergency notifications to on-call tutors.`;
    } else {
      message = `Supply shortage predicted: ${prediction.predictedSessionVolume} sessions expected vs ${prediction.predictedAvailableTutors} tutors in ${hoursUntil} hours`;
      recommendation = `Schedule ${Math.ceil(shortage)} more tutors. Send availability requests to part-time tutors.`;
    }

    alerts.push({
      type: prediction.imbalanceRisk === 'critical' ? 'critical_imbalance' : 'supply_shortage',
      severity,
      predictedTime: prediction.timestamp,
      predictedSessionVolume: prediction.predictedSessionVolume,
      predictedAvailableTutors: prediction.predictedAvailableTutors,
      supplyDemandRatio: prediction.predictedSupplyDemandRatio,
      hoursUntil,
      message,
      recommendation,
      createdAt: now.toISOString()
    });
  });

  return {
    alerts,
    summary: {
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      highCount: alerts.filter(a => a.severity === 'high').length,
      mediumCount: alerts.filter(a => a.severity === 'medium').length,
      lowCount: alerts.filter(a => a.severity === 'low').length
    },
    timestamp: now.toISOString()
  };
}

export function generateMockChurnPredictions() {
  const customerSegments = ['K-12', 'College', 'Professional', 'Test Prep'];
  const riskLevels = ['critical', 'high', 'medium', 'low'] as const;
  const customerNames = [
    'Sarah Thompson', 'Michael Rodriguez', 'Emily Chen', 'James Wilson',
    'Maria Garcia', 'David Kim', 'Jessica Brown', 'Robert Lee',
    'Amanda Martinez', 'Christopher Davis', 'Jennifer Taylor', 'Daniel Anderson'
  ];

  const predictions = customerNames.map((name, index) => {
    const segment = customerSegments[index % customerSegments.length];
    const churnProbability = Math.random();

    let churnRisk: 'low' | 'medium' | 'high' | 'critical';
    if (churnProbability > 0.8) churnRisk = 'critical';
    else if (churnProbability > 0.6) churnRisk = 'high';
    else if (churnProbability > 0.4) churnRisk = 'medium';
    else churnRisk = 'low';

    const riskFactors = [
      {
        factor: 'Average Rating',
        impact: -(Math.random() * 0.3 + 0.2),
        description: `Recent ratings below ${(Math.random() * 1 + 3).toFixed(1)} stars`
      },
      {
        factor: 'Session Velocity',
        impact: -(Math.random() * 0.4 + 0.3),
        description: `${Math.floor(Math.random() * 20 + 10)} days since last session`
      },
      {
        factor: 'In-Call Frequency',
        impact: -(Math.random() * 0.25 + 0.15),
        description: `Low engagement in recent sessions`
      }
    ];

    const interventions = [
      `Send personalized re-engagement email with ${Math.floor(Math.random() * 20 + 10)}% discount`,
      `Assign dedicated success manager for check-in call`,
      `Offer free session with top-rated tutor in ${segment}`,
      `Schedule feedback call to understand concerns`
    ];

    return {
      customerId: name,
      customerSegment: segment,
      churnProbability: parseFloat(churnProbability.toFixed(2)),
      churnRisk,
      riskFactors: riskFactors.slice(0, Math.floor(Math.random() * 2) + 2),
      interventionRecommendations: interventions.slice(0, Math.floor(Math.random() * 2) + 2),
      confidence: parseFloat((Math.random() * 0.2 + 0.75).toFixed(2))
    };
  });

  // Sort by churn probability descending
  predictions.sort((a, b) => b.churnProbability - a.churnProbability);

  return {
    predictions,
    summary: {
      totalCustomers: predictions.length,
      byRisk: {
        critical: predictions.filter(p => p.churnRisk === 'critical').length,
        high: predictions.filter(p => p.churnRisk === 'high').length,
        medium: predictions.filter(p => p.churnRisk === 'medium').length,
        low: predictions.filter(p => p.churnRisk === 'low').length
      },
      averageChurnProbability: predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length,
      highRiskCount: predictions.filter(p => p.churnRisk === 'critical' || p.churnRisk === 'high').length
    },
    featureImportance: [
      { feature: 'Average Rating', importance: 0.58 },
      { feature: 'Session Velocity', importance: 0.48 },
      { feature: 'In-Call Frequency', importance: 0.15 },
      { feature: 'Days Since Last Session', importance: 0.01 },
      { feature: 'First Session Success Rate', importance: 0.03 }
    ],
    timestamp: new Date().toISOString()
  };
}

export function generateMockCampaignRecommendations() {
  const now = new Date();
  const recommendations = [];

  const campaignTypes = [
    'budget_increase',
    'tutor_recruitment',
    'demand_incentive',
    'schedule_optimization'
  ] as const;

  const severities = ['critical', 'high', 'medium', 'low'] as const;

  // Generate 3-6 recommendations
  const count = Math.floor(Math.random() * 4) + 3;

  for (let i = 0; i < count; i++) {
    const type = campaignTypes[i % campaignTypes.length];
    const severity = severities[Math.min(i, severities.length - 1)] as 'low' | 'medium' | 'high' | 'critical';
    const currentRatio = parseFloat((Math.random() * 0.8 + 0.8).toFixed(2));
    const targetRatio = parseFloat((0.9 + Math.random() * 0.2).toFixed(2));

    const titles: Record<typeof type, string> = {
      budget_increase: 'Increase Marketing Budget for Peak Hours',
      tutor_recruitment: 'Recruit Additional Tutors for High-Demand Subjects',
      demand_incentive: 'Launch Customer Acquisition Campaign',
      schedule_optimization: 'Optimize Tutor Scheduling Algorithm'
    };

    const descriptions: Record<typeof type, string> = {
      budget_increase: 'Predicted surge in demand requires increased marketing spend',
      tutor_recruitment: 'Supply shortage detected in Math and Science subjects',
      demand_incentive: 'Opportunity to grow customer base during low-demand periods',
      schedule_optimization: 'Improved scheduling can reduce wait times by 23%'
    };

    const rationales: Record<typeof type, string> = {
      budget_increase: `Analysis shows ${Math.floor(Math.random() * 20 + 15)}% increase in session demand during evening hours. Current supply will be insufficient.`,
      tutor_recruitment: `Current tutor availability is ${Math.floor(Math.random() * 15 + 10)}% below optimal levels for peak demand periods.`,
      demand_incentive: `Customer acquisition costs are ${Math.floor(Math.random() * 20 + 10)}% lower during identified time windows.`,
      schedule_optimization: `Machine learning analysis identified ${Math.floor(Math.random() * 30 + 20)} scheduling inefficiencies that can be corrected.`
    };

    const actions: Record<typeof type, string[]> = {
      budget_increase: [
        `Allocate additional $${Math.floor(Math.random() * 5000 + 2000)} to Google Ads campaign`,
        `Focus spend on ${Math.floor(Math.random() * 3 + 2)}-${Math.floor(Math.random() * 3 + 5)}pm time slots`,
        `Target K-12 and College segments with increased bids`
      ],
      tutor_recruitment: [
        `Post ${Math.floor(Math.random() * 10 + 5)} new tutor positions on job boards`,
        `Offer $${Math.floor(Math.random() * 200 + 100)} sign-on bonus for Math/Science tutors`,
        `Fast-track onboarding process for qualified candidates`
      ],
      demand_incentive: [
        `Launch ${Math.floor(Math.random() * 20 + 10)}% discount campaign for new customers`,
        `Send personalized outreach to ${Math.floor(Math.random() * 500 + 200)} inactive leads`,
        `Create referral program with $${Math.floor(Math.random() * 30 + 20)} rewards`
      ],
      schedule_optimization: [
        `Deploy updated matching algorithm to production`,
        `A/B test new scheduling logic with ${Math.floor(Math.random() * 20 + 10)}% of traffic`,
        `Monitor impact on wait times and customer satisfaction`
      ]
    };

    recommendations.push({
      id: `rec_${i + 1}`,
      type,
      severity,
      title: titles[type],
      description: descriptions[type],
      rationale: rationales[type],
      targetTimeframe: {
        start: now.toISOString(),
        end: new Date(now.getTime() + (Math.floor(Math.random() * 48 + 24) * 60 * 60 * 1000)).toISOString()
      },
      metrics: {
        currentSupplyDemandRatio: currentRatio,
        targetSupplyDemandRatio: targetRatio,
        estimatedImpact: `+${Math.floor(Math.random() * 20 + 10)}%`
      },
      actions: actions[type].slice(0, Math.floor(Math.random() * 2) + 2),
      priority: Math.max(1, 10 - i * 2)
    });
  }

  // Sort by priority descending
  recommendations.sort((a, b) => b.priority - a.priority);

  const insights = [
    `Peak demand expected in next ${Math.floor(Math.random() * 12 + 12)} hours`,
    `${Math.floor(Math.random() * 15 + 5)} tutors needed to maintain service levels`,
    `Current supply-demand ratio trending ${Math.random() > 0.5 ? 'upward' : 'stable'} at ${(Math.random() * 0.3 + 0.9).toFixed(2)}`,
    `Marketing efficiency ${Math.random() > 0.5 ? 'improved' : 'stable'} by ${Math.floor(Math.random() * 10 + 5)}% this week`
  ];

  return {
    recommendations,
    summary: {
      total: recommendations.length,
      bySeverity: {
        critical: recommendations.filter(r => r.severity === 'critical').length,
        high: recommendations.filter(r => r.severity === 'high').length,
        medium: recommendations.filter(r => r.severity === 'medium').length,
        low: recommendations.filter(r => r.severity === 'low').length
      },
      byType: {
        budget_increase: recommendations.filter(r => r.type === 'budget_increase').length,
        budget_decrease: 0,
        priority_shift: 0,
        tutor_recruitment: recommendations.filter(r => r.type === 'tutor_recruitment').length,
        demand_incentive: recommendations.filter(r => r.type === 'demand_incentive').length,
        schedule_optimization: recommendations.filter(r => r.type === 'schedule_optimization').length
      },
      highestPriority: recommendations[0] || null
    },
    metadata: {
      generatedAt: now.toISOString(),
      analysisWindow: {
        hours: 24,
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString()
      },
      dataPoints: Math.floor(Math.random() * 500 + 500)
    },
    insights: insights.slice(0, Math.floor(Math.random() * 2) + 2)
  };
}
