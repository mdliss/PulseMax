/**
 * Churn Prediction Model
 * Uses logistic regression to predict customer churn risk based on behavioral features
 */

export interface CustomerFeatures {
  customerId: string;
  firstSessionSuccessRate: number; // 0-100
  sessionVelocity: number; // sessions per week
  ibCallFrequency: number; // calls per month
  goalCompletionRate: number; // 0-100
  tutorConsistency: number; // 0-100 (% sessions with same tutor)
  daysSinceLastSession: number;
  totalSessions: number;
  averageRating: number; // 0-5
  accountAge: number; // days since signup
}

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number; // 0-1
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    factor: string;
    impact: number; // -1 to 1, negative = increases churn
    description: string;
  }[];
  interventionRecommendations: string[];
  confidence: number; // 0-1
}

export interface ModelCoefficients {
  intercept: number;
  firstSessionSuccessRate: number;
  sessionVelocity: number;
  ibCallFrequency: number;
  goalCompletionRate: number;
  tutorConsistency: number;
  daysSinceLastSession: number;
  totalSessions: number;
  averageRating: number;
  accountAge: number;
}

export class ChurnPredictor {
  // Pre-trained coefficients (in production, these would come from actual training)
  // These are reasonable estimates based on common churn indicators
  private coefficients: ModelCoefficients = {
    intercept: 2.5,
    firstSessionSuccessRate: -0.03, // Higher success = lower churn
    sessionVelocity: -0.4, // More sessions = lower churn
    ibCallFrequency: 0.15, // More calls = higher churn (indicates issues)
    goalCompletionRate: -0.02, // Higher completion = lower churn
    tutorConsistency: -0.015, // More consistency = lower churn
    daysSinceLastSession: 0.05, // More days inactive = higher churn
    totalSessions: -0.01, // More history = lower churn
    averageRating: -0.5, // Higher ratings = lower churn
    accountAge: -0.002, // Older accounts = lower churn
  };

  /**
   * Predict churn probability using logistic regression
   */
  predict(features: CustomerFeatures): ChurnPrediction {
    // Normalize features
    const normalized = this.normalizeFeatures(features);

    // Calculate linear combination (z)
    const z =
      this.coefficients.intercept +
      this.coefficients.firstSessionSuccessRate * normalized.firstSessionSuccessRate +
      this.coefficients.sessionVelocity * normalized.sessionVelocity +
      this.coefficients.ibCallFrequency * normalized.ibCallFrequency +
      this.coefficients.goalCompletionRate * normalized.goalCompletionRate +
      this.coefficients.tutorConsistency * normalized.tutorConsistency +
      this.coefficients.daysSinceLastSession * normalized.daysSinceLastSession +
      this.coefficients.totalSessions * normalized.totalSessions +
      this.coefficients.averageRating * normalized.averageRating +
      this.coefficients.accountAge * normalized.accountAge;

    // Apply sigmoid function to get probability
    const churnProbability = this.sigmoid(z);

    // Determine risk level
    const churnRisk = this.getRiskLevel(churnProbability);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(features, normalized);

    // Generate intervention recommendations
    const interventionRecommendations = this.generateInterventions(features, riskFactors);

    // Calculate confidence based on feature completeness
    const confidence = this.calculateConfidence(features);

    return {
      customerId: features.customerId,
      churnProbability: parseFloat(churnProbability.toFixed(4)),
      churnRisk,
      riskFactors,
      interventionRecommendations,
      confidence: parseFloat(confidence.toFixed(2)),
    };
  }

  /**
   * Batch predict for multiple customers
   */
  predictBatch(customersFeatures: CustomerFeatures[]): ChurnPrediction[] {
    return customersFeatures.map(features => this.predict(features));
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Normalize features to 0-1 scale
   */
  private normalizeFeatures(features: CustomerFeatures): CustomerFeatures {
    return {
      customerId: features.customerId,
      firstSessionSuccessRate: features.firstSessionSuccessRate / 100,
      sessionVelocity: Math.min(features.sessionVelocity / 10, 1), // Cap at 10 sessions/week
      ibCallFrequency: Math.min(features.ibCallFrequency / 20, 1), // Cap at 20 calls/month
      goalCompletionRate: features.goalCompletionRate / 100,
      tutorConsistency: features.tutorConsistency / 100,
      daysSinceLastSession: Math.min(features.daysSinceLastSession / 30, 1), // Cap at 30 days
      totalSessions: Math.min(features.totalSessions / 100, 1), // Cap at 100 sessions
      averageRating: features.averageRating / 5,
      accountAge: Math.min(features.accountAge / 365, 1), // Cap at 1 year
    };
  }

  /**
   * Determine risk level from probability
   */
  private getRiskLevel(probability: number): ChurnPrediction['churnRisk'] {
    if (probability >= 0.7) return 'critical';
    if (probability >= 0.5) return 'high';
    if (probability >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Identify which factors contribute most to churn risk
   */
  private identifyRiskFactors(
    features: CustomerFeatures,
    normalized: CustomerFeatures
  ): ChurnPrediction['riskFactors'] {
    const factors: ChurnPrediction['riskFactors'] = [];

    // Check each feature's contribution
    if (normalized.firstSessionSuccessRate < 0.5) {
      factors.push({
        factor: 'Low First Session Success',
        impact: -0.8,
        description: `Only ${features.firstSessionSuccessRate.toFixed(0)}% first session success rate`,
      });
    }

    if (normalized.sessionVelocity < 0.3) {
      factors.push({
        factor: 'Low Session Frequency',
        impact: -0.7,
        description: `Only ${features.sessionVelocity.toFixed(1)} sessions per week`,
      });
    }

    if (normalized.ibCallFrequency > 0.5) {
      factors.push({
        factor: 'High Support Call Volume',
        impact: -0.6,
        description: `${features.ibCallFrequency.toFixed(0)} support calls per month indicates issues`,
      });
    }

    if (normalized.goalCompletionRate < 0.4) {
      factors.push({
        factor: 'Low Goal Completion',
        impact: -0.7,
        description: `Only ${features.goalCompletionRate.toFixed(0)}% of goals completed`,
      });
    }

    if (normalized.tutorConsistency < 0.5) {
      factors.push({
        factor: 'Low Tutor Consistency',
        impact: -0.5,
        description: `Only ${features.tutorConsistency.toFixed(0)}% sessions with preferred tutor`,
      });
    }

    if (features.daysSinceLastSession > 14) {
      factors.push({
        factor: 'Inactive Account',
        impact: -0.9,
        description: `${features.daysSinceLastSession} days since last session`,
      });
    }

    if (normalized.averageRating < 0.6) {
      factors.push({
        factor: 'Low Satisfaction Ratings',
        impact: -0.8,
        description: `Average rating of ${features.averageRating.toFixed(1)}/5.0`,
      });
    }

    // Sort by impact (most negative first)
    return factors.sort((a, b) => a.impact - b.impact).slice(0, 5);
  }

  /**
   * Generate intervention recommendations based on risk factors
   */
  private generateInterventions(
    features: CustomerFeatures,
    riskFactors: ChurnPrediction['riskFactors']
  ): string[] {
    const interventions: string[] = [];

    // Address top risk factors
    riskFactors.forEach(factor => {
      switch (factor.factor) {
        case 'Low First Session Success':
          interventions.push('Offer complimentary follow-up session with success coach');
          interventions.push('Match with highest-rated tutor in their subject area');
          break;
        case 'Low Session Frequency':
          interventions.push('Send personalized re-engagement email with scheduling link');
          interventions.push('Offer flexible scheduling options or session package discount');
          break;
        case 'High Support Call Volume':
          interventions.push('Assign dedicated account manager for personalized support');
          interventions.push('Conduct needs assessment call to identify pain points');
          break;
        case 'Low Goal Completion':
          interventions.push('Schedule goal-setting session with learning advisor');
          interventions.push('Break down goals into smaller, achievable milestones');
          break;
        case 'Low Tutor Consistency':
          interventions.push('Prioritize scheduling with their preferred tutor');
          interventions.push('Introduce tutor matching quiz to find better fit');
          break;
        case 'Inactive Account':
          interventions.push('Send urgent "We miss you!" campaign with incentive');
          interventions.push('Make outbound call to check in and offer support');
          break;
        case 'Low Satisfaction Ratings':
          interventions.push('Conduct satisfaction survey to understand concerns');
          interventions.push('Offer tutor change and session credit as goodwill gesture');
          break;
      }
    });

    // General interventions based on account status
    if (features.totalSessions < 5) {
      interventions.push('Early-stage customer - provide onboarding success guide');
    }

    if (features.accountAge < 30) {
      interventions.push('New customer - schedule welcome call to ensure satisfaction');
    }

    // Remove duplicates and limit to top 5
    return [...new Set(interventions)].slice(0, 5);
  }

  /**
   * Calculate prediction confidence based on data completeness
   */
  private calculateConfidence(features: CustomerFeatures): number {
    let confidence = 1.0;

    // Reduce confidence if we have limited data
    if (features.totalSessions < 3) {
      confidence *= 0.7;
    }

    if (features.accountAge < 14) {
      confidence *= 0.8;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get model coefficients (for transparency)
   */
  getCoefficients(): ModelCoefficients {
    return { ...this.coefficients };
  }

  /**
   * Calculate feature importance scores
   */
  getFeatureImportance(): { feature: string; importance: number }[] {
    const importance = Object.entries(this.coefficients)
      .filter(([key]) => key !== 'intercept')
      .map(([feature, coefficient]) => ({
        feature,
        importance: Math.abs(coefficient),
      }))
      .sort((a, b) => b.importance - a.importance);

    return importance;
  }
}

export const churnPredictor = new ChurnPredictor();
