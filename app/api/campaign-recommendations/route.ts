import { NextResponse } from 'next/server';
import { campaignRecommendationEngine, type SupplyDemandPrediction } from '@/lib/recommendations/campaignRecommendations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaign-recommendations
 *
 * Generates campaign recommendations based on supply-demand predictions
 *
 * Query params:
 * - hours: number of hours to analyze (default: 24)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam) : 24;

    // Generate mock predictions for campaign recommendations with variance
    const now = Date.now();
    const timeVariance = Math.floor(Math.random() * 1000); // Add time variance for unique data

    const predictions: SupplyDemandPrediction[] = Array.from({ length: hours }, (_, i) => {
      const timestamp = new Date(now + i * 60 * 60 * 1000 + timeVariance);
      const hour = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();

      // Add more variance to make changes visible
      const baseVolume = 30 + Math.sin(hour / 24 * Math.PI * 2) * 15;
      const baseTutors = 25 + Math.sin((hour + 3) / 24 * Math.PI * 2) * 10;
      const variance = (Math.random() - 0.5) * 15; // Increased variance

      const sessionVolume = Math.max(5, Math.floor(baseVolume + variance));
      const availableTutors = Math.max(5, Math.floor(baseTutors + variance * 0.8));
      const ratio = sessionVolume / availableTutors;

      let risk: 'low' | 'medium' | 'high' | 'critical';
      if (ratio > 1.5) risk = 'critical';
      else if (ratio > 1.2) risk = 'high';
      else if (ratio > 0.9) risk = 'medium';
      else risk = 'low';

      return {
        timestamp: timestamp.toISOString(),
        hour,
        dayOfWeek,
        predictedSessionVolume: sessionVolume,
        predictedAvailableTutors: availableTutors,
        predictedSupplyDemandRatio: Number(ratio.toFixed(2)),
        confidence: 0.75 + Math.random() * 0.2,
        imbalanceRisk: risk
      };
    });

    // Generate recommendations using the engine
    const recommendations = campaignRecommendationEngine.generateRecommendations(predictions);
    const summary = campaignRecommendationEngine.getSummary(recommendations);

    // Add metadata - generate fresh timestamp for each request
    const generatedAt = new Date();
    const response = {
      recommendations,
      summary,
      metadata: {
        generatedAt: generatedAt.toISOString(),
        analysisWindow: {
          hours,
          start: predictions[0]?.timestamp,
          end: predictions[predictions.length - 1]?.timestamp,
        },
        dataPoints: predictions.length,
        predictionSource: 'supply-demand-forecasting',
      },
      insights: generateInsights(recommendations, predictions),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating campaign recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate campaign recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Generate high-level insights from recommendations - dynamically updates with each request
 */
function generateInsights(recommendations: any[], predictions: SupplyDemandPrediction[]) {
  const insights: string[] = [];

  // Calculate dynamic metrics
  const criticalHours = predictions.filter(p => p.imbalanceRisk === 'critical').length;
  const highRiskHours = predictions.filter(p => p.imbalanceRisk === 'high').length;
  const avgRatio = predictions.reduce((sum, p) => sum + p.predictedSupplyDemandRatio, 0) / predictions.length;

  // Critical insights - always show with current counts
  if (criticalHours > 0) {
    insights.push(`${criticalHours} hour(s) with critical supply shortage detected in the next ${predictions.length} hours`);
  }

  if (highRiskHours > 0) {
    insights.push(`${highRiskHours} hour(s) with high imbalance risk require attention`);
  }

  // Average ratio insights - dynamic based on current ratio
  if (avgRatio > 1.2) {
    insights.push(`Average supply-demand ratio is ${avgRatio.toFixed(2)} - prioritize tutor recruitment`);
  } else if (avgRatio < 0.7) {
    insights.push(`Average supply-demand ratio is ${avgRatio.toFixed(2)} - excess tutor capacity detected`);
  } else {
    insights.push(`Average supply-demand ratio is balanced at ${avgRatio.toFixed(2)}`);
  }

  // Recommendation type insights - dynamic counts
  const tutorRecruitCount = recommendations.filter(r => r.type === 'tutor_recruitment').length;
  const budgetIncreaseCount = recommendations.filter(r => r.type === 'budget_increase').length;
  const budgetDecreaseCount = recommendations.filter(r => r.type === 'budget_decrease').length;

  if (tutorRecruitCount > 0) {
    insights.push(`${tutorRecruitCount} tutor recruitment recommendation(s) - consider systematic hiring campaign`);
  }

  if (budgetIncreaseCount > 0) {
    insights.push(`${budgetIncreaseCount} budget increase recommendation(s) - review campaign allocation`);
  }

  if (budgetDecreaseCount > 0) {
    insights.push(`${budgetDecreaseCount} budget decrease recommendation(s) - optimize spending`);
  }

  // Time-of-day insights - dynamic peak hour calculation
  const timeDistribution = new Map<number, number>();
  predictions.forEach(p => {
    if (p.imbalanceRisk === 'critical' || p.imbalanceRisk === 'high') {
      timeDistribution.set(p.hour, (timeDistribution.get(p.hour) || 0) + 1);
    }
  });

  if (timeDistribution.size > 0) {
    const peakHour = Array.from(timeDistribution.entries()).reduce(
      (max, entry) => entry[1] > max[1] ? entry : max,
      [0, 0] as [number, number]
    );

    if (peakHour[1] > 0) {
      const timeStr = peakHour[0] === 0 ? '12 AM' : peakHour[0] < 12 ? `${peakHour[0]} AM` : peakHour[0] === 12 ? '12 PM' : `${peakHour[0] - 12} PM`;
      insights.push(`Peak imbalance occurs around ${timeStr} - focus tutor availability during this window`);
    }
  }

  // Always return at least one insight
  if (insights.length === 0) {
    insights.push('Supply and demand are currently balanced across all time windows');
  }

  return insights;
}
