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

    // Generate mock predictions for campaign recommendations
    const predictions: SupplyDemandPrediction[] = Array.from({ length: hours }, (_, i) => {
      const timestamp = new Date(Date.now() + i * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();

      const baseVolume = 30 + Math.sin(hour / 24 * Math.PI * 2) * 15;
      const baseTutors = 25 + Math.sin((hour + 3) / 24 * Math.PI * 2) * 10;
      const variance = (Math.random() - 0.5) * 10;

      const sessionVolume = Math.max(5, Math.floor(baseVolume + variance));
      const availableTutors = Math.max(5, Math.floor(baseTutors + variance));
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

    // Add metadata
    const response = {
      recommendations,
      summary,
      metadata: {
        generatedAt: new Date().toISOString(),
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
 * Generate high-level insights from recommendations
 */
function generateInsights(recommendations: any[], predictions: SupplyDemandPrediction[]) {
  const criticalHours = predictions.filter(p => p.imbalanceRisk === 'critical').length;
  const highRiskHours = predictions.filter(p => p.imbalanceRisk === 'high').length;
  const avgRatio = predictions.reduce((sum, p) => sum + p.predictedSupplyDemandRatio, 0) / predictions.length;

  const insights: string[] = [];

  // Critical insights
  if (criticalHours > 0) {
    insights.push(`${criticalHours} hour(s) with critical supply shortage detected in the next ${predictions.length} hours`);
  }

  if (highRiskHours > 0) {
    insights.push(`${highRiskHours} hour(s) with high imbalance risk require attention`);
  }

  // Average ratio insights
  if (avgRatio > 1.2) {
    insights.push('Average supply-demand ratio is elevated - prioritize tutor recruitment');
  } else if (avgRatio < 0.7) {
    insights.push('Excess tutor capacity detected - opportunity to increase student acquisition');
  }

  // Recommendation type insights
  const tutorRecruitCount = recommendations.filter(r => r.type === 'tutor_recruitment').length;
  const budgetAdjustCount = recommendations.filter(r => r.type === 'budget_increase' || r.type === 'budget_decrease').length;

  if (tutorRecruitCount > 3) {
    insights.push(`${tutorRecruitCount} tutor recruitment recommendations - consider systematic hiring campaign`);
  }

  if (budgetAdjustCount > 2) {
    insights.push(`${budgetAdjustCount} budget adjustments suggested - review campaign allocation`);
  }

  // Time-of-day insights
  const timeDistribution = new Map<number, number>();
  predictions.forEach(p => {
    if (p.imbalanceRisk === 'critical' || p.imbalanceRisk === 'high') {
      timeDistribution.set(p.hour, (timeDistribution.get(p.hour) || 0) + 1);
    }
  });

  const peakHour = Array.from(timeDistribution.entries()).reduce(
    (max, entry) => entry[1] > max[1] ? entry : max,
    [0, 0] as [number, number]
  );

  if (peakHour[1] > 0) {
    insights.push(`Peak imbalance occurs around ${peakHour[0]}:00 - focus tutor availability during this window`);
  }

  return insights;
}
