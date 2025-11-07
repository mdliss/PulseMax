import { NextResponse } from 'next/server';
import { timeSeriesForecaster } from '@/lib/forecasting/timeSeriesForecaster';

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
  lower: number; // Lower confidence bound
  upper: number; // Upper confidence bound
}

/**
 * Generate predictions using Holt-Winters exponential smoothing
 */
function predictNextHours(historicalData: HistoricalDataPoint[], hoursAhead: number = 24): Prediction[] {
  const predictions: Prediction[] = [];

  // Prepare session volume time series data
  const sessionVolumeData = historicalData.map(point => ({
    timestamp: new Date(point.timestamp),
    value: point.sessionVolume
  }));

  // Prepare tutor availability time series data
  const tutorAvailabilityData = historicalData.map(point => ({
    timestamp: new Date(point.timestamp),
    value: point.availableTutors
  }));

  try {
    // Forecast session volumes using Holt-Winters
    const sessionForecasts = timeSeriesForecaster.forecast(sessionVolumeData, hoursAhead);

    // Forecast tutor availability
    const tutorForecasts = timeSeriesForecaster.forecast(tutorAvailabilityData, hoursAhead);

    // Combine forecasts
    for (let i = 0; i < hoursAhead; i++) {
      const sessionForecast = sessionForecasts[i];
      const tutorForecast = tutorForecasts[i];

      const predictedSessionVolume = Math.max(0, Math.round(sessionForecast.predicted));
      const predictedAvailableTutors = Math.max(1, Math.round(tutorForecast.predicted));
      const predictedRatio = predictedAvailableTutors > 0
        ? predictedSessionVolume / predictedAvailableTutors
        : 0;

      // Determine imbalance risk based on supply/demand ratio
      let imbalanceRisk: Prediction['imbalanceRisk'];
      if (predictedRatio > 1.5) imbalanceRisk = 'critical';
      else if (predictedRatio > 1.2) imbalanceRisk = 'high';
      else if (predictedRatio > 0.9) imbalanceRisk = 'medium';
      else imbalanceRisk = 'low';

      // Use average confidence from both forecasts
      const averageConfidence = (sessionForecast.confidence + tutorForecast.confidence) / 2;

      predictions.push({
        timestamp: sessionForecast.timestamp.toISOString(),
        hour: sessionForecast.timestamp.getHours(),
        dayOfWeek: sessionForecast.timestamp.getDay(),
        predictedSessionVolume,
        predictedAvailableTutors,
        predictedSupplyDemandRatio: parseFloat(predictedRatio.toFixed(2)),
        confidence: parseFloat(averageConfidence.toFixed(2)),
        imbalanceRisk,
        lower: Math.max(0, Math.round(sessionForecast.lower)),
        upper: Math.round(sessionForecast.upper)
      });
    }
  } catch (error) {
    console.error('Forecasting error:', error);
    // Return simple baseline forecast if advanced forecasting fails
    return generateBaselineForecast(historicalData, hoursAhead);
  }

  return predictions;
}

/**
 * Fallback: Simple baseline forecast using recent averages
 */
function generateBaselineForecast(historicalData: HistoricalDataPoint[], hoursAhead: number): Prediction[] {
  const predictions: Prediction[] = [];
  const now = new Date();

  // Calculate recent averages (use all available data if less than 24 hours)
  const recentData = historicalData.length >= 24 ? historicalData.slice(-24) : historicalData;

  // Ensure we have at least some data
  if (recentData.length === 0) {
    // Emergency fallback with reasonable defaults
    const avgSessionVolume = 15;
    const avgAvailableTutors = 20;

    for (let i = 1; i <= hoursAhead; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      predictions.push({
        timestamp: futureTime.toISOString(),
        hour: futureTime.getHours(),
        dayOfWeek: futureTime.getDay(),
        predictedSessionVolume: avgSessionVolume,
        predictedAvailableTutors: avgAvailableTutors,
        predictedSupplyDemandRatio: 0.75,
        confidence: 0.3,
        imbalanceRisk: 'low',
        lower: avgSessionVolume - 5,
        upper: avgSessionVolume + 5
      });
    }
    return predictions;
  }

  const avgSessionVolume = recentData.reduce((sum, d) => sum + d.sessionVolume, 0) / recentData.length;
  const avgAvailableTutors = recentData.reduce((sum, d) => sum + d.availableTutors, 0) / recentData.length;

  for (let i = 1; i <= hoursAhead; i++) {
    const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const predictedRatio = avgAvailableTutors > 0 ? avgSessionVolume / avgAvailableTutors : 0;

    let imbalanceRisk: Prediction['imbalanceRisk'];
    if (predictedRatio > 1.5) imbalanceRisk = 'critical';
    else if (predictedRatio > 1.2) imbalanceRisk = 'high';
    else if (predictedRatio > 0.9) imbalanceRisk = 'medium';
    else imbalanceRisk = 'low';

    predictions.push({
      timestamp: futureTime.toISOString(),
      hour: futureTime.getHours(),
      dayOfWeek: futureTime.getDay(),
      predictedSessionVolume: Math.round(avgSessionVolume),
      predictedAvailableTutors: Math.round(avgAvailableTutors),
      predictedSupplyDemandRatio: parseFloat(predictedRatio.toFixed(2)),
      confidence: 0.6, // Lower confidence for baseline
      imbalanceRisk,
      lower: Math.round(avgSessionVolume * 0.7),
      upper: Math.round(avgSessionVolume * 1.3)
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
        method: 'Holt-Winters Exponential Smoothing',
        algorithm: 'Triple Exponential Smoothing with Seasonal Decomposition',
        dataPoints: historicalData.length,
        historicalDays: 30,
        features: [
          'Trend detection',
          'Seasonality modeling (24-hour cycles)',
          'Confidence intervals',
          'Anomaly detection'
        ]
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
