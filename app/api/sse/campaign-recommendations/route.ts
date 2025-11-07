import { NextRequest } from 'next/server';
import { generateMockCampaignRecommendations } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fetchCampaignData() {
  try {
    // Generate mock data directly
    const data = generateMockCampaignRecommendations();
    return data;
  } catch (error) {
    console.error('[SSE] Error generating campaign data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  console.log('[SSE] Campaign recommendations SSE connection established');

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const data = fetchCampaignData();
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
        console.log('[SSE] Initial campaign data sent');
      } catch (error) {
        console.error('[SSE] Error sending initial data:', error);
        controller.error(error);
        return;
      }

      // Set up interval for updates
      const interval = 5000; // 5 seconds
      intervalId = setInterval(() => {
        try {
          const data = fetchCampaignData();
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          console.log('[SSE] Campaign update sent');
        } catch (error) {
          console.error('[SSE] Error in interval:', error);
          clearInterval(intervalId);
          controller.error(error);
        }
      }, interval);
    },

    cancel() {
      console.log('[SSE] Campaign recommendations stream cancelled');
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
