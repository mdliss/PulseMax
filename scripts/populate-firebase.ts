/**
 * Firebase Sample Data Population Script
 * Run with: npx tsx scripts/populate-firebase.ts
 */

// CRITICAL: Load environment variables BEFORE any other imports
// This must be synchronous and happen before Firebase initialization
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Now we can safely import Firebase (after env is loaded)
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase here instead of importing from lib
if (!getApps().length) {
  let serviceAccount = undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim().replace(/^['"]|['"]$/g, '');
      serviceAccount = JSON.parse(key);
      console.log('✅ Firebase service account loaded');
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required for this script');
  }
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

interface Session {
  session_id: string;
  tutor_id: string;
  customer_id: string;
  subject: string;
  status: 'completed' | 'active' | 'scheduled' | 'cancelled';
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  rating?: number;
  first_session: boolean;
  platform: string;
}

interface Customer {
  customer_id: string;
  name: string;
  email: string;
  segment: 'premium' | 'standard' | 'trial';
  signup_date: Date;
  total_sessions: number;
  last_session_date?: Date;
}

interface Tutor {
  tutor_id: string;
  name: string;
  email: string;
  subjects: string[];
  total_sessions: number;
  average_rating: number;
  availability_hours: number;
}

const subjects = ['Math', 'Science', 'English', 'History', 'Spanish', 'Physics', 'Chemistry'];
const segments: ('premium' | 'standard' | 'trial')[] = ['premium', 'standard', 'trial'];
const statuses: ('completed' | 'active' | 'scheduled' | 'cancelled')[] = ['completed', 'active', 'scheduled', 'cancelled'];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

async function populateFirebase() {
  console.log('🔥 Starting Firebase data population...\n');

  try {
    // Create 20 tutors
    console.log('Creating tutors...');
    const tutors: Tutor[] = [];
    for (let i = 1; i <= 20; i++) {
      const tutor: Tutor = {
        tutor_id: `tutor_${i}`,
        name: `Tutor ${i}`,
        email: `tutor${i}@pulsemax.com`,
        subjects: [randomItem(subjects), randomItem(subjects)].filter((v, i, a) => a.indexOf(v) === i),
        total_sessions: Math.floor(Math.random() * 100) + 10,
        average_rating: Number((Math.random() * 1.5 + 3.5).toFixed(2)),
        availability_hours: Math.floor(Math.random() * 30) + 10,
      };
      tutors.push(tutor);
      await db.collection('tutors').doc(tutor.tutor_id).set(tutor);
    }
    console.log(`✅ Created ${tutors.length} tutors\n`);

    // Create 50 customers
    console.log('Creating customers...');
    const customers: Customer[] = [];
    for (let i = 1; i <= 50; i++) {
      const customer: Customer = {
        customer_id: `customer_${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        segment: randomItem(segments),
        signup_date: randomDate(Math.floor(Math.random() * 180)),
        total_sessions: Math.floor(Math.random() * 30),
      };
      customers.push(customer);
      await db.collection('customers').doc(customer.customer_id).set(customer);
    }
    console.log(`✅ Created ${customers.length} customers\n`);

    // Create 200 sessions
    console.log('Creating sessions...');
    const sessions: Session[] = [];
    for (let i = 1; i <= 200; i++) {
      const tutor = randomItem(tutors);
      const customer = randomItem(customers);
      const daysAgo = Math.floor(Math.random() * 30);
      const startTime = randomDate(daysAgo);
      const duration = Math.floor(Math.random() * 60) + 30;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      const session: Session = {
        session_id: `session_${i}`,
        tutor_id: tutor.tutor_id,
        customer_id: customer.customer_id,
        subject: randomItem(tutor.subjects),
        status: daysAgo === 0 ? randomItem(['active', 'scheduled']) : randomItem(['completed', 'cancelled']),
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        rating: Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 3 : undefined,
        first_session: Math.random() > 0.7,
        platform: 'web',
      };
      sessions.push(session);
      await db.collection('sessions').doc(session.session_id).set(session);
    }
    console.log(`✅ Created ${sessions.length} sessions\n`);

    // Create customer health scores
    console.log('Creating customer health scores...');
    let healthScores = 0;
    for (const customer of customers) {
      const riskScore = Math.random() * 100;
      const riskLevel = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';

      await db.collection('customer_health_scores').doc(customer.customer_id).set({
        customer_id: customer.customer_id,
        risk_score: Number(riskScore.toFixed(2)),
        risk_level: riskLevel,
        first_session_success_rate: Number((Math.random() * 40 + 60).toFixed(2)),
        session_velocity: Number((Math.random() * 3 + 1).toFixed(2)),
        ib_call_frequency: Math.floor(Math.random() * 5),
        goal_completion_rate: Number((Math.random() * 30 + 60).toFixed(2)),
        tutor_consistency: Number((Math.random() * 40 + 50).toFixed(2)),
        last_updated: new Date(),
      });
      healthScores++;
    }
    console.log(`✅ Created ${healthScores} customer health scores\n`);

    // Create tutor performance records
    console.log('Creating tutor performance records...');
    let performanceRecords = 0;
    for (const tutor of tutors) {
      await db.collection('tutor_performance').doc(tutor.tutor_id).set({
        tutor_id: tutor.tutor_id,
        first_session_success_rate: Number((Math.random() * 30 + 60).toFixed(2)),
        average_rating: tutor.average_rating,
        total_sessions: tutor.total_sessions,
        active_students: Math.floor(Math.random() * 20) + 5,
        response_time_avg_minutes: Math.floor(Math.random() * 30) + 5,
        cancellation_rate: Number((Math.random() * 15).toFixed(2)),
        last_updated: new Date(),
      });
      performanceRecords++;
    }
    console.log(`✅ Created ${performanceRecords} tutor performance records\n`);

    console.log('🎉 Firebase data population complete!');
    console.log('\nSummary:');
    console.log(`- Tutors: ${tutors.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Sessions: ${sessions.length}`);
    console.log(`- Health Scores: ${healthScores}`);
    console.log(`- Performance Records: ${performanceRecords}`);
    console.log('\n✅ You can now test the dashboard with real data!');

  } catch (error) {
    console.error('❌ Error populating Firebase:', error);
    process.exit(1);
  }
}

// Run the script
populateFirebase();
