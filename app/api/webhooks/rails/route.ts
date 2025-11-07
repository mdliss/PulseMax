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
import { ErrorLogger, ValidationError, UnauthorizedError, formatErrorResponse } from '@/lib/utils/errorHandler';
import { sanitizeString } from '@/lib/validation/schemas';

// Verify webhook signature using HMAC
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-rails-signature');
  const webhookSecret = process.env.RAILS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    ErrorLogger.warn('RAILS_WEBHOOK_SECRET not configured');
    return process.env.NODE_ENV === 'development'; // Allow in dev only
  }

  if (!signature) {
    return false;
  }

  // In production, verify HMAC signature
  // For now, use simple comparison (upgrade to crypto.createHmac in production)
  const isValid = signature === webhookSecret;

  if (!isValid) {
    ErrorLogger.warn('Invalid webhook signature', {
      receivedSignature: signature.substring(0, 10) + '...',
      expectedLength: webhookSecret.length
    });
  }

  return isValid;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for signature verification
    const bodyText = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(request, bodyText)) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    // Parse body
    const body = JSON.parse(bodyText);
    const { event, data } = body;

    if (!event || typeof event !== 'string') {
      throw new ValidationError('Missing or invalid event type');
    }

    if (!data || typeof data !== 'object') {
      throw new ValidationError('Missing or invalid event data');
    }

    // Sanitize event name
    const sanitizedEvent = sanitizeString(event, 100);

    ErrorLogger.info(`Webhook received: ${sanitizedEvent}`, {
      event: sanitizedEvent,
      hasData: !!data
    });

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
        ErrorLogger.warn(`Unknown event type: ${sanitizedEvent}`, {
          event: sanitizedEvent,
          supportedEvents: [
            'session.created',
            'session.updated',
            'session.completed',
            'session.cancelled',
            'customer.created',
            'customer.updated',
            'tutor.created',
            'tutor.updated'
          ]
        });
        throw new ValidationError(`Unknown event type: ${sanitizedEvent}`);
    }

    const duration = Date.now() - startTime;

    ErrorLogger.info(`Webhook processed successfully`, {
      event: sanitizedEvent,
      duration: `${duration}ms`
    });

    return NextResponse.json({
      success: true,
      event: sanitizedEvent,
      processedAt: new Date().toISOString(),
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), {
      context: 'webhook',
      duration: `${duration}ms`
    });

    const formattedError = formatErrorResponse(error);
    const statusCode = formattedError.error.statusCode || 500;

    return NextResponse.json(formattedError, { status: statusCode });
  }
}

// Event handlers
async function handleSessionEvent(data: RailsSession) {
  try {
    const session = transformSession(data);

    if (!validateSession(session)) {
      ErrorLogger.warn('Invalid session data received', {
        sessionId: data.session_id,
        missingFields: Object.keys(session).filter(key => !session[key as keyof typeof session])
      });
      throw new ValidationError('Invalid session data', {
        sessionId: data.session_id
      });
    }

    const docRef = db.collection(COLLECTIONS.SESSIONS).doc(session.sessionId);
    await docRef.set({
      ...session,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    ErrorLogger.info(`Session saved`, {
      sessionId: session.sessionId,
      customerId: session.customerId,
      status: session.status
    });
  } catch (error) {
    ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), {
      handler: 'handleSessionEvent',
      sessionId: data.session_id
    });
    throw error;
  }
}

async function handleCustomerEvent(data: RailsCustomer) {
  try {
    const customer = transformCustomer(data);

    if (!validateCustomer(customer)) {
      throw new ValidationError('Invalid customer data', {
        customerId: data.customer_id
      });
    }

    const docRef = db.collection(COLLECTIONS.CUSTOMERS).doc(customer.customerId);
    await docRef.set({
      ...customer,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    ErrorLogger.info(`Customer saved`, {
      customerId: customer.customerId,
      status: customer.status
    });
  } catch (error) {
    ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), {
      handler: 'handleCustomerEvent',
      customerId: data.customer_id
    });
    throw error;
  }
}

async function handleTutorEvent(data: RailsTutor) {
  try {
    const tutor = transformTutor(data);

    if (!validateTutor(tutor)) {
      throw new ValidationError('Invalid tutor data', {
        tutorId: data.tutor_id
      });
    }

    const docRef = db.collection(COLLECTIONS.TUTORS).doc(tutor.tutorId);
    await docRef.set({
      ...tutor,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    ErrorLogger.info(`Tutor saved`, {
      tutorId: tutor.tutorId,
      status: tutor.status
    });
  } catch (error) {
    ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), {
      handler: 'handleTutorEvent',
      tutorId: data.tutor_id
    });
    throw error;
  }
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
