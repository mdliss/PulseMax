import { NextRequest } from 'next/server';
import { generateMockSupplyDemandPredictions, generateMockSupplyDemandAlerts } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    console.error('[SSE] Error generating supply-demand data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interval = parseInt(searchParams.get('interval') || '5000', 10);

  console.log('[SSE] Supply-demand connection established, interval:', interval);

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const data = fetchSupplyDemandData();
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
        console.log('[SSE] Initial supply-demand data sent');
      } catch (error) {
        console.error('[SSE] Error sending initial data:', error);
      }

      // Set up interval for updates
      intervalId = setInterval(async () => {
        if (isClosed) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        try {
          const data = fetchSupplyDemandData();
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          console.log('[SSE] Supply-demand update sent');
        } catch (error) {
          console.error('[SSE] Error in interval:', error);
          if (intervalId) clearInterval(intervalId);
          try {
            controller.close();
          } catch (e) {
            // Controller might already be closed
          }
        }
      }, interval);
    },
    cancel() {
      console.log('[SSE] Supply-demand stream cancelled');
      isClosed = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
