/**
 * Time Series Forecasting Engine
 * Uses Holt-Winters exponential smoothing with seasonality detection
 */

import { linearRegression } from 'simple-statistics';

interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

interface SeasonalComponents {
  level: number;
  trend: number;
  seasonal: number[];
  seasonalPeriod: number;
}

interface ForecastResult {
  timestamp: Date;
  predicted: number;
  lower: number; // Lower confidence bound
  upper: number; // Upper confidence bound
  confidence: number;
}

export class TimeSeriesForecaster {
  private alpha = 0.3; // Level smoothing parameter
  private beta = 0.1; // Trend smoothing parameter
  private gamma = 0.3; // Seasonal smoothing parameter
  private seasonalPeriod = 24; // 24 hours for hourly data

  /**
   * Holt-Winters Triple Exponential Smoothing
   * Handles level, trend, and seasonality
   */
  private holtWinters(
    data: number[],
    seasonalPeriod: number
  ): SeasonalComponents {
    if (data.length < seasonalPeriod * 2) {
      // Not enough data for seasonal decomposition
      return this.simpleExponentialSmoothing(data);
    }

    // Initialize level, trend, and seasonal components
    const level = data.slice(0, seasonalPeriod).reduce((a, b) => a + b, 0) / seasonalPeriod;

    // Calculate initial trend
    const firstPeriodAvg = data.slice(0, seasonalPeriod).reduce((a, b) => a + b, 0) / seasonalPeriod;
    const secondPeriodAvg = data.slice(seasonalPeriod, seasonalPeriod * 2).reduce((a, b) => a + b, 0) / seasonalPeriod;
    const trend = (secondPeriodAvg - firstPeriodAvg) / seasonalPeriod;

    // Calculate initial seasonal components
    const seasonal: number[] = [];
    for (let i = 0; i < seasonalPeriod; i++) {
      const seasonalValues: number[] = [];
      for (let j = i; j < data.length; j += seasonalPeriod) {
        if (data[j] !== undefined) {
          seasonalValues.push(data[j] - level);
        }
      }
      seasonal[i] = seasonalValues.length > 0
        ? seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length
        : 0;
    }

    // Normalize seasonal components to sum to zero
    const seasonalSum = seasonal.reduce((a, b) => a + b, 0);
    const seasonalAvg = seasonalSum / seasonalPeriod;
    for (let i = 0; i < seasonalPeriod; i++) {
      seasonal[i] -= seasonalAvg;
    }

    return {
      level,
      trend,
      seasonal,
      seasonalPeriod
    };
  }

  /**
   * Fallback: Simple exponential smoothing
   */
  private simpleExponentialSmoothing(data: number[]): SeasonalComponents {
    const level = data.reduce((a, b) => a + b, 0) / data.length;

    // Calculate simple trend
    const points = data.map((value, index) => [index, value]);
    const regression = linearRegression(points);
    const trend = regression.m;

    return {
      level,
      trend,
      seasonal: Array(24).fill(0),
      seasonalPeriod: 24
    };
  }

  /**
   * Detect seasonality period (24 hours, 168 hours/week, etc.)
   */
  private detectSeasonality(data: number[]): number {
    // For marketplace data, we expect daily (24-hour) patterns
    // Could be enhanced with autocorrelation analysis
    if (data.length >= 168) {
      return 24; // Daily seasonality
    } else if (data.length >= 24) {
      return 24;
    } else {
      return Math.min(12, Math.floor(data.length / 2));
    }
  }

  /**
   * Calculate forecast confidence based on historical variance
   */
  private calculateConfidence(
    historicalData: number[],
    forecastHorizon: number
  ): number {
    const variance = this.calculateVariance(historicalData);
    const dataQuality = Math.min(1, historicalData.length / 168); // More data = higher confidence
    const horizonPenalty = Math.max(0, 1 - (forecastHorizon / 72)); // Confidence decreases with distance

    // Combine factors
    const baseConfidence = 0.95;
    const variancePenalty = Math.min(0.3, variance / 100);

    return Math.max(0.4, baseConfidence * dataQuality * horizonPenalty - variancePenalty);
  }

  /**
   * Calculate variance of data
   */
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  }

  /**
   * Calculate confidence intervals
   */
  private calculateConfidenceIntervals(
    predicted: number,
    variance: number,
    confidence: number
  ): { lower: number; upper: number } {
    // Use z-score for confidence intervals
    // 95% confidence ≈ 1.96 standard deviations
    const zScore = confidence * 2;
    const stdDev = Math.sqrt(variance);
    const margin = zScore * stdDev;

    return {
      lower: Math.max(0, predicted - margin),
      upper: predicted + margin
    };
  }

  /**
   * Generate forecast for next N hours
   */
  public forecast(
    historicalData: TimeSeriesDataPoint[],
    hoursAhead: number
  ): ForecastResult[] {
    if (historicalData.length < 24) {
      throw new Error('Need at least 24 hours of historical data');
    }

    // Extract values and sort by timestamp
    const sortedData = historicalData.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const values = sortedData.map(d => d.value);
    const lastTimestamp = sortedData[sortedData.length - 1].timestamp;

    // Detect seasonality
    const seasonalPeriod = this.detectSeasonality(values);
    this.seasonalPeriod = seasonalPeriod;

    // Decompose time series
    const components = this.holtWinters(values, seasonalPeriod);
    const variance = this.calculateVariance(values);

    // Generate forecasts
    const forecasts: ForecastResult[] = [];

    for (let h = 1; h <= hoursAhead; h++) {
      const futureTimestamp = new Date(lastTimestamp.getTime() + h * 60 * 60 * 1000);

      // Holt-Winters forecast
      const seasonalIndex = h % seasonalPeriod;
      const predicted = Math.max(
        0,
        components.level + (h * components.trend) + components.seasonal[seasonalIndex]
      );

      // Calculate confidence
      const confidence = this.calculateConfidence(values, h);

      // Calculate confidence intervals
      const intervals = this.calculateConfidenceIntervals(
        predicted,
        variance * (1 + h / 24), // Variance increases with forecast horizon
        confidence
      );

      forecasts.push({
        timestamp: futureTimestamp,
        predicted: Math.round(predicted * 100) / 100,
        lower: Math.round(intervals.lower * 100) / 100,
        upper: Math.round(intervals.upper * 100) / 100,
        confidence: Math.round(confidence * 100) / 100
      });
    }

    return forecasts;
  }

  /**
   * Detect anomalies in recent data
   */
  public detectAnomalies(
    historicalData: TimeSeriesDataPoint[],
    threshold: number = 2.5 // Standard deviations
  ): TimeSeriesDataPoint[] {
    const values = historicalData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(this.calculateVariance(values));

    return historicalData.filter(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      return zScore > threshold;
    });
  }

  /**
   * Calculate forecast accuracy metrics (MAPE - Mean Absolute Percentage Error)
   */
  public calculateAccuracy(
    actual: number[],
    predicted: number[]
  ): { mape: number; rmse: number } {
    if (actual.length !== predicted.length || actual.length === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }

    // MAPE (Mean Absolute Percentage Error)
    let totalPercentageError = 0;
    let validPoints = 0;

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== 0) {
        totalPercentageError += Math.abs((actual[i] - predicted[i]) / actual[i]);
        validPoints++;
      }
    }

    const mape = validPoints > 0 ? (totalPercentageError / validPoints) * 100 : 0;

    // RMSE (Root Mean Squared Error)
    const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
    const mse = squaredErrors.reduce((a, b) => a + b, 0) / actual.length;
    const rmse = Math.sqrt(mse);

    return {
      mape: Math.round(mape * 100) / 100,
      rmse: Math.round(rmse * 100) / 100
    };
  }
}

// Singleton instance
export const timeSeriesForecaster = new TimeSeriesForecaster();
