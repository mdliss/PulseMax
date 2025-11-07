import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { generateMockSessionVelocity } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

interface CohortData {
  cohortId: string;
  cohortName: string;
  startDate: string;
  totalCustomers: number;
  weeklyData: WeeklySessionData[];
  averageVelocity: number;
  retentionRate: number;
}

interface WeeklySessionData {
  weekNumber: number;
  weekStartDate: string;
  totalSessions: number;
  activeCustomers: number;
  averageSessionsPerCustomer: number;
}

interface CustomerVelocity {
  customerId: string;
  customerName: string;
  cohort: string;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  sessionsPerWeek: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing' | 'at-risk';
  lastSessionDate: string;
}

function getWeekNumber(date: Date, cohortStartDate: Date): number {
  const diffTime = date.getTime() - cohortStartDate.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks;
}

function getWeekStartDate(weekNumber: number, cohortStartDate: Date): string {
  const weekStart = new Date(cohortStartDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber * 7));
  return weekStart.toISOString();
}

export async function GET(request: Request) {
  try {
    // Use mock data if Firebase is not configured
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(generateMockSessionVelocity());
    }

    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get('cohortId');
    const customerId = searchParams.get('customerId');

    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

    // Get all customers with their cohort information
    const customersQuery = query(collection(db, 'customers'));
    const customersSnapshot = await getDocs(customersQuery);

    // Get sessions from the last 12 weeks
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('created_at', '>=', Timestamp.fromDate(twelveWeeksAgo)),
      orderBy('created_at', 'asc')
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);

    // Organize customers by cohort
    const cohortMap = new Map<string, {
      cohortName: string;
      startDate: Date;
      customers: Set<string>;
      customerNames: Map<string, string>;
    }>();

    customersSnapshot.forEach(doc => {
      const data = doc.data();
      const customerCohort = data.cohort || 'Unknown';
      const cohortStartDate = data.cohort_start_date
        ? data.cohort_start_date.toDate()
        : new Date(data.created_at.toDate());

      if (!cohortMap.has(customerCohort)) {
        cohortMap.set(customerCohort, {
          cohortName: customerCohort,
          startDate: cohortStartDate,
          customers: new Set(),
          customerNames: new Map()
        });
      }

      const cohort = cohortMap.get(customerCohort)!;
      cohort.customers.add(doc.id);
      cohort.customerNames.set(doc.id, data.name || 'Unknown');
    });

    // Track sessions by cohort and week
    const cohortWeeklyData = new Map<string, Map<number, {
      totalSessions: number;
      activeCustomers: Set<string>;
    }>>();

    // Track individual customer velocity
    const customerVelocityMap = new Map<string, {
      customerId: string;
      customerName: string;
      cohort: string;
      weeklySessionCounts: Map<number, number>;
      lastSessionDate: Date;
    }>();

    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      const customerId = data.customer_id;
      const sessionDate = data.created_at.toDate();

      // Find customer's cohort
      let customerCohort = 'Unknown';
      let cohortStartDate = new Date();
      let customerName = 'Unknown';

      for (const [cohortId, cohortData] of cohortMap.entries()) {
        if (cohortData.customers.has(customerId)) {
          customerCohort = cohortId;
          cohortStartDate = cohortData.startDate;
          customerName = cohortData.customerNames.get(customerId) || 'Unknown';
          break;
        }
      }

      const weekNumber = getWeekNumber(sessionDate, cohortStartDate);

      // Update cohort weekly data
      if (!cohortWeeklyData.has(customerCohort)) {
        cohortWeeklyData.set(customerCohort, new Map());
      }
      const cohortWeeks = cohortWeeklyData.get(customerCohort)!;

      if (!cohortWeeks.has(weekNumber)) {
        cohortWeeks.set(weekNumber, {
          totalSessions: 0,
          activeCustomers: new Set()
        });
      }

      const weekData = cohortWeeks.get(weekNumber)!;
      weekData.totalSessions++;
      weekData.activeCustomers.add(customerId);

      // Update customer velocity data
      if (!customerVelocityMap.has(customerId)) {
        customerVelocityMap.set(customerId, {
          customerId,
          customerName,
          cohort: customerCohort,
          weeklySessionCounts: new Map(),
          lastSessionDate: sessionDate
        });
      }

      const customerData = customerVelocityMap.get(customerId)!;
      if (sessionDate > customerData.lastSessionDate) {
        customerData.lastSessionDate = sessionDate;
      }

      const currentWeekNumber = getWeekNumber(now, cohortStartDate);
      const relativeWeek = currentWeekNumber - weekNumber;

      if (relativeWeek >= 0 && relativeWeek < 12) {
        const count = customerData.weeklySessionCounts.get(relativeWeek) || 0;
        customerData.weeklySessionCounts.set(relativeWeek, count + 1);
      }
    });

    // Build cohort data
    const cohortDataArray: CohortData[] = [];

    for (const [cohortId, cohortInfo] of cohortMap.entries()) {
      if (cohortId && (!cohortId || cohortId === cohortId)) {
        const weeklyData: WeeklySessionData[] = [];
        const cohortWeeks = cohortWeeklyData.get(cohortId) || new Map();

        // Get last 12 weeks
        const currentWeek = getWeekNumber(now, cohortInfo.startDate);

        for (let week = Math.max(0, currentWeek - 11); week <= currentWeek; week++) {
          const weekData = cohortWeeks.get(week);

          weeklyData.push({
            weekNumber: week,
            weekStartDate: getWeekStartDate(week, cohortInfo.startDate),
            totalSessions: weekData?.totalSessions || 0,
            activeCustomers: weekData?.activeCustomers.size || 0,
            averageSessionsPerCustomer: weekData && weekData.activeCustomers.size > 0
              ? weekData.totalSessions / weekData.activeCustomers.size
              : 0
          });
        }

        const totalSessions = weeklyData.reduce((sum, w) => sum + w.totalSessions, 0);
        const weeksWithActivity = weeklyData.filter(w => w.activeCustomers > 0).length;
        const averageVelocity = weeksWithActivity > 0 ? totalSessions / weeksWithActivity : 0;

        const lastWeekActive = weeklyData[weeklyData.length - 1]?.activeCustomers || 0;
        const retentionRate = cohortInfo.customers.size > 0
          ? (lastWeekActive / cohortInfo.customers.size) * 100
          : 0;

        cohortDataArray.push({
          cohortId,
          cohortName: cohortInfo.cohortName,
          startDate: cohortInfo.startDate.toISOString(),
          totalCustomers: cohortInfo.customers.size,
          weeklyData,
          averageVelocity: parseFloat(averageVelocity.toFixed(2)),
          retentionRate: parseFloat(retentionRate.toFixed(2))
        });
      }
    }

    // Build customer velocity data
    const customerVelocities: CustomerVelocity[] = [];

    for (const [customerId, data] of customerVelocityMap.entries()) {
      if (customerId && (!customerId || customerId === customerId)) {
        const sessionsThisWeek = data.weeklySessionCounts.get(0) || 0;
        const sessionsLastWeek = data.weeklySessionCounts.get(1) || 0;

        let totalSessions = 0;
        let weeksWithSessions = 0;

        for (let i = 0; i < 12; i++) {
          const count = data.weeklySessionCounts.get(i) || 0;
          if (count > 0) {
            totalSessions += count;
            weeksWithSessions++;
          }
        }

        const sessionsPerWeek = weeksWithSessions > 0
          ? totalSessions / weeksWithSessions
          : 0;

        let velocityTrend: CustomerVelocity['velocityTrend'];
        const daysSinceLastSession = Math.floor(
          (now.getTime() - data.lastSessionDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceLastSession > 14 || sessionsPerWeek < 0.5) {
          velocityTrend = 'at-risk';
        } else if (sessionsThisWeek > sessionsLastWeek) {
          velocityTrend = 'increasing';
        } else if (sessionsThisWeek < sessionsLastWeek * 0.7) {
          velocityTrend = 'decreasing';
        } else {
          velocityTrend = 'stable';
        }

        customerVelocities.push({
          customerId,
          customerName: data.customerName,
          cohort: data.cohort,
          sessionsThisWeek,
          sessionsLastWeek,
          sessionsPerWeek: parseFloat(sessionsPerWeek.toFixed(2)),
          velocityTrend,
          lastSessionDate: data.lastSessionDate.toISOString()
        });
      }
    }

    // Sort by velocity trend priority
    const trendPriority = { 'at-risk': 0, 'decreasing': 1, 'stable': 2, 'increasing': 3 };
    customerVelocities.sort((a, b) => trendPriority[a.velocityTrend] - trendPriority[b.velocityTrend]);

    return NextResponse.json({
      cohorts: cohortDataArray.sort((a, b) => b.averageVelocity - a.averageVelocity),
      customerVelocities,
      atRiskCount: customerVelocities.filter(c => c.velocityTrend === 'at-risk').length,
      decreasingCount: customerVelocities.filter(c => c.velocityTrend === 'decreasing').length,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching session velocity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session velocity data' },
      { status: 500 }
    );
  }
}
