'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface SuccessRate {
  tutorId: string;
  tutorName: string;
  subject: string;
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
}

interface CustomerSegmentRate {
  segment: string;
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
}

interface Anomaly {
  type: string;
  severity: string;
  tutorName?: string;
  subject?: string;
  segment?: string;
  currentValue: number;
  baselineValue: number;
  message: string;
  detectedAt: string;
}

interface SuccessData {
  overallSuccessRate: number;
  totalFirstSessions: number;
  totalSuccessful: number;
  byTutorAndSubject: SuccessRate[];
  byCustomerSegment: CustomerSegmentRate[];
  timestamp: string;
}

interface AnomalyData {
  anomalies: Anomaly[];
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  timestamp: string;
}

export default function SuccessTrackingPage() {
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    try {
      const [successResponse, anomalyResponse] = await Promise.all([
        fetch('/api/success-tracking'),
        fetch('/api/anomaly-detection')
      ]);

      if (!successResponse.ok || !anomalyResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const success = await successResponse.json();
      const anomalies = await anomalyResponse.json();

      setSuccessData(success);
      setAnomalyData(anomalies);
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
        <div className="text-xl state-loading">Loading success tracking data...</div>
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

  if (!successData || !anomalyData) return null;

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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--success)' }}>
            First Session Success Tracking
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time monitoring • Last updated: {lastUpdate}
          </p>
        </div>

        {/* Overall Success Rate */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Overall Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>Success Rate</p>
              <p className="text-4xl font-bold" style={{ color: 'var(--success)' }}>
                {successData.overallSuccessRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>Total First Sessions</p>
              <p className="text-4xl font-bold" style={{ color: 'var(--info)' }}>
                {successData.totalFirstSessions}
              </p>
            </div>
            <div className="text-center">
              <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>Successful Sessions</p>
              <p className="text-4xl font-bold" style={{ color: 'var(--accent)' }}>
                {successData.totalSuccessful}
              </p>
            </div>
          </div>
        </div>

        {/* Anomaly Alerts */}
        {anomalyData.totalAnomalies > 0 && (
          <div className="rounded-lg p-6 mb-8 border card-hover drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Anomaly Alerts ({anomalyData.totalAnomalies})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)' }}>
                <p className="font-semibold" style={{ color: 'var(--error)' }}>Critical</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{anomalyData.criticalCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: '4px solid var(--warning)' }}>
                <p className="font-semibold" style={{ color: 'var(--warning)' }}>High</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{anomalyData.highCount}</p>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--info)' }}>
                <p className="font-semibold" style={{ color: 'var(--info)' }}>Medium</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{anomalyData.mediumCount}</p>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {anomalyData.anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg"
                  style={getSeverityColor(anomaly.severity)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">{anomaly.message}</p>
                      <p className="text-sm opacity-90">
                        Current: {anomaly.currentValue.toFixed(1)}% |
                        Baseline: {anomaly.baselineValue.toFixed(1)}%
                      </p>
                    </div>
                    <span className="text-xs opacity-75 ml-4">
                      {new Date(anomaly.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Rates by Tutor and Subject */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Success Rates by Tutor and Subject
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={successData.byTutorAndSubject.slice(0, 10)}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="tutorName"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="var(--text-secondary)"
              />
              <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
              <Bar dataKey="successRate" fill="var(--accent)" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'rgba(212, 165, 116, 0.1)' }}>
                <tr>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-secondary)' }}>Tutor</th>
                  <th className="px-4 py-2 text-left" style={{ color: 'var(--text-secondary)' }}>Subject</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Total Sessions</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Successful</th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--text-secondary)' }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {successData.byTutorAndSubject.map((rate, index) => (
                  <tr key={index} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>{rate.tutorName}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>{rate.subject}</td>
                    <td className="px-4 py-2 text-center" style={{ color: 'var(--foreground)' }}>{rate.totalSessions}</td>
                    <td className="px-4 py-2 text-center" style={{ color: 'var(--foreground)' }}>{rate.successfulSessions}</td>
                    <td className="px-4 py-2 text-center font-semibold" style={{ color: 'var(--accent)' }}>
                      {rate.successRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Rates by Customer Segment */}
        <div className="rounded-lg p-6 border card-hover drop-in-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Success Rates by Customer Segment
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={successData.byCustomerSegment}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="segment" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="var(--success)"
                name="Success Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {successData.byCustomerSegment.map((segment, index) => (
              <div key={index} className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--foreground)' }}>{segment.segment}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Sessions: {segment.totalSessions}
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                  {segment.successRate.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
