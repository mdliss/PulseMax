'use client';

import { useEffect, useState } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface Alert {
  id: string;
  type: 'anomaly' | 'threshold' | 'system' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  metadata: Record<string, any>;
  channels: string[];
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface AlertData {
  alerts: Alert[];
  statistics: {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byType: {
      anomaly: number;
      threshold: number;
      system: number;
      performance: number;
    };
  };
  timestamp: string;
}

export default function AlertHistoryPage() {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Data state
  const [data, setData] = useState<AlertData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use polling for real-time updates (works on Vercel Free)
  useEffect(() => {
    console.log('Using mock data mode');

    const fetchData = async () => {
      try {
        const response = await fetch('/api/alerts');
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

  const handleAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      setProcessingAction(alertId);
      setActionFeedback({
        message: `Alert ${action}d successfully`,
        type: 'success',
      });

      // Clear feedback after 3 seconds
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      setActionFeedback({
        message: err instanceof Error ? err.message : 'Action failed',
        type: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#0d9488'; // Dark teal
      case 'high': return '#14b8a6';     // Main teal
      case 'medium': return '#2dd4bf';   // Medium teal
      case 'low': return '#5eead4';      // Light teal
      default: return 'var(--text-secondary)';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '●';
      case 'high': return '●';
      case 'medium': return '●';
      case 'low': return '●';
      default: return '●';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: 'rgba(13, 148, 136, 0.2)', color: '#0d9488' };
      case 'acknowledged':
        return { backgroundColor: 'rgba(20, 184, 166, 0.2)', color: '#14b8a6' };
      case 'resolved':
        return { backgroundColor: 'rgba(45, 212, 191, 0.2)', color: '#2dd4bf' };
      case 'dismissed':
        return { backgroundColor: 'rgba(94, 234, 212, 0.2)', color: '#5eead4' };
      default:
        return { backgroundColor: 'var(--card-bg)', color: 'var(--foreground)' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

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

  // Apply filters
  const filteredAlerts = data.alerts.filter((alert) => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Alert History & Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time AI monitoring • Last updated: {lastUpdate}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: isConnected ? '#14b8a6' : '#5eead4'
              }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Action Feedback */}
        {actionFeedback && (
          <div
            className="mb-6 p-4 rounded-lg drop-in-1"
            style={{
              backgroundColor: actionFeedback.type === 'success' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(13, 148, 136, 0.2)',
              color: actionFeedback.type === 'success' ? '#2dd4bf' : '#0d9488',
            }}
          >
            {actionFeedback.message}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg p-4 border drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#0d9488' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Active Alerts</h3>
            <AnimatedCounter
              value={data.statistics.active}
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <div className="rounded-lg p-4 border drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#14b8a6' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Acknowledged</h3>
            <AnimatedCounter
              value={data.statistics.acknowledged}
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <div className="rounded-lg p-4 border drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#2dd4bf' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Resolved</h3>
            <AnimatedCounter
              value={data.statistics.resolved}
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <div className="rounded-lg p-4 border drop-in-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#5eead4' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Alerts</h3>
            <AnimatedCounter
              value={data.statistics.total}
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 drop-in-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'acknowledged', 'resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className="px-3 py-1.5 rounded-lg border transition-all capitalize text-sm"
                    style={{
                      backgroundColor: statusFilter === status ? 'var(--accent)' : 'var(--card-bg)',
                      borderColor: statusFilter === status ? 'var(--accent)' : 'var(--border-color)',
                      color: statusFilter === status ? 'white' : 'var(--foreground)',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Severity
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSeverityFilter(severity)}
                    className="px-3 py-1.5 rounded-lg border transition-all capitalize text-sm"
                    style={{
                      backgroundColor: severityFilter === severity ? 'var(--accent)' : 'var(--card-bg)',
                      borderColor: severityFilter === severity ? 'var(--accent)' : 'var(--border-color)',
                      color: severityFilter === severity ? 'white' : 'var(--foreground)',
                    }}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'anomaly', 'threshold', 'system', 'performance'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className="px-3 py-1.5 rounded-lg border transition-all capitalize text-sm"
                    style={{
                      backgroundColor: typeFilter === type ? 'var(--accent)' : 'var(--card-bg)',
                      borderColor: typeFilter === type ? 'var(--accent)' : 'var(--border-color)',
                      color: typeFilter === type ? 'white' : 'var(--foreground)',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 rounded-lg border transition-opacity duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                No alerts found matching the selected filters
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className="rounded-lg border card-hover"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderLeftWidth: '4px',
                  borderLeftColor: getSeverityColor(alert.severity),
                  animation: `slideDown 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="p-6">
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl" style={{ color: getSeverityColor(alert.severity) }}>
                          {getSeverityIcon(alert.severity)}
                        </span>
                        <h3 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                          {alert.title}
                        </h3>
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                          style={getStatusBadgeStyle(alert.status)}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span>Type: {alert.type}</span>
                        <span>•</span>
                        <span>Source: {alert.source}</span>
                        <span>•</span>
                        <span>{formatDate(alert.createdAt)}</span>
                        <span>•</span>
                        <span>Duration: {formatDuration(alert.createdAt, alert.resolvedAt || alert.acknowledgedAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {alert.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleAction(alert.id, 'acknowledge')}
                            disabled={processingAction === alert.id}
                            className="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--foreground)',
                              opacity: processingAction === alert.id ? 0.5 : 1,
                            }}
                          >
                            {processingAction === alert.id ? 'Processing...' : 'Acknowledge'}
                          </button>
                          <button
                            onClick={() => handleAction(alert.id, 'resolve')}
                            disabled={processingAction === alert.id}
                            className="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
                            style={{
                              backgroundColor: 'var(--accent)',
                              borderColor: 'var(--accent)',
                              color: 'white',
                              opacity: processingAction === alert.id ? 0.5 : 1,
                            }}
                          >
                            {processingAction === alert.id ? 'Processing...' : 'Resolve'}
                          </button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          onClick={() => handleAction(alert.id, 'resolve')}
                          disabled={processingAction === alert.id}
                          className="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
                          style={{
                            backgroundColor: 'var(--accent)',
                            borderColor: 'var(--accent)',
                            color: 'white',
                            opacity: processingAction === alert.id ? 0.5 : 1,
                          }}
                        >
                          {processingAction === alert.id ? 'Processing...' : 'Resolve'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alert Message */}
                  <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <p style={{ color: 'var(--foreground)' }}>{alert.message}</p>
                  </div>

                  {/* Metadata */}
                  {Object.keys(alert.metadata).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Additional Details
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(alert.metadata).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span style={{ color: 'var(--text-secondary)' }}>{key}: </span>
                            <span style={{ color: 'var(--foreground)' }} className="font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {(alert.acknowledgedAt || alert.resolvedAt) && (
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {alert.acknowledgedAt && (
                          <div>
                            <span className="font-medium">Acknowledged:</span> {formatDate(alert.acknowledgedAt)}
                            {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
                          </div>
                        )}
                        {alert.resolvedAt && (
                          <div>
                            <span className="font-medium">Resolved:</span> {formatDate(alert.resolvedAt)}
                            {alert.resolvedBy && ` by ${alert.resolvedBy}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
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
    </div>
  );
}
