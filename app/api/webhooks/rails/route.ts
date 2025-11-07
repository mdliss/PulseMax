import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/db/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import {
  transformSession,
  transformCustomer,
  transformTutor,
  validateSession,
  validateCustomer,
  validateTutor,
  type RailsSession,
  type RailsCustomer,
  type RailsTutor,
} from '@/lib/ingestion/transformers';

// Verify webhook signature
function verifyWebhookSignature(request: NextRequest): boolean {
  const signature = request.headers.get('x-rails-signature');
  const webhookSecret = process.env.RAILS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('RAILS_WEBHOOK_SECRET not configured');
    return false;
  }

  // In production, verify HMAC signature
  // For now, just check if signature exists
  return signature === webhookSecret;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(request)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data' },
        { status: 400 }
      );
    }

    console.log(`Received webhook event: ${event}`);

    // Handle different event types
    switch (event) {
      case 'session.created':
      case 'session.updated':
        await handleSessionEvent(data);
        break;

      case 'customer.created':
      case 'customer.updated':
        await handleCustomerEvent(data);
        break;

      case 'tutor.created':
      case 'tutor.updated':
        await handleTutorEvent(data);
        break;

      case 'session.completed':
        await handleSessionCompleted(data);
        break;

      case 'session.cancelled':
        await handleSessionCancelled(data);
        break;

      default:
        console.warn(`Unknown event type: ${event}`);
        return NextResponse.json(
          { error: `Unknown event type: ${event}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, event });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Event handlers
async function handleSessionEvent(data: RailsSession) {
  const session = transformSession(data);

  if (!validateSession(session)) {
    console.error('Invalid session data:', data);
    throw new Error('Invalid session data');
  }

  const docRef = db.collection(COLLECTIONS.SESSIONS).doc(session.sessionId);
  await docRef.set({
    ...session,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`Session ${session.sessionId} saved to Firestore`);
}

async function handleCustomerEvent(data: RailsCustomer) {
  const customer = transformCustomer(data);

  if (!validateCustomer(customer)) {
    console.error('Invalid customer data:', data);
    throw new Error('Invalid customer data');
  }

  const docRef = db.collection(COLLECTIONS.CUSTOMERS).doc(customer.customerId);
  await docRef.set({
    ...customer,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`Customer ${customer.customerId} saved to Firestore`);
}

async function handleTutorEvent(data: RailsTutor) {
  const tutor = transformTutor(data);

  if (!validateTutor(tutor)) {
    console.error('Invalid tutor data:', data);
    throw new Error('Invalid tutor data');
  }

  const docRef = db.collection(COLLECTIONS.TUTORS).doc(tutor.tutorId);
  await docRef.set({
    ...tutor,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`Tutor ${tutor.tutorId} saved to Firestore`);
}

async function handleSessionCompleted(data: RailsSession) {
  // Update session status and trigger metrics recalculation
  await handleSessionEvent({
    ...data,
    status: 'completed',
  });

  // TODO: Trigger customer health score recalculation
  // TODO: Trigger tutor performance recalculation
}

async function handleSessionCancelled(data: RailsSession) {
  await handleSessionEvent({
    ...data,
    status: 'cancelled',
  });
}
