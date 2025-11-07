'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useSSE } from '@/lib/hooks/useSSE';
import { AnimatedCounter } from '@/components/AnimatedCounter';

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

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  predictedTime: string;
  predictedSessionVolume: number;
  predictedAvailableTutors: number;
  supplyDemandRatio: number;
  hoursUntil: number;
  message: string;
  recommendation: string;
  createdAt: string;
}

interface PredictionData {
  predictions: Prediction[];
  summary: {
    totalPredictions: number;
    hoursAhead: number;
    criticalRiskHours: number;
    highRiskHours: number;
    mediumRiskHours: number;
    lowRiskHours: number;
    averageConfidence: number;
  };
  modelInfo: {
    method: string;
    dataPoints: number;
    historicalDays: number;
  };
}

interface AlertData {
  alerts: Alert[];
  summary: {
    totalAlerts: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

interface CombinedSSEData {
  predictionData: PredictionData;
  alertData: AlertData;
}

export default function SupplyDemandPage() {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Use SSE for real-time updates
  const { data: combinedData, isConnected, error: sseError } = useSSE<CombinedSSEData>(
    '/api/sse/supply-demand?interval=5000',
    {
      enabled: true,
      onOpen: () => {
        console.log('[Client] SSE connected to supply-demand');
      },
      onError: (err) => {
        console.error('[Client] SSE error:', err);
      },
    }
  );

  // Update timestamp when new data arrives
  useEffect(() => {
    if (combinedData) {
      console.log('[Client] Received SSE data update:', {
        predictions: combinedData.predictionData?.summary?.totalPredictions,
        alerts: combinedData.alertData?.summary?.totalAlerts,
      });
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [combinedData]);

  if (!combinedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl loading">Connecting to real-time data...</div>
      </div>
    );
  }

  if (sseError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl" style={{ color: 'var(--error)' }}>Error: {sseError}</div>
      </div>
    );
  }

  const predictionData = combinedData.predictionData;
  const alertData = combinedData.alertData;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { backgroundColor: '#0d9488', color: 'white' }; // Darker teal
      case 'high':
        return { backgroundColor: '#14b8a6', color: 'white' }; // Main teal
      case 'medium':
        return { backgroundColor: '#2dd4bf', color: 'var(--background)' }; // Medium teal
      default:
        return { backgroundColor: '#5eead4', color: 'var(--background)' }; // Light teal
    }
  };

  // Prepare chart data
  const chartData = predictionData.predictions.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    sessions: p.predictedSessionVolume,
    tutors: p.predictedAvailableTutors,
    ratio: p.predictedSupplyDemandRatio,
    confidence: p.confidence * 100
  }));

  const metricCards = [
    {
      title: 'Critical Risk Hours',
      value: predictionData.summary.criticalRiskHours,
      color: '#0d9488' // Darker teal
    },
    {
      title: 'High Risk Hours',
      value: predictionData.summary.highRiskHours,
      color: '#14b8a6' // Main teal
    },
    {
      title: 'Average Confidence',
      value: `${(predictionData.summary.averageConfidence * 100).toFixed(0)}%`,
      color: '#14b8a6' // Main teal
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 drop-in-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                Supply vs. Demand Predictions
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

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {metricCards.map((metric, index) => {
            const animationClass = ['drop-in-1', 'drop-in-2', 'drop-in-3'][index];
            return (
              <div
                key={index}
                className={`rounded-lg p-4 md:p-6 border card-hover ${animationClass}`}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderLeftWidth: '4px',
                  borderLeftColor: metric.color
                }}
              >
                <h3 className="text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {metric.title}
                </h3>
                <AnimatedCounter
                  value={metric.value}
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
            );
          })}
        </div>

        {/* Model Info */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Prediction Model
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Method</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {predictionData.modelInfo.method}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Training Data Points</p>
              <AnimatedCounter
                value={predictionData.modelInfo.dataPoints}
                className="text-lg font-semibold inline"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Historical Days</p>
              <AnimatedCounter
                value={predictionData.modelInfo.historicalDays}
                className="text-lg font-semibold inline"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
          </div>
        </div>

        {/* Alerts - Always reserve space to prevent layout shift */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-3" style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          minHeight: alertData.summary.totalAlerts > 0 ? 'auto' : '200px'
        }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Supply-Demand Alerts {alertData.summary.totalAlerts > 0 && `(${alertData.summary.totalAlerts})`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', borderLeft: '4px solid #0d9488' }}>
              <p className="font-semibold" style={{ color: '#0d9488' }}>Critical</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.criticalCount}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', borderLeft: '4px solid #14b8a6' }}>
              <p className="font-semibold" style={{ color: '#14b8a6' }}>High</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.highCount}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)', borderLeft: '4px solid #2dd4bf' }}>
              <p className="font-semibold" style={{ color: '#2dd4bf' }}>Medium</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.mediumCount}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(94, 234, 212, 0.1)', borderLeft: '4px solid #5eead4' }}>
              <p className="font-semibold" style={{ color: '#5eead4' }}>Low</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.lowCount}</p>
            </div>
          </div>

          <div style={{ height: '300px', overflowY: 'auto' }}>
            {alertData.summary.totalAlerts > 0 ? (
              <div className="space-y-3">
                {alertData.alerts.map((alert, index) => {
                  const severityConfig = {
                    critical: { color: '#0d9488', bg: '#0d9488' },
                    high: { color: '#14b8a6', bg: '#14b8a6' },
                    medium: { color: '#2dd4bf', bg: '#2dd4bf' },
                    low: { color: '#5eead4', bg: '#5eead4' }
                  };
                  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig['low'];

                  return (
                    <div
                      key={index}
                      className="p-4 rounded transition-all"
                      style={{
                        backgroundColor: config.bg,
                        color: 'white'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {alert.severity}:
                          </span>
                          <span className="ml-2 font-medium">{alert.message}</span>
                        </div>
                        <span className="text-xs opacity-90 ml-4 whitespace-nowrap">
                          {new Date(alert.predictedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm opacity-90">
                        Current: {alert.predictedSessionVolume} sessions | Baseline: {alert.predictedAvailableTutors} tutors
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-lg font-medium" style={{ color: 'var(--success)' }}>
                  All Systems Balanced
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  No supply-demand imbalances detected in the next 24 hours
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Supply vs Demand Forecast */}
          <div className="rounded-lg p-6 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              24-Hour Supply vs. Demand Forecast
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.3}
                  name="Predicted Sessions"
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="tutors"
                  stroke="#5eead4"
                  fill="#5eead4"
                  fillOpacity={0.3}
                  name="Available Tutors"
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Supply-Demand Ratio */}
          <div className="rounded-lg p-6 border card-hover drop-in-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Supply-Demand Ratio Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Line
                  type="monotone"
                  dataKey="ratio"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  name="Demand/Supply Ratio"
                  dot={{ fill: '#14b8a6', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--background)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: '#5eead4' }}>● &lt; 0.9</span> = Excess capacity •
                <span style={{ color: '#2dd4bf' }}> ● 0.9-1.2</span> = Balanced •
                <span style={{ color: '#14b8a6' }}> ● 1.2-1.5</span> = High demand •
                <span style={{ color: '#0d9488' }}> ● &gt; 1.5</span> = Critical
              </p>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="rounded-lg p-6 border card-hover drop-in-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Imbalance Risk Distribution (Next 24 Hours)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', borderLeft: '4px solid #0d9488' }}>
              <p className="font-semibold" style={{ color: '#0d9488' }}>Critical Risk</p>
              <AnimatedCounter
                value={predictionData.summary.criticalRiskHours}
                className="text-3xl font-bold"
                style={{ color: 'var(--foreground)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', borderLeft: '4px solid #14b8a6' }}>
              <p className="font-semibold" style={{ color: '#14b8a6' }}>High Risk</p>
              <AnimatedCounter
                value={predictionData.summary.highRiskHours}
                className="text-3xl font-bold"
                style={{ color: 'var(--foreground)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)', borderLeft: '4px solid #2dd4bf' }}>
              <p className="font-semibold" style={{ color: '#2dd4bf' }}>Medium Risk</p>
              <AnimatedCounter
                value={predictionData.summary.mediumRiskHours}
                className="text-3xl font-bold"
                style={{ color: 'var(--foreground)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(94, 234, 212, 0.1)', borderLeft: '4px solid #5eead4' }}>
              <p className="font-semibold" style={{ color: '#5eead4' }}>Low Risk</p>
              <AnimatedCounter
                value={predictionData.summary.lowRiskHours}
                className="text-3xl font-bold"
                style={{ color: 'var(--foreground)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
