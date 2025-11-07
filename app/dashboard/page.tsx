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
import { useSSE } from '@/lib/hooks/useSSE';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface MarketplaceHealth {
  activeSessions: number;
  dailySessionVolume: number;
  averageRating: number;
  tutorUtilizationRate: number;
  customerSatisfactionScore: number;
  supplyDemandBalance: number;
  timestamp: string;
}

const COLORS = ['#14b8a6', '#5eead4']; // Teal shades for better contrast

export default function MarketplaceDashboard() {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Use SSE for real-time updates
  const { data: healthData, isConnected, error: sseError } = useSSE<MarketplaceHealth>(
    '/api/sse/marketplace?interval=5000',
    {
      enabled: true,
      onOpen: () => console.log('SSE connected to marketplace'),
      onError: (err) => console.error('SSE error:', err),
    }
  );

  // Update timestamp when new data arrives
  useEffect(() => {
    if (healthData) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [healthData]);

  // Handle CSV export
  const handleExportCustomers = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/customers/export');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export customer data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!healthData) {
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

  const metricCards = [
    {
      title: 'Active Sessions',
      value: healthData.activeSessions,
      color: '#14b8a6' // Teal
    },
    {
      title: 'Daily Session Volume',
      value: healthData.dailySessionVolume,
      color: '#14b8a6' // Teal
    },
    {
      title: 'Average Rating',
      value: healthData.averageRating.toFixed(2),
      color: '#14b8a6' // Teal
    },
    {
      title: 'Tutor Utilization',
      value: `${healthData.tutorUtilizationRate.toFixed(1)}%`,
      color: '#14b8a6' // Teal
    },
    {
      title: 'Customer Satisfaction',
      value: healthData.customerSatisfactionScore.toFixed(2),
      color: '#14b8a6' // Teal
    },
    {
      title: 'Supply/Demand Balance',
      value: `${healthData.supplyDemandBalance.toFixed(1)}%`,
      color: '#14b8a6' // Teal
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 drop-in-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                Marketplace Health Dashboard
              </h1>
              <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                Real-time monitoring • Last updated: {lastUpdate}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
              <button
                onClick={handleExportCustomers}
                disabled={isExporting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#14b8a6',
                  color: '#ffffff',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => !isExporting && (e.currentTarget.style.backgroundColor = '#5eead4')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14b8a6'}
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
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
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {metricCards.map((metric, index) => {
            const animationClass = ['drop-in-1', 'drop-in-2', 'drop-in-3', 'drop-in-4', 'drop-in-5', 'drop-in-6'][index];
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
          {/* Session Distribution Pie Chart */}
          <div className="rounded-lg p-4 md:p-6 border card-hover drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Session Distribution
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={800}
                  animationEasing="ease-in-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    color: '#ffffff'
                  }}
                  itemStyle={{
                    color: '#ffffff'
                  }}
                  labelStyle={{
                    color: '#ffffff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Static Legend */}
            <div className="flex flex-col gap-3 mt-4">
              {pieData.map((entry, index) => {
                const total = pieData.reduce((sum, item) => sum + item.value, 0);
                const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: COLORS[index % COLORS.length] }}>
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics Overview Bar Chart */}
          <div className="rounded-lg p-4 md:p-6 border card-hover drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
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
        <div className="rounded-lg p-4 md:p-6 border card-hover drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
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
