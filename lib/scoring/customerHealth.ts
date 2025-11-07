/**
 * Customer Health Scoring Engine
 */

import { db } from '@/lib/db/firebase';
import { COLLECTIONS, SessionDocument, InboundCallDocument, CustomerDocument } from '@/lib/db/collections';

// Scoring weights (must sum to 100)
const WEIGHTS = {
  FIRST_SESSION: 30,
  SESSION_VELOCITY: 25,
  IB_CALL_FREQUENCY: 20,
  GOAL_COMPLETION: 15,
  TUTOR_CONSISTENCY: 10,
} as const;

export interface CustomerHealthMetrics {
  customerId: string;
  firstSessionScore: number;
  sessionVelocityScore: number;
  ibCallScore: number;
  goalCompletionScore: number;
  tutorConsistencyScore: number;
  totalRiskScore: number;
  riskTier: 'critical' | 'at-risk' | 'healthy' | 'thriving';
  hasMultipleIbCalls: boolean;
  hasLowFirstSession: boolean;
  hasLowVelocity: boolean;
  hasCompletedGoal: boolean;
  suggestedIntervention?: string;
  priority: 'high' | 'medium' | 'low';
}

export class CustomerHealthScorer {
  /**
   * Calculate first session success rate score (0-100)
   * Higher score = better first session experience
   */
  async calculateFirstSessionScore(customerId: string): Promise<number> {
    try {
      // Get customer's first session
      const snapshot = await db.collection(COLLECTIONS.SESSIONS)
        .where('customerId', '==', customerId)
        .orderBy('startTime', 'asc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return 50; // Neutral score if no sessions
      }

      const firstSession = snapshot.docs[0].data() as SessionDocument;

      // No rating yet
      if (!firstSession.rating) {
        return 50; // Neutral score
      }

      // Rating-based score (1-5 stars → 0-100 score)
      const ratingScore = ((firstSession.rating - 1) / 4) * 100;

      // Completed sessions get bonus
      const completionBonus = firstSession.status === 'completed' ? 10 : 0;

      return Math.min(100, ratingScore + completionBonus);
    } catch (error) {
      console.error('Error calculating first session score:', error);
      return 50; // Default neutral score on error
    }
  }

  /**
   * Calculate session velocity score (0-100)
   * Higher score = more active customer
   */
  async calculateSessionVelocityScore(customerId: string): Promise<number> {
    try {
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Get sessions in last 14 days
      const snapshot = await db.collection(COLLECTIONS.SESSIONS)
        .where('customerId', '==', customerId)
        .where('startTime', '>=', twoWeeksAgo)
        .where('status', 'in', ['completed', 'scheduled'])
        .get();

      const sessionCount = snapshot.size;

      // Calculate sessions per week
      const sessionsPerWeek = sessionCount / 2;

      // Score based on velocity benchmarks
      // 0 sessions/week = 0 score
      // 1 session/week = 40 score
      // 2 sessions/week = 70 score
      // 3+ sessions/week = 100 score
      let score = 0;

      if (sessionsPerWeek >= 3) {
        score = 100;
      } else if (sessionsPerWeek >= 2) {
        score = 70 + ((sessionsPerWeek - 2) / 1) * 30;
      } else if (sessionsPerWeek >= 1) {
        score = 40 + ((sessionsPerWeek - 1) / 1) * 30;
      } else if (sessionsPerWeek > 0) {
        score = sessionsPerWeek * 40;
      }

      return Math.round(Math.min(100, score));
    } catch (error) {
      console.error('Error calculating session velocity score:', error);
      return 50;
    }
  }

  /**
   * Calculate IB call frequency score (0-100)
   * Higher score = fewer support calls (better)
   */
  async calculateIbCallScore(customerId: string): Promise<number> {
    try {
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Get IB calls in last 14 days
      const snapshot = await db.collection(COLLECTIONS.INBOUND_CALLS)
        .where('customerId', '==', customerId)
        .where('callDate', '>=', twoWeeksAgo)
        .get();

      const callCount = snapshot.size;

      // Score based on call frequency (inverse relationship)
      // 0 calls = 100 score (best)
      // 1 call = 80 score
      // 2+ calls = 0 score (critical)
      let score = 100;

      if (callCount >= 2) {
        score = 0; // Critical - multiple calls
      } else if (callCount === 1) {
        score = 80; // At-risk
      }

      return score;
    } catch (error) {
      console.error('Error calculating IB call score:', error);
      return 50;
    }
  }

  /**
   * Calculate goal completion score (0-100)
   * Based on customer goals and progress
   */
  async calculateGoalCompletionScore(customerId: string): Promise<number> {
    try {
      // Get customer data
      const customerDoc = await db.collection(COLLECTIONS.CUSTOMERS)
        .where('customerId', '==', customerId)
        .limit(1)
        .get();

      if (customerDoc.empty) {
        return 50; // Neutral if customer not found
      }

      const customer = customerDoc.docs[0].data() as CustomerDocument;

      // If no goals set, neutral score
      if (!customer.goals || customer.goals.length === 0) {
        return 50;
      }

      // Check if customer has completed goals (in MVP, we'll use a simple heuristic)
      // In production, this would track actual goal completion
      const hasGoals = customer.goals.length > 0;
      const isActive = customer.status === 'active';

      // Simple scoring: active with goals = 70, completed goals = 100
      if (isActive && hasGoals) {
        return 70; // Working towards goals
      }

      return 50; // Neutral
    } catch (error) {
      console.error('Error calculating goal completion score:', error);
      return 50;
    }
  }

  /**
   * Calculate tutor consistency score (0-100)
   * Higher score = more consistent tutor interactions
   */
  async calculateTutorConsistencyScore(customerId: string): Promise<number> {
    try {
      // Get all completed sessions for this customer
      const snapshot = await db.collection(COLLECTIONS.SESSIONS)
        .where('customerId', '==', customerId)
        .where('status', '==', 'completed')
        .get();

      if (snapshot.size === 0) {
        return 50; // Neutral if no completed sessions
      }

      // Count unique tutors
      const tutorIds = new Set<string>();
      snapshot.docs.forEach(doc => {
        const session = doc.data() as SessionDocument;
        tutorIds.add(session.tutorId);
      });

      const sessionCount = snapshot.size;
      const uniqueTutorCount = tutorIds.size;

      // Calculate consistency ratio
      // Fewer unique tutors = more consistent = higher score
      const consistencyRatio = 1 - ((uniqueTutorCount - 1) / sessionCount);
      const score = Math.max(0, consistencyRatio * 100);

      // Bonus for having 3+ sessions with same tutor
      if (sessionCount >= 3 && uniqueTutorCount === 1) {
        return Math.min(100, score + 20);
      }

      return Math.round(score);
    } catch (error) {
      console.error('Error calculating tutor consistency score:', error);
      return 50;
    }
  }

  /**
   * Calculate overall customer health metrics
   */
  async calculateCustomerHealth(customerId: string): Promise<CustomerHealthMetrics> {
    // Calculate individual scores
    const firstSessionScore = await this.calculateFirstSessionScore(customerId);
    const sessionVelocityScore = await this.calculateSessionVelocityScore(customerId);
    const ibCallScore = await this.calculateIbCallScore(customerId);
    const goalCompletionScore = await this.calculateGoalCompletionScore(customerId);
    const tutorConsistencyScore = await this.calculateTutorConsistencyScore(customerId);

    // Calculate weighted total risk score
    const totalRiskScore = Math.round(
      (firstSessionScore * WEIGHTS.FIRST_SESSION +
        sessionVelocityScore * WEIGHTS.SESSION_VELOCITY +
        ibCallScore * WEIGHTS.IB_CALL_FREQUENCY +
        goalCompletionScore * WEIGHTS.GOAL_COMPLETION +
        tutorConsistencyScore * WEIGHTS.TUTOR_CONSISTENCY) / 100
    );

    // Determine risk tier
    let riskTier: CustomerHealthMetrics['riskTier'];
    if (totalRiskScore <= 40) {
      riskTier = 'critical';
    } else if (totalRiskScore <= 70) {
      riskTier = 'at-risk';
    } else if (totalRiskScore <= 85) {
      riskTier = 'healthy';
    } else {
      riskTier = 'thriving';
    }

    // Determine risk flags
    const hasMultipleIbCalls = ibCallScore === 0;
    const hasLowFirstSession = firstSessionScore < 50;
    const hasLowVelocity = sessionVelocityScore < 40;
    const hasCompletedGoal = goalCompletionScore >= 100;

    // Generate intervention suggestion
    const suggestedIntervention = this.generateIntervention({
      riskTier,
      hasMultipleIbCalls,
      hasLowFirstSession,
      hasLowVelocity,
      firstSessionScore,
      sessionVelocityScore,
    });

    // Determine priority
    let priority: CustomerHealthMetrics['priority'];
    if (riskTier === 'critical') {
      priority = 'high';
    } else if (riskTier === 'at-risk') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      customerId,
      firstSessionScore,
      sessionVelocityScore,
      ibCallScore,
      goalCompletionScore,
      tutorConsistencyScore,
      totalRiskScore,
      riskTier,
      hasMultipleIbCalls,
      hasLowFirstSession,
      hasLowVelocity,
      hasCompletedGoal,
      suggestedIntervention,
      priority,
    };
  }

  /**
   * Generate intervention suggestion based on risk factors
   */
  private generateIntervention(metrics: {
    riskTier: string;
    hasMultipleIbCalls: boolean;
    hasLowFirstSession: boolean;
    hasLowVelocity: boolean;
    firstSessionScore: number;
    sessionVelocityScore: number;
  }): string {
    if (metrics.hasMultipleIbCalls) {
      return 'Critical: Customer has multiple support calls. Immediate outreach required.';
    }

    if (metrics.hasLowFirstSession) {
      return 'Poor first session experience. Consider tutor change or follow-up call.';
    }

    if (metrics.hasLowVelocity) {
      return 'Low session frequency. Send re-engagement campaign.';
    }

    if (metrics.riskTier === 'at-risk') {
      return 'Monitor customer closely. Consider proactive outreach.';
    }

    if (metrics.riskTier === 'healthy') {
      return 'Customer is stable. Continue standard engagement.';
    }

    if (metrics.riskTier === 'thriving') {
      return 'Excellent customer health. Consider cross-sell opportunity.';
    }

    return 'No specific intervention needed.';
  }
}

// Singleton instance
export const customerHealthScorer = new CustomerHealthScorer();
