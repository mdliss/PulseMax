/**
 * Data transformation layer: Rails API → Firebase Firestore
 */

import {
  SessionDocument,
  CustomerDocument,
  TutorDocument,
  InboundCallDocument,
} from '@/lib/db/collections';

// Rails API types (based on expected response format)
export interface RailsSession {
  id: string;
  session_id: string;
  customer_id: string;
  tutor_id: string;
  subject: string;
  start_time: string;
  end_time?: string;
  rating?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RailsCustomer {
  id: string;
  customer_id: string;
  name?: string;
  email?: string;
  signup_date: string;
  acquisition_channel?: string;
  goals?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RailsTutor {
  id: string;
  tutor_id: string;
  name?: string;
  email?: string;
  subjects?: string[];
  status: string;
  rating_avg?: number;
  created_at: string;
  updated_at: string;
}

export interface RailsInboundCall {
  id: string;
  customer_id: string;
  call_date: string;
  duration?: number;
  reason_code?: string;
  created_at: string;
}

// Transformation functions
export function transformSession(railsSession: RailsSession): SessionDocument {
  return {
    sessionId: railsSession.session_id,
    customerId: railsSession.customer_id,
    tutorId: railsSession.tutor_id,
    subject: railsSession.subject,
    startTime: new Date(railsSession.start_time),
    endTime: railsSession.end_time ? new Date(railsSession.end_time) : undefined,
    rating: railsSession.rating,
    status: normalizeSessionStatus(railsSession.status),
    createdAt: new Date(railsSession.created_at),
    updatedAt: new Date(railsSession.updated_at),
  };
}

export function transformCustomer(railsCustomer: RailsCustomer): CustomerDocument {
  return {
    customerId: railsCustomer.customer_id,
    name: railsCustomer.name,
    email: railsCustomer.email,
    signupDate: new Date(railsCustomer.signup_date),
    acquisitionChannel: railsCustomer.acquisition_channel,
    goals: railsCustomer.goals || [],
    status: normalizeCustomerStatus(railsCustomer.status),
    createdAt: new Date(railsCustomer.created_at),
    updatedAt: new Date(railsCustomer.updated_at),
  };
}

export function transformTutor(railsTutor: RailsTutor): TutorDocument {
  return {
    tutorId: railsTutor.tutor_id,
    name: railsTutor.name,
    email: railsTutor.email,
    subjects: railsTutor.subjects || [],
    status: normalizeTutorStatus(railsTutor.status),
    ratingAvg: railsTutor.rating_avg,
    createdAt: new Date(railsTutor.created_at),
    updatedAt: new Date(railsTutor.updated_at),
  };
}

export function transformInboundCall(railsCall: RailsInboundCall): InboundCallDocument {
  return {
    customerId: railsCall.customer_id,
    callDate: new Date(railsCall.call_date),
    duration: railsCall.duration,
    reasonCode: railsCall.reason_code,
    createdAt: new Date(railsCall.created_at),
  };
}

// Batch transformations
export function transformSessions(sessions: RailsSession[]): SessionDocument[] {
  return sessions.map(transformSession);
}

export function transformCustomers(customers: RailsCustomer[]): CustomerDocument[] {
  return customers.map(transformCustomer);
}

export function transformTutors(tutors: RailsTutor[]): TutorDocument[] {
  return tutors.map(transformTutor);
}

export function transformInboundCalls(calls: RailsInboundCall[]): InboundCallDocument[] {
  return calls.map(transformInboundCall);
}

// Status normalization helpers
function normalizeSessionStatus(status: string): SessionDocument['status'] {
  const normalized = status.toLowerCase().replace(/[-_\s]/g, '');

  switch (normalized) {
    case 'scheduled':
    case 'pending':
      return 'scheduled';
    case 'inprogress':
    case 'active':
    case 'ongoing':
      return 'in-progress';
    case 'completed':
    case 'finished':
    case 'done':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      console.warn(`Unknown session status: ${status}, defaulting to 'scheduled'`);
      return 'scheduled';
  }
}

function normalizeCustomerStatus(status: string): CustomerDocument['status'] {
  const normalized = status.toLowerCase().replace(/[-_\s]/g, '');

  switch (normalized) {
    case 'active':
      return 'active';
    case 'inactive':
    case 'dormant':
      return 'inactive';
    case 'churned':
    case 'cancelled':
    case 'canceled':
      return 'churned';
    default:
      console.warn(`Unknown customer status: ${status}, defaulting to 'active'`);
      return 'active';
  }
}

function normalizeTutorStatus(status: string): TutorDocument['status'] {
  const normalized = status.toLowerCase().replace(/[-_\s]/g, '');

  switch (normalized) {
    case 'active':
      return 'active';
    case 'inactive':
    case 'dormant':
    case 'paused':
      return 'inactive';
    default:
      console.warn(`Unknown tutor status: ${status}, defaulting to 'active'`);
      return 'active';
  }
}

// Data validation
export function validateSession(session: Partial<SessionDocument>): boolean {
  return !!(
    session.sessionId &&
    session.customerId &&
    session.tutorId &&
    session.subject &&
    session.startTime &&
    session.status
  );
}

export function validateCustomer(customer: Partial<CustomerDocument>): boolean {
  return !!(
    customer.customerId &&
    customer.signupDate &&
    customer.status
  );
}

export function validateTutor(tutor: Partial<TutorDocument>): boolean {
  return !!(
    tutor.tutorId &&
    tutor.status
  );
}

export function validateInboundCall(call: Partial<InboundCallDocument>): boolean {
  return !!(
    call.customerId &&
    call.callDate
  );
}
