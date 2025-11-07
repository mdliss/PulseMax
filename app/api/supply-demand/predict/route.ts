import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HistoricalDataPoint {
  timestamp: string;
  hour: number;
  dayOfWeek: number;
  sessionVolume: number;
  availableTutors: number;
  activeTutors: number;
  supplyDemandRatio: number;
}

interface Prediction {
  timestamp: string;
  hour: number;
  dayOfWeek: number;
  predictedSessionVolume: number;
  predictedAvailableTutors: number;
  predictedSupplyDemandRatio: number;
  confidence: number;
  imbalanceRisk: 'low' | 'medium' | 'high' | 'critical';
}

// Simple moving average
function calculateMovingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0;
  const relevantValues = values.slice(-window);
  return relevantValues.reduce((sum, val) => sum + val, 0) / relevantValues.length;
}

// Calculate prediction using pattern matching and moving averages
function predictNextHours(historicalData: HistoricalDataPoint[], hoursAhead: number = 24): Prediction[] {
  const predictions: Prediction[] = [];
  const now = new Date();

  // Group historical data by hour of day and day of week for pattern detection
  const patternMap = new Map<string, number[]>();

  historicalData.forEach(point => {
    const key = `${point.dayOfWeek}-${point.hour}`;
    if (!patternMap.has(key)) {
      patternMap.set(key, []);
    }
    patternMap.get(key)!.push(point.sessionVolume);
  });

  // Calculate average available tutors
  const avgAvailableTutors = calculateMovingAverage(
    historicalData.map(d => d.availableTutors),
    historicalData.length
  );

  // Generate predictions for next N hours
  for (let i = 1; i <= hoursAhead; i++) {
    const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = futureTime.getHours();
    const dayOfWeek = futureTime.getDay();
    const key = `${dayOfWeek}-${hour}`;

    // Get historical pattern for this hour/day combination
    const historicalPattern = patternMap.get(key) || [];

    // Use moving average of similar time slots, or overall average
    let predictedVolume: number;
    let confidence: number;

    if (historicalPattern.length > 0) {
      predictedVolume = calculateMovingAverage(historicalPattern, historicalPattern.length);
      confidence = Math.min(0.95, historicalPattern.length / 10); // More data = higher confidence
    } else {
      // Fallback to overall moving average
      predictedVolume = calculateMovingAverage(
        historicalData.map(d => d.sessionVolume),
        Math.min(24, historicalData.length)
      );
      confidence = 0.5; // Lower confidence for fallback
    }

    // Add some seasonality and trend adjustments
    const recentTrend = historicalData.slice(-24).map(d => d.sessionVolume);
    const trendFactor = recentTrend.length > 0
      ? calculateMovingAverage(recentTrend, recentTrend.length) / calculateMovingAverage(historicalData.map(d => d.sessionVolume), historicalData.length)
      : 1;

    predictedVolume *= trendFactor;

    // Predict available tutors (assume slight growth or stability)
    const predictedAvailableTutors = Math.max(1, Math.round(avgAvailableTutors * (0.95 + Math.random() * 0.1)));

    const predictedRatio = predictedAvailableTutors > 0 ? predictedVolume / predictedAvailableTutors : 0;

    // Determine imbalance risk
    let imbalanceRisk: Prediction['imbalanceRisk'];
    if (predictedRatio > 1.5) imbalanceRisk = 'critical';
    else if (predictedRatio > 1.2) imbalanceRisk = 'high';
    else if (predictedRatio > 0.9) imbalanceRisk = 'medium';
    else imbalanceRisk = 'low';

    predictions.push({
      timestamp: futureTime.toISOString(),
      hour,
      dayOfWeek,
      predictedSessionVolume: Math.round(predictedVolume),
      predictedAvailableTutors,
      predictedSupplyDemandRatio: parseFloat(predictedRatio.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      imbalanceRisk
    });
  }

  return predictions;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam) : 24;

    // Fetch historical data from the historical endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const historicalResponse = await fetch(`${baseUrl}/api/supply-demand/historical?days=30`);

    if (!historicalResponse.ok) {
      throw new Error('Failed to fetch historical data');
    }

    const historicalResult = await historicalResponse.json();
    const historicalData: HistoricalDataPoint[] = historicalResult.data;

    // Generate predictions
    const predictions = predictNextHours(historicalData, hours);

    // Calculate summary statistics
    const criticalCount = predictions.filter(p => p.imbalanceRisk === 'critical').length;
    const highCount = predictions.filter(p => p.imbalanceRisk === 'high').length;
    const mediumCount = predictions.filter(p => p.imbalanceRisk === 'medium').length;
    const lowCount = predictions.filter(p => p.imbalanceRisk === 'low').length;

    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    return NextResponse.json({
      predictions,
      summary: {
        totalPredictions: predictions.length,
        hoursAhead: hours,
        criticalRiskHours: criticalCount,
        highRiskHours: highCount,
        mediumRiskHours: mediumCount,
        lowRiskHours: lowCount,
        averageConfidence: parseFloat(avgConfidence.toFixed(2))
      },
      modelInfo: {
        method: 'Pattern-based Moving Average',
        dataPoints: historicalData.length,
        historicalDays: 30
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating supply-demand predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
