'use client';

import { useEffect, useState } from 'react';

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
  const [data, setData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const url = `/api/alerts${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch alerts');

      const result = await response.json();
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [statusFilter, severityFilter, typeFilter]);

  const handleAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      setProcessingAction(alertId);
      setActionFeedback(null);

      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action,
          userId: 'current-user', // TODO: Get from auth session
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update alert');
      }

      setActionFeedback({
        message: `Alert ${action}d successfully`,
        type: 'success',
      });

      // Refresh alerts
      await fetchAlerts();

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
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return 'var(--text-secondary)';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'acknowledged':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'resolved':
        return { backgroundColor: '#D1FAE5', color: '#065F46' };
      case 'dismissed':
        return { backgroundColor: '#F3F4F6', color: '#374151' };
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl loading">Loading alert history...</div>
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

  if (!data) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 drop-in-1">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Alert History & Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitor and manage system alerts • Last updated: {lastUpdate}
          </p>
        </div>

        {/* Action Feedback */}
        {actionFeedback && (
          <div
            className="mb-6 p-4 rounded-lg drop-in-1"
            style={{
              backgroundColor: actionFeedback.type === 'success' ? '#D1FAE5' : '#FEE2E2',
              color: actionFeedback.type === 'success' ? '#065F46' : '#991B1B',
            }}
          >
            {actionFeedback.message}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg p-4 border drop-in-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#EF4444' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Active Alerts</h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{data.statistics.active}</p>
          </div>
          <div className="rounded-lg p-4 border drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#3B82F6' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Acknowledged</h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{data.statistics.acknowledged}</p>
          </div>
          <div className="rounded-lg p-4 border drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: '#10B981' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Resolved</h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{data.statistics.resolved}</p>
          </div>
          <div className="rounded-lg p-4 border drop-in-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderLeftWidth: '4px', borderLeftColor: 'var(--accent)' }}>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Alerts</h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{data.statistics.total}</p>
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
          {data.alerts.length === 0 ? (
            <div className="text-center py-12 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                No alerts found matching the selected filters
              </p>
            </div>
          ) : (
            data.alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={`rounded-lg border card-hover drop-in-${Math.min(index + 3, 6)}`}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderLeftWidth: '4px',
                  borderLeftColor: getSeverityColor(alert.severity),
                }}
              >
                <div className="p-6">
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
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
      </div>
    </div>
  );
}
