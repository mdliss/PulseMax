/**
 * Advanced Anomaly Detection Engine
 * Implements multiple statistical methods for detecting anomalies in marketplace metrics
 */

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number; // 0-1, higher = more anomalous
  method: string;
  details: {
    value: number;
    expected?: number;
    threshold?: number;
    zScore?: number;
    deviation?: number;
  };
}

export class AnomalyDetector {
  /**
   * Z-Score based anomaly detection
   * Detects values that are N standard deviations away from the mean
   */
  static detectByZScore(
    data: number[],
    currentValue: number,
    threshold: number = 3
  ): AnomalyResult {
    if (data.length < 2) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'z-score',
        details: { value: currentValue }
      };
    }

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'z-score',
        details: { value: currentValue, expected: mean }
      };
    }

    const zScore = Math.abs((currentValue - mean) / stdDev);
    const isAnomaly = zScore > threshold;
    const score = Math.min(1, zScore / (threshold * 2));

    return {
      isAnomaly,
      score,
      method: 'z-score',
      details: {
        value: currentValue,
        expected: mean,
        threshold,
        zScore,
        deviation: stdDev
      }
    };
  }

  /**
   * Modified Z-Score (MAD) based detection
   * More robust to outliers than standard Z-score
   */
  static detectByMAD(
    data: number[],
    currentValue: number,
    threshold: number = 3.5
  ): AnomalyResult {
    if (data.length < 2) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'mad',
        details: { value: currentValue }
      };
    }

    const median = this.calculateMedian(data);
    const deviations = data.map(val => Math.abs(val - median));
    const mad = this.calculateMedian(deviations);

    if (mad === 0) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'mad',
        details: { value: currentValue, expected: median }
      };
    }

    const modifiedZScore = 0.6745 * Math.abs(currentValue - median) / mad;
    const isAnomaly = modifiedZScore > threshold;
    const score = Math.min(1, modifiedZScore / (threshold * 2));

    return {
      isAnomaly,
      score,
      method: 'mad',
      details: {
        value: currentValue,
        expected: median,
        threshold,
        zScore: modifiedZScore
      }
    };
  }

  /**
   * Interquartile Range (IQR) based detection
   * Detects values outside the typical range
   */
  static detectByIQR(
    data: number[],
    currentValue: number,
    multiplier: number = 1.5
  ): AnomalyResult {
    if (data.length < 4) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'iqr',
        details: { value: currentValue }
      };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    const isAnomaly = currentValue < lowerBound || currentValue > upperBound;

    // Calculate score based on how far outside bounds
    let score = 0;
    if (currentValue < lowerBound) {
      score = Math.min(1, (lowerBound - currentValue) / (iqr * multiplier));
    } else if (currentValue > upperBound) {
      score = Math.min(1, (currentValue - upperBound) / (iqr * multiplier));
    }

    return {
      isAnomaly,
      score,
      method: 'iqr',
      details: {
        value: currentValue,
        threshold: multiplier
      }
    };
  }

  /**
   * Moving Average based detection
   * Detects significant deviations from recent trend
   */
  static detectByMovingAverage(
    timeSeries: TimeSeriesDataPoint[],
    windowSize: number = 7,
    threshold: number = 2
  ): AnomalyResult {
    if (timeSeries.length < windowSize + 1) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'moving-average',
        details: { value: timeSeries[timeSeries.length - 1]?.value || 0 }
      };
    }

    // Calculate moving average of previous window
    const window = timeSeries.slice(-windowSize - 1, -1);
    const currentValue = timeSeries[timeSeries.length - 1].value;

    const movingAvg = window.reduce((sum, point) => sum + point.value, 0) / window.length;
    const deviations = window.map(point => Math.pow(point.value - movingAvg, 2));
    const variance = deviations.reduce((sum, dev) => sum + dev, 0) / window.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'moving-average',
        details: { value: currentValue, expected: movingAvg }
      };
    }

    const zScore = Math.abs((currentValue - movingAvg) / stdDev);
    const isAnomaly = zScore > threshold;
    const score = Math.min(1, zScore / (threshold * 2));

    return {
      isAnomaly,
      score,
      method: 'moving-average',
      details: {
        value: currentValue,
        expected: movingAvg,
        threshold,
        zScore,
        deviation: stdDev
      }
    };
  }

  /**
   * Volatility detection using standard deviation
   * Detects periods of unusual variance
   */
  static detectHighVolatility(
    timeSeries: TimeSeriesDataPoint[],
    windowSize: number = 7,
    threshold: number = 2
  ): AnomalyResult {
    if (timeSeries.length < windowSize * 2) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'volatility',
        details: { value: 0 }
      };
    }

    // Calculate volatility (std dev) for recent window
    const recentWindow = timeSeries.slice(-windowSize);
    const recentMean = recentWindow.reduce((sum, p) => sum + p.value, 0) / recentWindow.length;
    const recentVariance = recentWindow.reduce(
      (sum, p) => sum + Math.pow(p.value - recentMean, 2),
      0
    ) / recentWindow.length;
    const recentStdDev = Math.sqrt(recentVariance);

    // Calculate baseline volatility from historical data
    const historicalWindow = timeSeries.slice(-windowSize * 3, -windowSize);
    const historicalMean = historicalWindow.reduce((sum, p) => sum + p.value, 0) / historicalWindow.length;
    const historicalVariance = historicalWindow.reduce(
      (sum, p) => sum + Math.pow(p.value - historicalMean, 2),
      0
    ) / historicalWindow.length;
    const historicalStdDev = Math.sqrt(historicalVariance);

    if (historicalStdDev === 0) {
      return {
        isAnomaly: false,
        score: 0,
        method: 'volatility',
        details: { value: recentStdDev }
      };
    }

    const volatilityRatio = recentStdDev / historicalStdDev;
    const isAnomaly = volatilityRatio > threshold;
    const score = Math.min(1, (volatilityRatio - 1) / threshold);

    return {
      isAnomaly,
      score,
      method: 'volatility',
      details: {
        value: recentStdDev,
        expected: historicalStdDev,
        threshold
      }
    };
  }

  /**
   * Ensemble detection - combines multiple methods
   * Returns true if majority of methods detect anomaly
   */
  static detectByEnsemble(
    data: number[],
    currentValue: number,
    options: {
      zScoreThreshold?: number;
      madThreshold?: number;
      iqrMultiplier?: number;
      minMethodsAgreement?: number;
    } = {}
  ): AnomalyResult {
    const {
      zScoreThreshold = 3,
      madThreshold = 3.5,
      iqrMultiplier = 1.5,
      minMethodsAgreement = 2
    } = options;

    const results = [
      this.detectByZScore(data, currentValue, zScoreThreshold),
      this.detectByMAD(data, currentValue, madThreshold),
      this.detectByIQR(data, currentValue, iqrMultiplier)
    ];

    const anomalyCount = results.filter(r => r.isAnomaly).length;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    return {
      isAnomaly: anomalyCount >= minMethodsAgreement,
      score: avgScore,
      method: 'ensemble',
      details: {
        value: currentValue,
        threshold: minMethodsAgreement
      }
    };
  }

  /**
   * Helper: Calculate median of array
   */
  private static calculateMedian(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

export const anomalyDetector = AnomalyDetector;
