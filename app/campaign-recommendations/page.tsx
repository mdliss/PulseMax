'use client';

import { useEffect, useState } from 'react';
import { useSSE } from '@/lib/hooks/useSSE';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface CampaignRecommendation {
  id: string;
  type: 'budget_increase' | 'budget_decrease' | 'priority_shift' | 'tutor_recruitment' | 'demand_incentive' | 'schedule_optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  targetTimeframe: {
    start: string;
    end: string;
  };
  metrics: {
    currentSupplyDemandRatio: number;
    targetSupplyDemandRatio: number;
    estimatedImpact: string;
  };
  actions: string[];
  priority: number;
}

interface RecommendationSummary {
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    budget_increase: number;
    budget_decrease: number;
    priority_shift: number;
    tutor_recruitment: number;
    demand_incentive: number;
    schedule_optimization: number;
  };
  highestPriority: CampaignRecommendation | null;
}

interface RecommendationData {
  recommendations: CampaignRecommendation[];
  summary: RecommendationSummary;
  metadata: {
    generatedAt: string;
    analysisWindow: {
      hours: number;
      start: string;
      end: string;
    };
    dataPoints: number;
  };
  insights: string[];
}

export default function CampaignRecommendationsPage() {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Use SSE for real-time updates
  const { data, isConnected, error: sseError } = useSSE<RecommendationData>(
    '/api/sse/campaign-recommendations?interval=5000',
    {
      enabled: true,
      onOpen: () => console.log('[Client] SSE connected to campaign recommendations'),
      onError: (err) => console.error('[Client] SSE error:', err),
    }
  );

  // Update timestamp when new data arrives
  useEffect(() => {
    if (data) {
      console.log('[Client] Received campaign SSE data update');
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [data]);

  if (!data) {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#0d9488'; // Dark teal
      case 'high': return '#14b8a6';     // Main teal
      case 'medium': return '#2dd4bf';   // Medium teal
      case 'low': return '#5eead4';      // Light teal
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 drop-in-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                Campaign Recommendations
              </h1>
              <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                Real-time AI optimization • Last updated: {lastUpdate}
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
              Critical
            </h3>
            <AnimatedCounter
              value={data.summary.bySeverity.critical}
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
              High
            </h3>
            <AnimatedCounter
              value={data.summary.bySeverity.high}
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
              Medium
            </h3>
            <AnimatedCounter
              value={data.summary.bySeverity.medium}
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
              Total
            </h3>
            <AnimatedCounter
              value={data.summary.total}
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Analysis Info */}
        <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Analysis Window
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Hours Analyzed</p>
              <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--foreground)' }}>{data.metadata.analysisWindow.hours}h</p>
            </div>
            <div>
              <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Data Points</p>
              <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--foreground)' }}>{data.metadata.dataPoints}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Last Generated</p>
              <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                {new Date(data.metadata.generatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        {data.insights.length > 0 && (
          <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Key Insights
            </h2>
            <div className="space-y-2">
              {data.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2" style={{ minHeight: '28px' }}>
                  <span style={{ color: '#14b8a6', flexShrink: 0 }}>•</span>
                  <p className="text-sm md:text-base" style={{ color: 'var(--foreground)', lineHeight: '1.5' }}>{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="rounded-lg p-4 md:p-6 border mb-6 md:mb-8 drop-in-5" style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)'
        }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Campaign Recommendations {data.recommendations.length > 0 && `(${data.recommendations.length})`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', borderLeft: '4px solid #0d9488' }}>
              <p className="font-semibold" style={{ color: '#0d9488' }}>Critical</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{data.summary.bySeverity.critical}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', borderLeft: '4px solid #14b8a6' }}>
              <p className="font-semibold" style={{ color: '#14b8a6' }}>High</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{data.summary.bySeverity.high}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)', borderLeft: '4px solid #2dd4bf' }}>
              <p className="font-semibold" style={{ color: '#2dd4bf' }}>Medium</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{data.summary.bySeverity.medium}</p>
            </div>
            <div className="text-center p-4 rounded" style={{ backgroundColor: 'rgba(94, 234, 212, 0.1)', borderLeft: '4px solid #5eead4' }}>
              <p className="font-semibold" style={{ color: '#5eead4' }}>Low</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{data.summary.bySeverity.low}</p>
            </div>
          </div>

          <div style={{ height: '500px', overflowY: 'auto' }}>
            {data.recommendations.length > 0 ? (
              <div className="space-y-3">
                {data.recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded"
                    style={{
                      backgroundColor: getSeverityColor(rec.severity),
                      color: 'white',
                      animation: `slideDown 0.4s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {rec.severity}:
                          </span>
                          <span className="font-medium">{rec.title}</span>
                          <span className="text-xs opacity-75 ml-2">Priority: {rec.priority}/10</span>
                        </div>
                        <p className="text-sm opacity-90 mb-2">{rec.description}</p>
                        <div className="text-sm opacity-90">
                          Impact: {rec.metrics.estimatedImpact} | Ratio: {rec.metrics.currentSupplyDemandRatio} → {rec.metrics.targetSupplyDemandRatio}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full transition-opacity duration-300">
                <p className="text-lg font-medium" style={{ color: 'var(--success)' }}>
                  No recommendations at this time
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Supply and demand are balanced
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
      </div>
    </div>
  );
}
