import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/db/firebase';
import { COLLECTIONS, CustomerHealthDocument } from '@/lib/db/collections';
import { customerHealthScorer } from '@/lib/scoring/customerHealth';

/**
 * POST /api/health/calculate
 * Calculate health scores for customers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, recalculateAll } = body;

    if (recalculateAll) {
      // Recalculate for all active customers
      const result = await recalculateAllCustomers();
      return NextResponse.json(result);
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    // Calculate for single customer
    const healthMetrics = await customerHealthScorer.calculateCustomerHealth(customerId);

    // Save to Firestore
    const healthDoc: Omit<CustomerHealthDocument, 'createdAt'> = {
      customerId: healthMetrics.customerId,
      riskScore: healthMetrics.totalRiskScore,
      riskTier: healthMetrics.riskTier,
      firstSessionScore: healthMetrics.firstSessionScore,
      sessionVelocityScore: healthMetrics.sessionVelocityScore,
      ibCallScore: healthMetrics.ibCallScore,
      goalCompletionScore: healthMetrics.goalCompletionScore,
      tutorConsistencyScore: healthMetrics.tutorConsistencyScore,
      hasMultipleIbCalls: healthMetrics.hasMultipleIbCalls,
      hasLowFirstSession: healthMetrics.hasLowFirstSession,
      hasLowVelocity: healthMetrics.hasLowVelocity,
      hasCompletedGoal: healthMetrics.hasCompletedGoal,
      suggestedIntervention: healthMetrics.suggestedIntervention,
      priority: healthMetrics.priority,
      calculatedAt: new Date(),
    };

    const docRef = db.collection(COLLECTIONS.CUSTOMER_HEALTH).doc(customerId);
    await docRef.set({
      ...healthDoc,
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      customerId,
      healthMetrics,
    });

  } catch (error) {
    console.error('Error calculating health scores:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/calculate?customerId=xxx
 * Get health score for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId query parameter is required' },
        { status: 400 }
      );
    }

    // Get from Firestore first
    const snapshot = await db.collection(COLLECTIONS.CUSTOMER_HEALTH)
      .where('customerId', '==', customerId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data() as CustomerHealthDocument;
      return NextResponse.json({
        success: true,
        customerId,
        healthMetrics: data,
        cached: true,
      });
    }

    // If not in Firestore, calculate fresh
    const healthMetrics = await customerHealthScorer.calculateCustomerHealth(customerId);

    return NextResponse.json({
      success: true,
      customerId,
      healthMetrics,
      cached: false,
    });

  } catch (error) {
    console.error('Error getting health scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Recalculate health scores for all active customers
 */
async function recalculateAllCustomers() {
  const customersSnapshot = await db.collection(COLLECTIONS.CUSTOMERS)
    .where('status', '==', 'active')
    .get();

  const total = customersSnapshot.size;
  let processed = 0;
  let errors = 0;

  // Process in batches of 500 (Firestore limit)
  const BATCH_SIZE = 500;
  const batches: any[][] = [];

  for (let i = 0; i < customersSnapshot.docs.length; i += BATCH_SIZE) {
    batches.push(customersSnapshot.docs.slice(i, i + BATCH_SIZE));
  }

  for (const batchDocs of batches) {
    const batch = db.batch();

    for (const customerDoc of batchDocs) {
      try {
        const customerId = customerDoc.data().customerId;
        const healthMetrics = await customerHealthScorer.calculateCustomerHealth(customerId);

        const healthDoc: Omit<CustomerHealthDocument, 'createdAt'> = {
          customerId: healthMetrics.customerId,
          riskScore: healthMetrics.totalRiskScore,
          riskTier: healthMetrics.riskTier,
          firstSessionScore: healthMetrics.firstSessionScore,
          sessionVelocityScore: healthMetrics.sessionVelocityScore,
          ibCallScore: healthMetrics.ibCallScore,
          goalCompletionScore: healthMetrics.goalCompletionScore,
          tutorConsistencyScore: healthMetrics.tutorConsistencyScore,
          hasMultipleIbCalls: healthMetrics.hasMultipleIbCalls,
          hasLowFirstSession: healthMetrics.hasLowFirstSession,
          hasLowVelocity: healthMetrics.hasLowVelocity,
          hasCompletedGoal: healthMetrics.hasCompletedGoal,
          suggestedIntervention: healthMetrics.suggestedIntervention,
          priority: healthMetrics.priority,
          calculatedAt: new Date(),
        };

        const docRef = db.collection(COLLECTIONS.CUSTOMER_HEALTH).doc(customerId);
        batch.set(docRef, {
          ...healthDoc,
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        processed++;
      } catch (error) {
        console.error(`Error processing customer ${customerDoc.id}:`, error);
        errors++;
      }
    }

    await batch.commit();
  }

  return {
    success: true,
    total,
    processed,
    errors,
    message: `Recalculated health scores for ${processed}/${total} customers`,
  };
}
