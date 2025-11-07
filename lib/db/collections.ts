/**
 * Firestore Collection Names and Types
 */

// Collection names
export const COLLECTIONS = {
  SESSIONS: 'sessions',
  CUSTOMERS: 'customers',
  TUTORS: 'tutors',
  INBOUND_CALLS: 'inbound_calls',
  CUSTOMER_HEALTH: 'customer_health_scores',
  TUTOR_PERFORMANCE: 'tutor_performance',
  SUPPLY_DEMAND: 'supply_demand_forecasts',
  ALERTS: 'alerts',
  RECOMMENDATIONS: 'recommendations',
  BOOKINGS: 'bookings',
  METRICS_CACHE: 'metrics_cache',
} as const;

// TypeScript interfaces for Firestore documents
export interface SessionDocument {
  sessionId: string;
  customerId: string;
  tutorId: string;
  subject: string;
  startTime: Date;
  endTime?: Date;
  rating?: number; // 1-5
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDocument {
  customerId: string;
  name?: string;
  email?: string;
  signupDate: Date;
  acquisitionChannel?: string;
  goals: string[];
  status: 'active' | 'inactive' | 'churned';
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorDocument {
  tutorId: string;
  name?: string;
  email?: string;
  subjects: string[];
  status: 'active' | 'inactive';
  ratingAvg?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InboundCallDocument {
  customerId: string;
  callDate: Date;
  duration?: number;
  reasonCode?: string;
  createdAt: Date;
}

export interface CustomerHealthDocument {
  customerId: string;
  riskScore: number; // 0-100
  riskTier: 'critical' | 'at-risk' | 'healthy' | 'thriving';
  firstSessionScore?: number;
  sessionVelocityScore?: number;
  ibCallScore?: number;
  goalCompletionScore?: number;
  tutorConsistencyScore?: number;
  hasMultipleIbCalls: boolean;
  hasLowFirstSession: boolean;
  hasLowVelocity: boolean;
  hasCompletedGoal: boolean;
  suggestedIntervention?: string;
  priority?: 'high' | 'medium' | 'low';
  calculatedAt: Date;
  createdAt: Date;
}

export interface TutorPerformanceDocument {
  tutorId: string;
  firstSessionCount: number;
  firstSessionSuccessCount: number;
  firstSessionSuccessRate: number;
  totalSessions: number;
  averageRating: number;
  totalHours: number;
  successRateTrend: number;
  ratingTrend: number;
  needsCoaching: boolean;
  isUnderperforming: boolean;
  calculatedAt: Date;
  createdAt: Date;
}

export interface SupplyDemandDocument {
  subject: string;
  forecastHour: Date;
  predictedSessions: number;
  confidenceLower: number;
  confidenceUpper: number;
  availableTutors: number;
  availableHours: number;
  supplyDemandRatio: number;
  hasShortage: boolean;
  hasSurplus: boolean;
  modelVersion?: string;
  generatedAt: Date;
  createdAt: Date;
}

export interface AlertDocument {
  alertType: 'customer-risk' | 'tutor-performance' | 'supply-demand' | 'anomaly';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  suggestedAction?: string;
  customerId?: string;
  tutorId?: string;
  subject?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationDocument {
  recommendationType: 'recruiting-budget' | 'campaign-priority' | 'capacity-adjustment';
  action: string;
  reasoning: string;
  expectedImpact?: string;
  priority: number; // 1-5
  subject?: string;
  estimatedRoi?: number;
  confidenceScore?: number;
  status: 'pending' | 'accepted' | 'dismissed';
  reviewedAt?: Date;
  reviewedBy?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricsCacheDocument {
  key: string;
  data: any;
  ttl: Date;
  createdAt: Date;
}
