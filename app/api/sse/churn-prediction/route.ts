import { NextRequest } from 'next/server';
import { generateMockChurnPredictions } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fetchChurnData() {
  try {
    // Generate mock data directly
    const data = generateMockChurnPredictions();
    return data;
  } catch (error) {
    console.error('[SSE] Error generating churn data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  console.log('[SSE] Churn prediction SSE connection established');

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const data = fetchChurnData();
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
        console.log('[SSE] Initial churn data sent');
      } catch (error) {
        console.error('[SSE] Error sending initial data:', error);
        controller.error(error);
        return;
      }

      // Set up interval for updates
      const interval = 5000; // 5 seconds
      intervalId = setInterval(() => {
        try {
          const data = fetchChurnData();
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          console.log('[SSE] Churn update sent');
        } catch (error) {
          console.error('[SSE] Error in interval:', error);
          clearInterval(intervalId);
          controller.error(error);
        }
      }, interval);
    },

    cancel() {
      console.log('[SSE] Churn prediction stream cancelled');
      if (intervalId) {
        clearInterval(intervalId);
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
