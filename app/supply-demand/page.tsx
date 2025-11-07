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

export default function SupplyDemandPage() {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    try {
      const [predictResponse, alertResponse] = await Promise.all([
        fetch('/api/supply-demand/predict?hours=24'),
        fetch('/api/supply-demand/alerts')
      ]);

      if (!predictResponse.ok || !alertResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const predictions = await predictResponse.json();
      const alerts = await alertResponse.json();

      setPredictionData(predictions);
      setAlertData(alerts);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl state-loading">Loading supply-demand predictions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl state-error">Error: {error}</div>
      </div>
    );
  }

  if (!predictionData || !alertData) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { backgroundColor: 'var(--error)', color: 'white' };
      case 'high':
        return { backgroundColor: 'var(--warning)', color: 'var(--background)' };
      case 'medium':
        return { backgroundColor: 'var(--info)', color: 'var(--background)' };
      default:
        return { backgroundColor: 'var(--accent)', color: 'var(--background)' };
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'var(--error)';
      case 'high':
        return 'var(--warning)';
      case 'medium':
        return 'var(--info)';
      default:
        return 'var(--success)';
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Supply vs. Demand Predictions
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            AI-powered forecasting • Last updated: {lastUpdate}
          </p>
        </div>

        {/* Model Info */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
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
              <p className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {predictionData.modelInfo.dataPoints}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)' }}>Average Confidence</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--success)' }}>
                {(predictionData.summary.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alertData.summary.totalAlerts > 0 && (
          <div className="rounded-lg p-6 mb-8 border card-hover drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Supply-Demand Alerts ({alertData.summary.totalAlerts})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)' }}>
                <p className="font-semibold" style={{ color: 'var(--error)' }}>Critical</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.criticalCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: '4px solid var(--warning)' }}>
                <p className="font-semibold" style={{ color: 'var(--warning)' }}>High</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.highCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--info)' }}>
                <p className="font-semibold" style={{ color: 'var(--info)' }}>Medium</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.mediumCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)' }}>
                <p className="font-semibold" style={{ color: 'var(--success)' }}>Low</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{alertData.summary.lowCount}</p>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alertData.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg"
                  style={getSeverityColor(alert.severity)}
                >
                  <div className="mb-2">
                    <p className="font-semibold text-lg">{alert.message}</p>
                    <p className="text-sm opacity-90 mt-1">
                      In {alert.hoursUntil} hour{alert.hoursUntil !== 1 ? 's' : ''} •
                      {alert.predictedSessionVolume} sessions / {alert.predictedAvailableTutors} tutors •
                      Ratio: {alert.supplyDemandRatio.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                    <p className="text-sm font-medium">💡 Recommendation:</p>
                    <p className="text-sm opacity-90">{alert.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Supply vs Demand Forecast */}
          <div className="rounded-lg p-6 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              24-Hour Supply vs. Demand Forecast
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Area type="monotone" dataKey="sessions" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.3} name="Predicted Sessions" />
                <Area type="monotone" dataKey="tutors" stroke="var(--success)" fill="var(--success)" fillOpacity={0.3} name="Available Tutors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Supply-Demand Ratio */}
          <div className="rounded-lg p-6 border card-hover drop-in-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Supply-Demand Ratio Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="ratio" stroke="var(--accent)" strokeWidth={2} name="Demand/Supply Ratio" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--background)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--success)' }}>● &lt; 0.9</span> = Excess capacity •
                <span style={{ color: 'var(--info)' }}> ● 0.9-1.2</span> = Balanced •
                <span style={{ color: 'var(--warning)' }}> ● 1.2-1.5</span> = High demand •
                <span style={{ color: 'var(--error)' }}> ● &gt; 1.5</span> = Critical
              </p>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="rounded-lg p-6 border card-hover drop-in-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Imbalance Risk Distribution (Next 24 Hours)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)' }}>
              <p className="font-semibold" style={{ color: 'var(--error)' }}>Critical Risk</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{predictionData.summary.criticalRiskHours}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: '4px solid var(--warning)' }}>
              <p className="font-semibold" style={{ color: 'var(--warning)' }}>High Risk</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{predictionData.summary.highRiskHours}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--info)' }}>
              <p className="font-semibold" style={{ color: 'var(--info)' }}>Medium Risk</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{predictionData.summary.mediumRiskHours}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)' }}>
              <p className="font-semibold" style={{ color: 'var(--success)' }}>Low Risk</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{predictionData.summary.lowRiskHours}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
