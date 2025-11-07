import { NextResponse } from 'next/server';
import { churnPredictor, type CustomerFeatures } from '@/lib/churn/churnPredictor';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { getCached, setCache, CACHE_TTL, cacheKeys } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/churn-prediction
 *
 * Generates churn predictions for customers
 *
 * Query params:
 * - customerId: specific customer ID (optional)
 * - segment: filter by customer segment (optional)
 * - riskLevel: filter by risk level (optional): low | medium | high | critical
 * - limit: number of results to return (default: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const segment = searchParams.get('segment');
    const riskLevel = searchParams.get('riskLevel');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check cache first with improved cache key
    const cacheKey = cacheKeys.churnPrediction(
      customerId || undefined,
      segment || undefined,
      riskLevel || undefined,
      limit
    );
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Check Firebase configuration
    if (!isFirebaseConfigured || !db) {
      // Return mock predictions for development
      const mockData = generateMockPredictions(limit);
      await setCache(cacheKey, mockData, CACHE_TTL.METRICS);
      return NextResponse.json(mockData);
    }

    // Fetch customer data
    let customersQuery = collection(db, 'customers');

    if (customerId) {
      customersQuery = query(collection(db, 'customers'), where('customer_id', '==', customerId)) as any;
    }

    if (segment) {
      customersQuery = query(collection(db, 'customers'), where('segment', '==', segment)) as any;
    }

    const customersSnapshot = await getDocs(customersQuery);

    // Fetch customer health scores
    const healthScoresSnapshot = await getDocs(collection(db, 'customer_health_scores'));
    const healthScoresMap = new Map();
    healthScoresSnapshot.forEach(doc => {
      const data = doc.data();
      healthScoresMap.set(data.customer_id, data);
    });

    // Fetch ALL sessions once (instead of per-customer queries)
    const allSessionsSnapshot = await getDocs(collection(db, 'sessions'));

    // Group sessions by customer_id
    const sessionsByCustomer = new Map<string, any[]>();
    allSessionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.customer_id) {
        if (!sessionsByCustomer.has(data.customer_id)) {
          sessionsByCustomer.set(data.customer_id, []);
        }
        sessionsByCustomer.get(data.customer_id)!.push(data);
      }
    });

    // Calculate features for each customer
    const customerFeatures: CustomerFeatures[] = [];

    for (const customerDoc of customersSnapshot.docs) {
      const customer = customerDoc.data();
      const healthScore = healthScoresMap.get(customer.customer_id);

      // Get customer sessions from pre-fetched map
      const sessions = sessionsByCustomer.get(customer.customer_id) || [];

      const firstSession = sessions.find(s => s.is_first_session);
      const totalSessions = sessions.length;
      const avgRating = sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / totalSessions || 0;

      // Calculate days since last session
      const sortedSessions = sessions.sort((a, b) =>
        (b.created_at?.toDate?.()?.getTime() || 0) - (a.created_at?.toDate?.()?.getTime() || 0)
      );
      const lastSession = sortedSessions[0];
      const daysSinceLastSession = lastSession?.created_at?.toDate
        ? Math.floor((Date.now() - lastSession.created_at.toDate().getTime()) / (1000 * 60 * 60 * 24))
        : 30;

      // Calculate session velocity (sessions per week)
      const accountAge = customer.created_at?.toDate
        ? Math.floor((Date.now() - customer.created_at.toDate().getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      const sessionVelocity = (totalSessions / Math.max(accountAge / 7, 1));

      // Calculate tutor consistency
      const tutorCounts = new Map<string, number>();
      sessions.forEach(s => {
        if (s.tutor_id) {
          tutorCounts.set(s.tutor_id, (tutorCounts.get(s.tutor_id) || 0) + 1);
        }
      });
      const maxTutorSessions = Math.max(...Array.from(tutorCounts.values()), 0);
      const tutorConsistency = totalSessions > 0 ? (maxTutorSessions / totalSessions) * 100 : 0;

      // Get IB call frequency from health score
      const ibCallFrequency = healthScore?.ib_call_frequency || 0;

      const features: CustomerFeatures = {
        customerId: customer.customer_id,
        firstSessionSuccessRate: firstSession?.status === 'completed' && firstSession?.rating >= 4 ? 100 : 0,
        sessionVelocity,
        ibCallFrequency,
        goalCompletionRate: healthScore?.goal_completion_rate || 50,
        tutorConsistency,
        daysSinceLastSession,
        totalSessions,
        averageRating: avgRating,
        accountAge,
      };

      customerFeatures.push(features);

      // Apply limit during iteration to avoid processing too much data
      if (customerFeatures.length >= limit * 2) {
        break;
      }
    }

    // Generate predictions
    const predictions = churnPredictor.predictBatch(customerFeatures);

    // Filter by risk level if specified
    let filteredPredictions = predictions;
    if (riskLevel) {
      filteredPredictions = predictions.filter(p => p.churnRisk === riskLevel);
    }

    // Sort by churn probability (highest first) and limit
    const sortedPredictions = filteredPredictions
      .sort((a, b) => b.churnProbability - a.churnProbability)
      .slice(0, limit);

    // Calculate summary statistics
    const summary = {
      totalCustomers: predictions.length,
      byRisk: {
        critical: predictions.filter(p => p.churnRisk === 'critical').length,
        high: predictions.filter(p => p.churnRisk === 'high').length,
        medium: predictions.filter(p => p.churnRisk === 'medium').length,
        low: predictions.filter(p => p.churnRisk === 'low').length,
      },
      averageChurnProbability: predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length,
      highRiskCount: predictions.filter(p => p.churnRisk === 'critical' || p.churnRisk === 'high').length,
    };

    // Get feature importance
    const featureImportance = churnPredictor.getFeatureImportance();

    const responseData = {
      predictions: sortedPredictions,
      summary,
      featureImportance,
      modelInfo: {
        type: 'Logistic Regression',
        features: [
          'firstSessionSuccessRate',
          'sessionVelocity',
          'ibCallFrequency',
          'goalCompletionRate',
          'tutorConsistency',
          'daysSinceLastSession',
          'totalSessions',
          'averageRating',
          'accountAge',
        ],
        coefficients: churnPredictor.getCoefficients(),
      },
      timestamp: new Date().toISOString(),
    };

    // Cache the result (30 minute TTL for predictions)
    await setCache(cacheKey, responseData, CACHE_TTL.RECOMMENDATIONS);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error generating churn predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate churn predictions' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock predictions for development
 */
function generateMockPredictions(limit: number) {
  const mockPredictions = [];
  const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

  for (let i = 0; i < Math.min(limit, 20); i++) {
    const churnProbability = Math.random();
    const riskLevel = riskLevels[Math.floor(churnProbability * 4)];

    mockPredictions.push({
      customerId: `customer_${i + 1}`,
      churnProbability: parseFloat(churnProbability.toFixed(4)),
      churnRisk: riskLevel,
      riskFactors: [
        {
          factor: 'Low Session Frequency',
          impact: -0.7,
          description: 'Only 1.2 sessions per week',
        },
        {
          factor: 'Inactive Account',
          impact: -0.8,
          description: '21 days since last session',
        },
      ],
      interventionRecommendations: [
        'Send personalized re-engagement email with scheduling link',
        'Offer flexible scheduling options or session package discount',
        'Send urgent "We miss you!" campaign with incentive',
      ],
      confidence: 0.85,
    });
  }

  return {
    predictions: mockPredictions.sort((a, b) => b.churnProbability - a.churnProbability),
    summary: {
      totalCustomers: mockPredictions.length,
      byRisk: {
        critical: mockPredictions.filter(p => p.churnRisk === 'critical').length,
        high: mockPredictions.filter(p => p.churnRisk === 'high').length,
        medium: mockPredictions.filter(p => p.churnRisk === 'medium').length,
        low: mockPredictions.filter(p => p.churnRisk === 'low').length,
      },
      averageChurnProbability: mockPredictions.reduce((sum, p) => sum + p.churnProbability, 0) / mockPredictions.length,
      highRiskCount: mockPredictions.filter(p => p.churnRisk === 'critical' || p.churnRisk === 'high').length,
    },
    featureImportance: churnPredictor.getFeatureImportance(),
    modelInfo: {
      type: 'Logistic Regression',
      features: [
        'firstSessionSuccessRate',
        'sessionVelocity',
        'ibCallFrequency',
        'goalCompletionRate',
        'tutorConsistency',
        'daysSinceLastSession',
        'totalSessions',
        'averageRating',
        'accountAge',
      ],
      coefficients: churnPredictor.getCoefficients(),
    },
    timestamp: new Date().toISOString(),
  };
}
