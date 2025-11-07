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
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MarketplaceHealth {
  activeSessions: number;
  dailySessionVolume: number;
  averageRating: number;
  tutorUtilizationRate: number;
  customerSatisfactionScore: number;
  supplyDemandBalance: number;
  timestamp: string;
}

const COLORS = ['#d4a574', '#10B981', '#3B82F6', '#F59E0B'];

export default function MarketplaceDashboard() {
  const [healthData, setHealthData] = useState<MarketplaceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/marketplace/health');
      if (!response.ok) throw new Error('Failed to fetch health data');
      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl loading">Loading marketplace health data...</div>
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

  if (!healthData) return null;

  const metricCards = [
    {
      title: 'Active Sessions',
      value: healthData.activeSessions,
      color: 'var(--accent)'
    },
    {
      title: 'Daily Session Volume',
      value: healthData.dailySessionVolume,
      color: 'var(--success)'
    },
    {
      title: 'Average Rating',
      value: healthData.averageRating.toFixed(2),
      color: 'var(--warning)'
    },
    {
      title: 'Tutor Utilization',
      value: `${healthData.tutorUtilizationRate.toFixed(1)}%`,
      color: 'var(--info)'
    },
    {
      title: 'Customer Satisfaction',
      value: healthData.customerSatisfactionScore.toFixed(2),
      color: 'var(--success)'
    },
    {
      title: 'Supply/Demand Balance',
      value: `${healthData.supplyDemandBalance.toFixed(1)}%`,
      color: 'var(--info)'
    }
  ];

  const pieData = [
    { name: 'Active Sessions', value: healthData.activeSessions },
    { name: 'Completed Today', value: Math.max(0, healthData.dailySessionVolume - healthData.activeSessions) }
  ];

  const barData = [
    { name: 'Rating', value: healthData.averageRating },
    { name: 'Satisfaction', value: healthData.customerSatisfactionScore },
    { name: 'Utilization', value: healthData.tutorUtilizationRate / 20 },
    { name: 'Balance', value: healthData.supplyDemandBalance / 20 }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Marketplace Health Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time monitoring • Last updated: {lastUpdate}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metricCards.map((metric, index) => {
            const animationClass = ['drop-in-1', 'drop-in-2', 'drop-in-3', 'drop-in-4', 'drop-in-5', 'drop-in-6'][index];
            return (
              <div
                key={index}
                className={`rounded-lg p-6 border card-hover ${animationClass}`}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderLeftWidth: '4px',
                  borderLeftColor: metric.color
                }}
              >
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {metric.title}
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Session Distribution Pie Chart */}
          <div className="rounded-lg p-6 border card-hover drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Session Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) =>
                    `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Overview Bar Chart */}
          <div className="rounded-lg p-6 border card-hover drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Metrics Overview
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Bar dataKey="value" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Status Indicator */}
        <div className="rounded-lg p-6 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Overall Health Status
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border-color)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    background: 'linear-gradient(90deg, var(--success) 0%, var(--accent) 50%, var(--info) 100%)',
                    width: `${Math.min(
                      100,
                      (healthData.customerSatisfactionScore +
                        healthData.supplyDemandBalance) /
                        2
                    )}%`
                  }}
                />
              </div>
            </div>
            <div className="ml-4 text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {Math.round(
                (healthData.customerSatisfactionScore +
                  healthData.supplyDemandBalance) /
                  2
              )}
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
