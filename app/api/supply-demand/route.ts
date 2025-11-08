import { NextResponse } from 'next/server';
import { generateMockSupplyDemandPredictions, generateMockSupplyDemandAlerts } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

interface CombinedSupplyDemandData {
  predictionData: any;
  alertData: any;
}

function fetchSupplyDemandData(): CombinedSupplyDemandData {
  try {
    // Generate mock data directly instead of fetching
    const predictionData = generateMockSupplyDemandPredictions();
    const alertData = generateMockSupplyDemandAlerts();

    return {
      predictionData,
      alertData
    };
  } catch (error) {
    console.error('[API] Error generating supply-demand data:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const data = fetchSupplyDemandData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching supply-demand data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supply-demand data' },
      { status: 500 }
    );
  }
}
