import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

interface CustomerExportData {
  customerId: string;
  name: string;
  email: string;
  riskScore: number;
  riskTier: string;
  firstSessionScore: number;
  sessionVelocityScore: number;
  ibCallScore: number;
  goalCompleted: string;
  suggestedIntervention: string;
  calculatedAt: string;
  cohort: string;
  segment: string;
  createdAt: string;
  totalSessions: number;
}

/**
 * GET /api/customers/export
 *
 * Export customer data to CSV format
 *
 * Query params:
 * - riskTier: Filter by risk tier (optional): critical | at-risk | healthy | thriving
 * - minRiskScore: Minimum risk score (optional)
 * - maxRiskScore: Maximum risk score (optional)
 * - segment: Filter by customer segment (optional)
 * - format: Export format (default: csv)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const riskTier = searchParams.get('riskTier');
    const minRiskScore = searchParams.get('minRiskScore');
    const maxRiskScore = searchParams.get('maxRiskScore');
    const segment = searchParams.get('segment');
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is currently supported' },
        { status: 400 }
      );
    }

    // Check Firebase configuration
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(
        { error: 'Firebase not configured. Cannot export customer data.' },
        { status: 503 }
      );
    }

    // Fetch customer health scores
    let customersQuery = query(
      collection(db, 'customer_health_scores'),
      orderBy('riskScore', 'desc')
    );

    const healthSnapshot = await getDocs(customersQuery);

    // Fetch customer details
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customersMap = new Map();
    customersSnapshot.forEach(doc => {
      const data = doc.data();
      customersMap.set(data.customer_id, {
        name: data.name || 'Unknown',
        email: data.email || '',
        cohort: data.cohort || 'Unknown',
        segment: data.segment || 'Unknown',
        createdAt: data.created_at?.toDate?.()?.toISOString() || '',
      });
    });

    // Fetch session counts per customer
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    const sessionCounts = new Map<string, number>();
    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      const customerId = data.customer_id;
      if (customerId) {
        sessionCounts.set(customerId, (sessionCounts.get(customerId) || 0) + 1);
      }
    });

    // Build export data
    const exportData: CustomerExportData[] = [];

    healthSnapshot.forEach(doc => {
      const data = doc.data();
      const customerId = data.customer_id;
      const customerInfo = customersMap.get(customerId);

      // Apply filters
      if (riskTier && data.risk_tier !== riskTier) return;
      if (minRiskScore && data.risk_score < parseFloat(minRiskScore)) return;
      if (maxRiskScore && data.risk_score > parseFloat(maxRiskScore)) return;
      if (segment && customerInfo?.segment !== segment) return;

      exportData.push({
        customerId: customerId || '',
        name: customerInfo?.name || 'Unknown',
        email: customerInfo?.email || '',
        riskScore: data.risk_score || 0,
        riskTier: data.risk_tier || 'unknown',
        firstSessionScore: data.first_session_score || 0,
        sessionVelocityScore: data.session_velocity_score || 0,
        ibCallScore: data.ib_call_score || 0,
        goalCompleted: data.has_completed_goal ? 'Yes' : 'No',
        suggestedIntervention: data.suggested_intervention || '',
        calculatedAt: data.calculated_at?.toDate?.()?.toISOString() || '',
        cohort: customerInfo?.cohort || 'Unknown',
        segment: customerInfo?.segment || 'Unknown',
        createdAt: customerInfo?.createdAt || '',
        totalSessions: sessionCounts.get(customerId) || 0,
      });
    });

    // Generate CSV
    const csv = generateCSV(exportData);

    // Return CSV as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error exporting customer data:', error);
    return NextResponse.json(
      { error: 'Failed to export customer data' },
      { status: 500 }
    );
  }
}

/**
 * Convert array of objects to CSV string
 */
function generateCSV(data: CustomerExportData[]): string {
  if (data.length === 0) {
    return 'No data to export';
  }

  // CSV headers
  const headers = [
    'Customer ID',
    'Name',
    'Email',
    'Risk Score',
    'Risk Tier',
    'First Session Score',
    'Session Velocity Score',
    'IB Call Score',
    'Goal Completed',
    'Suggested Intervention',
    'Calculated At',
    'Cohort',
    'Segment',
    'Created At',
    'Total Sessions',
  ];

  // CSV rows
  const rows = data.map(customer => [
    escapeCSVValue(customer.customerId),
    escapeCSVValue(customer.name),
    escapeCSVValue(customer.email),
    customer.riskScore,
    escapeCSVValue(customer.riskTier),
    customer.firstSessionScore,
    customer.sessionVelocityScore,
    customer.ibCallScore,
    escapeCSVValue(customer.goalCompleted),
    escapeCSVValue(customer.suggestedIntervention),
    escapeCSVValue(customer.calculatedAt),
    escapeCSVValue(customer.cohort),
    escapeCSVValue(customer.segment),
    escapeCSVValue(customer.createdAt),
    customer.totalSessions,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Escape special characters in CSV values
 */
function escapeCSVValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString();
  }

  if (!value) {
    return '';
  }

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
