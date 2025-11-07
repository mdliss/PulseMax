/**
 * Campaign Recommendation Engine
 * Analyzes supply-demand data and generates actionable campaign recommendations
 */

export interface SupplyDemandPrediction {
  timestamp: string;
  hour: number;
  dayOfWeek: number;
  predictedSessionVolume: number;
  predictedAvailableTutors: number;
  predictedSupplyDemandRatio: number;
  confidence: number;
  imbalanceRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface CampaignRecommendation {
  id: string;
  type: 'budget_increase' | 'budget_decrease' | 'priority_shift' | 'tutor_recruitment' | 'demand_incentive' | 'schedule_optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  targetTimeframe: {
    start: string;
    end: string;
  };
  metrics: {
    currentSupplyDemandRatio: number;
    targetSupplyDemandRatio: number;
    estimatedImpact: string;
  };
  actions: string[];
  priority: number; // 1-10, higher = more urgent
}

export class CampaignRecommendationEngine {
  private readonly OPTIMAL_RATIO = 0.8; // Optimal supply/demand ratio
  private readonly CRITICAL_THRESHOLD = 1.5;
  private readonly HIGH_THRESHOLD = 1.2;
  private readonly MEDIUM_THRESHOLD = 0.9;

  /**
   * Generate campaign recommendations based on supply-demand predictions
   */
  generateRecommendations(predictions: SupplyDemandPrediction[]): CampaignRecommendation[] {
    const recommendations: CampaignRecommendation[] = [];

    // Analyze predictions and generate recommendations
    const criticalPeriods = this.findCriticalPeriods(predictions);
    const demandSurges = this.identifyDemandSurges(predictions);
    const supplyGaps = this.identifySupplyGaps(predictions);

    // Generate recommendations for critical periods
    criticalPeriods.forEach((period, index) => {
      recommendations.push(...this.createCriticalPeriodRecommendations(period, index));
    });

    // Generate recommendations for demand surges
    demandSurges.forEach((surge, index) => {
      recommendations.push(...this.createDemandSurgeRecommendations(surge, index + criticalPeriods.length));
    });

    // Generate recommendations for supply gaps
    supplyGaps.forEach((gap, index) => {
      recommendations.push(...this.createSupplyGapRecommendations(gap, index + criticalPeriods.length + demandSurges.length));
    });

    // Sort by priority (descending)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find periods with critical supply-demand imbalance
   */
  private findCriticalPeriods(predictions: SupplyDemandPrediction[]): SupplyDemandPrediction[] {
    return predictions.filter(p => p.imbalanceRisk === 'critical' || p.imbalanceRisk === 'high');
  }

  /**
   * Identify sudden demand surges
   */
  private identifyDemandSurges(predictions: SupplyDemandPrediction[]): SupplyDemandPrediction[] {
    const surges: SupplyDemandPrediction[] = [];

    for (let i = 1; i < predictions.length; i++) {
      const current = predictions[i];
      const previous = predictions[i - 1];

      // Detect if demand increased by more than 30% in one hour
      const demandIncrease = (current.predictedSessionVolume - previous.predictedSessionVolume) / previous.predictedSessionVolume;

      if (demandIncrease > 0.3 && current.predictedSupplyDemandRatio > this.MEDIUM_THRESHOLD) {
        surges.push(current);
      }
    }

    return surges;
  }

  /**
   * Identify supply gaps (not enough tutors)
   */
  private identifySupplyGaps(predictions: SupplyDemandPrediction[]): SupplyDemandPrediction[] {
    return predictions.filter(p => {
      const gapSize = p.predictedSessionVolume - p.predictedAvailableTutors;
      return gapSize > 10 && p.predictedSupplyDemandRatio > this.MEDIUM_THRESHOLD;
    });
  }

  /**
   * Create recommendations for critical periods
   */
  private createCriticalPeriodRecommendations(period: SupplyDemandPrediction, index: number): CampaignRecommendation[] {
    const recommendations: CampaignRecommendation[] = [];
    const severity = period.imbalanceRisk;
    const ratio = period.predictedSupplyDemandRatio;

    // Tutor recruitment recommendation
    recommendations.push({
      id: `tutor-recruit-${index}`,
      type: 'tutor_recruitment',
      severity,
      title: 'Urgent Tutor Recruitment Needed',
      description: `Critical shortage expected at ${new Date(period.timestamp).toLocaleString()}. Need ${Math.ceil(period.predictedSessionVolume - period.predictedAvailableTutors)} more tutors.`,
      rationale: `Supply-demand ratio of ${ratio.toFixed(2)} indicates severe shortage. Predicted ${period.predictedSessionVolume} sessions with only ${period.predictedAvailableTutors} available tutors.`,
      targetTimeframe: {
        start: new Date(new Date(period.timestamp).getTime() - 2 * 60 * 60 * 1000).toISOString(),
        end: new Date(new Date(period.timestamp).getTime() + 1 * 60 * 60 * 1000).toISOString(),
      },
      metrics: {
        currentSupplyDemandRatio: ratio,
        targetSupplyDemandRatio: this.OPTIMAL_RATIO,
        estimatedImpact: `Reduce wait times by ${Math.round((1 - this.OPTIMAL_RATIO / ratio) * 100)}%`,
      },
      actions: [
        'Send push notifications to inactive tutors',
        'Offer bonus incentives for tutors working this time slot',
        'Enable emergency tutor on-call system',
        'Consider cross-timezone tutor allocation',
      ],
      priority: severity === 'critical' ? 10 : 8,
    });

    // Budget adjustment recommendation
    recommendations.push({
      id: `budget-increase-${index}`,
      type: 'budget_increase',
      severity,
      title: 'Increase Marketing Budget for Tutor Acquisition',
      description: 'Boost tutor recruitment campaigns to address upcoming shortage',
      rationale: `High demand period requires additional tutor capacity. Current campaigns insufficient for predicted ${ratio.toFixed(2)}x demand-supply ratio.`,
      targetTimeframe: {
        start: new Date().toISOString(),
        end: period.timestamp,
      },
      metrics: {
        currentSupplyDemandRatio: ratio,
        targetSupplyDemandRatio: this.OPTIMAL_RATIO,
        estimatedImpact: 'Increase tutor sign-ups by 40-60%',
      },
      actions: [
        'Increase tutor acquisition campaign budget by 50%',
        'Launch targeted ads in underserved time zones',
        'Activate referral bonus program',
        'Fast-track tutor onboarding process',
      ],
      priority: severity === 'critical' ? 9 : 7,
    });

    return recommendations;
  }

  /**
   * Create recommendations for demand surges
   */
  private createDemandSurgeRecommendations(surge: SupplyDemandPrediction, index: number): CampaignRecommendation[] {
    return [{
      id: `demand-surge-${index}`,
      type: 'schedule_optimization',
      severity: surge.imbalanceRisk,
      title: 'Demand Surge Detected - Optimize Tutor Scheduling',
      description: `Sudden ${Math.round(surge.predictedSessionVolume)} session surge expected at ${new Date(surge.timestamp).toLocaleString()}`,
      rationale: `Unusual spike in demand requires proactive tutor scheduling to maintain service quality.`,
      targetTimeframe: {
        start: new Date(new Date(surge.timestamp).getTime() - 1 * 60 * 60 * 1000).toISOString(),
        end: surge.timestamp,
      },
      metrics: {
        currentSupplyDemandRatio: surge.predictedSupplyDemandRatio,
        targetSupplyDemandRatio: this.OPTIMAL_RATIO,
        estimatedImpact: 'Maintain <2min average wait time',
      },
      actions: [
        'Alert tutors 1 hour in advance of surge',
        'Enable surge pricing for tutors',
        'Queue management optimization',
        'Prepare overflow capacity',
      ],
      priority: surge.imbalanceRisk === 'critical' ? 9 : surge.imbalanceRisk === 'high' ? 7 : 6,
    }];
  }

  /**
   * Create recommendations for supply gaps
   */
  private createSupplyGapRecommendations(gap: SupplyDemandPrediction, index: number): CampaignRecommendation[] {
    const gapSize = gap.predictedSessionVolume - gap.predictedAvailableTutors;

    return [{
      id: `supply-gap-${index}`,
      type: 'priority_shift',
      severity: gap.imbalanceRisk,
      title: 'Shift Campaign Priority to Tutor Supply',
      description: `${gapSize} tutor shortage forecasted for ${new Date(gap.timestamp).toLocaleString()}`,
      rationale: `Supply gap of ${gapSize} tutors requires immediate attention to prevent service degradation.`,
      targetTimeframe: {
        start: new Date().toISOString(),
        end: gap.timestamp,
      },
      metrics: {
        currentSupplyDemandRatio: gap.predictedSupplyDemandRatio,
        targetSupplyDemandRatio: this.OPTIMAL_RATIO,
        estimatedImpact: `Close ${Math.round(gapSize)} tutor gap`,
      },
      actions: [
        'Pause student acquisition campaigns temporarily',
        'Reallocate 30% of budget to tutor recruitment',
        'Launch time-slot specific tutor campaigns',
        'Enable tutor shift swapping features',
      ],
      priority: gap.imbalanceRisk === 'critical' ? 8 : gap.imbalanceRisk === 'high' ? 6 : 5,
    }];
  }

  /**
   * Get summary statistics for recommendations
   */
  getSummary(recommendations: CampaignRecommendation[]) {
    return {
      total: recommendations.length,
      bySeverity: {
        critical: recommendations.filter(r => r.severity === 'critical').length,
        high: recommendations.filter(r => r.severity === 'high').length,
        medium: recommendations.filter(r => r.severity === 'medium').length,
        low: recommendations.filter(r => r.severity === 'low').length,
      },
      byType: {
        budget_increase: recommendations.filter(r => r.type === 'budget_increase').length,
        budget_decrease: recommendations.filter(r => r.type === 'budget_decrease').length,
        priority_shift: recommendations.filter(r => r.type === 'priority_shift').length,
        tutor_recruitment: recommendations.filter(r => r.type === 'tutor_recruitment').length,
        demand_incentive: recommendations.filter(r => r.type === 'demand_incentive').length,
        schedule_optimization: recommendations.filter(r => r.type === 'schedule_optimization').length,
      },
      highestPriority: recommendations[0] || null,
    };
  }
}

export const campaignRecommendationEngine = new CampaignRecommendationEngine();
