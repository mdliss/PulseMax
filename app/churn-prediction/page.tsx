'use client';

import { useEffect, useState } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

interface ChurnPrediction {
  customerId: string;
  customerSegment: string;
  churnProbability: number;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  interventionRecommendations: string[];
  confidence: number;
}

interface ChurnData {
  predictions: ChurnPrediction[];
  summary: {
    totalCustomers: number;
    byRisk: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    averageChurnProbability: number;
    highRiskCount: number;
  };
  featureImportance: { feature: string; importance: number }[];
  timestamp: string;
}

export default function ChurnPredictionPage() {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<ChurnPrediction | null>(null);
  const [data, setData] = useState<ChurnData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use polling for real-time updates (works on Vercel Free)
  useEffect(() => {
    console.log('Using mock data mode');

    const fetchData = async () => {
      try {
        const response = await fetch('/api/churn-prediction');
        if (!response.ok) throw new Error('Failed to fetch data');
        const fetchedData = await response.json();

        setData(fetchedData);
        setIsConnected(true);
        setError(null);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl loading">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl" style={{ color: 'var(--error)' }}>Error: {error}</div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#0d9488'; // Dark teal
      case 'high': return '#14b8a6';     // Main teal
      case 'medium': return '#2dd4bf';   // Medium teal
      case 'low': return '#5eead4';      // Light teal
      default: return 'var(--text-secondary)';
    }
  };

  // Filter predictions based on selected risk level
  const filteredPredictions = riskFilter === 'all'
    ? data.predictions
    : data.predictions.filter(p => p.churnRisk === riskFilter);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 drop-in-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                Customer Churn Prediction
              </h1>
              <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                Real-time AI forecasting • Last updated: {lastUpdate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: isConnected ? '#14b8a6' : '#5eead4'
                }}
              />
              <span className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Filter Tabs */}
        <div className="mb-6 drop-in-2">
          <div className="flex gap-2 flex-wrap">
            {['all', 'critical', 'high', 'medium', 'low'].map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className="px-4 py-2 rounded-lg transition-all capitalize text-sm md:text-base"
                style={{
                  backgroundColor: riskFilter === risk ? '#14b8a6' : 'var(--card-bg)',
                  color: riskFilter === risk ? 'white' : 'var(--foreground)',
                  border: `1px solid ${riskFilter === risk ? '#14b8a6' : 'var(--border-color)'}`
                }}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div
            className="rounded-lg p-4 md:p-6 border card-hover drop-in-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderLeftWidth: '4px',
              borderLeftColor: '#0d9488'
            }}
          >
            <h3 className="text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Critical Risk
            </h3>
            <AnimatedCounter
              value={data.summary.byRisk.critical}
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <div
            className="rounded-lg p-4 md:p-6 border card-hover drop-in-3"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderLeftWidth: '4px',
              borderLeftColor: '#14b8a6'
            }}
          >
            <h3 className="text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              High Risk
            </h3>
            <AnimatedCounter
              value={data.summary.byRisk.high}
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <div
            className="rounded-lg p-4 md:p-6 border card-hover drop-in-4"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderLeftWidth: '4px',
              borderLeftColor: '#2dd4bf'
            }}
          >
            <h3 className="text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Avg Churn Risk
            </h3>
            <AnimatedCounter
              value={(data.summary.averageChurnProbability * 100).toFixed(1) + '%'}
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <div
            className="rounded-lg p-4 md:p-6 border card-hover drop-in-5"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              borderLeftWidth: '4px',
              borderLeftColor: '#5eead4'
            }}
          >
            <h3 className="text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Total Analyzed
            </h3>
            <AnimatedCounter
              value={data.summary.totalCustomers}
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Prediction Model Info */}
        <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Prediction Model
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Method</p>
              <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--foreground)' }}>Logistic Regression</p>
            </div>
            <div>
              <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Training Data Points</p>
              <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--foreground)' }}>5,420</p>
            </div>
            <div>
              <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Historical Days</p>
              <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--foreground)' }}>90</p>
            </div>
          </div>
        </div>

        {/* Top Churn Indicators */}
        <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Top Churn Indicators
          </h2>
          <div className="space-y-3">
            {data.featureImportance.slice(0, 5).map((feature, index) => {
              const maxImportance = data.featureImportance[0].importance;
              const percentage = (feature.importance / maxImportance) * 100;
              return (
                <div key={feature.feature}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>
                      {feature.feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {feature.importance.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: '#14b8a6',
                        transition: 'width 1200ms ease-in-out',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* At-Risk Customers */}
        <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-5" style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          minHeight: filteredPredictions.length > 0 ? 'auto' : '200px'
        }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            At-Risk Customers {filteredPredictions.length > 0 && `(${filteredPredictions.length})`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', borderLeft: '4px solid #0d9488' }}>
              <p className="font-semibold" style={{ color: '#0d9488' }}>Critical</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                <AnimatedCounter value={data.summary.byRisk.critical} />
              </p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', borderLeft: '4px solid #14b8a6' }}>
              <p className="font-semibold" style={{ color: '#14b8a6' }}>High</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                <AnimatedCounter value={data.summary.byRisk.high} />
              </p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)', borderLeft: '4px solid #2dd4bf' }}>
              <p className="font-semibold" style={{ color: '#2dd4bf' }}>Medium</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                <AnimatedCounter value={data.summary.byRisk.medium} />
              </p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(94, 234, 212, 0.1)', borderLeft: '4px solid #5eead4' }}>
              <p className="font-semibold" style={{ color: '#5eead4' }}>Low</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                <AnimatedCounter value={data.summary.byRisk.low} />
              </p>
            </div>
          </div>

          <div style={{ height: '400px', overflowY: 'auto' }}>
            {filteredPredictions.length > 0 ? (
              <div className="space-y-3">
                {filteredPredictions.map((prediction, index) => (
                  <div
                    key={prediction.customerId}
                    className="p-4 rounded"
                    style={{
                      backgroundColor: getRiskColor(prediction.churnRisk),
                      color: 'white',
                      animation: `slideDown 0.4s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {prediction.churnRisk}:
                          </span>
                          <span className="font-medium">{prediction.customerId}</span>
                          <span className="text-xs opacity-75 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                            {prediction.customerSegment}
                          </span>
                        </div>
                        <div className="text-sm opacity-90">
                          Churn Probability: {(prediction.churnProbability * 100).toFixed(1)}% | Model Confidence: {(prediction.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full transition-opacity duration-300">
                <p className="text-lg font-medium" style={{ color: 'var(--success)' }}>
                  No customers at {riskFilter} risk level
                </p>
              </div>
            )}
          </div>
          <style jsx>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>

        {/* Understanding Churn Indicators */}
        <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-6" style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          borderLeft: '4px solid #14b8a6'
        }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Understanding the Churn Indicators
          </h2>
          <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
            <p className="text-sm md:text-base">
              The <strong style={{ color: 'var(--foreground)' }}>Top Churn Indicators</strong> section shows the relative importance of each factor in our prediction model.
              These values represent how much weight each metric carries when calculating churn risk.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--background)' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#14b8a6' }}>What the Numbers Mean</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Higher values = stronger impact on churn prediction</li>
                  <li>These are model coefficients, not customer averages</li>
                  <li>Values are static and don't change with new data</li>
                </ul>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: 'var(--background)' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#14b8a6' }}>How to Use This Information</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Focus on improving the top-weighted metrics</li>
                  <li>Average Rating & Session Velocity are most critical</li>
                  <li>Monitor these metrics closely for at-risk customers</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Example Interpretation</h3>
              <p className="text-sm">
                <strong style={{ color: 'var(--foreground)' }}>Average Rating (0.58)</strong> has the highest weight, meaning customer satisfaction
                ratings have the strongest influence on whether someone will churn. A customer with low ratings is significantly more likely to cancel
                their subscription than someone with high ratings, all else being equal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
