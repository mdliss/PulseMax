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
import { AnimatedCounter } from '@/components/AnimatedCounter';

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

interface CombinedSSEData {
  successData: SuccessData;
  anomalyData: AnomalyData;
}

export default function SuccessTrackingPage() {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [combinedData, setCombinedData] = useState<CombinedSSEData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use polling for real-time updates (works on Vercel Free)
  useEffect(() => {
    console.log('Using mock data mode');

    const fetchData = async () => {
      try {
        const response = await fetch('/api/success-tracking');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        setCombinedData(data);
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

  if (!combinedData) {
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

  const successData = combinedData.successData;
  const anomalyData = combinedData.anomalyData;

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

  const metricCards = [
    {
      title: 'Success Rate',
      value: successData.overallSuccessRate.toFixed(1) + '%',
      color: '#14b8a6' // Teal
    },
    {
      title: 'Total First Sessions',
      value: successData.totalFirstSessions,
      color: '#14b8a6' // Teal
    },
    {
      title: 'Successful Sessions',
      value: successData.totalSuccessful,
      color: '#14b8a6' // Teal
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 drop-in-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--success)' }}>
                First Session Success Tracking
              </h1>
              <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                Real-time monitoring • Last updated: {lastUpdate}
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

        {/* Anomaly Alerts - Always reserve space to prevent layout shift */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-3" style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          minHeight: anomalyData.totalAnomalies > 0 ? 'auto' : '200px'
        }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Anomaly Alerts {anomalyData.totalAnomalies > 0 && `(${anomalyData.totalAnomalies})`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', borderLeft: '4px solid #0d9488' }}>
              <p className="font-semibold" style={{ color: '#0d9488' }}>Critical</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{anomalyData.criticalCount}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', borderLeft: '4px solid #14b8a6' }}>
              <p className="font-semibold" style={{ color: '#14b8a6' }}>High</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{anomalyData.highCount}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)', borderLeft: '4px solid #2dd4bf' }}>
              <p className="font-semibold" style={{ color: '#2dd4bf' }}>Medium</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{anomalyData.mediumCount}</p>
            </div>
          </div>

          <div style={{ height: '300px', overflowY: 'auto' }}>
            {anomalyData.totalAnomalies > 0 ? (
              <div className="space-y-3">
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-lg font-medium" style={{ color: 'var(--success)' }}>
                  All Systems Normal
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  No anomalies detected in first session success rates
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Success Rates by Tutor and Subject */}
        <div className="rounded-lg p-6 mb-8 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Success Rates by Tutor and Subject
          </h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={(() => {
                const tutorData = successData.byTutorAndSubject.slice(0, 15);
                // Pad to always have 15 entries for consistent sizing
                while (tutorData.length < 15) {
                  tutorData.push({
                    tutorId: `empty-${tutorData.length}`,
                    tutorName: '',
                    subject: '',
                    totalSessions: 0,
                    successfulSessions: 0,
                    successRate: 0
                  });
                }
                return tutorData;
              })()}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="tutorName"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="var(--text-secondary)"
              />
              <YAxis
                label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                stroke="var(--text-secondary)"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
              <Bar
                dataKey="successRate"
                fill="var(--accent)"
                name="Success Rate %"
                animationDuration={800}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 overflow-x-auto overflow-y-auto" style={{ maxHeight: '400px' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
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
              <YAxis
                stroke="var(--text-secondary)"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="var(--success)"
                name="Success Rate %"
                strokeWidth={2}
                dot={{ fill: 'var(--success)', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={800}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {successData.byCustomerSegment.map((segment, index) => (
              <div
                key={segment.segment}
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-color)',
                  transition: 'all 0.8s ease-in-out'
                }}
              >
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--foreground)' }}>{segment.segment}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Sessions: <AnimatedCounter value={segment.totalSessions} className="inline" />
                </p>
                <AnimatedCounter
                  value={segment.successRate.toFixed(1) + '%'}
                  className="text-2xl font-bold"
                  style={{ color: 'var(--success)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
