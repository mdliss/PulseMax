/**
 * SSE Stream Utilities
 * Helpers for creating and managing Server-Sent Events streams
 */

export interface SSEMessage {
  id?: string;
  event?: string;
  data: any;
  retry?: number;
}

export class SSEStream {
  private encoder = new TextEncoder();

  /**
   * Format data as SSE message
   */
  formatMessage(message: SSEMessage): string {
    let formatted = '';

    if (message.id) {
      formatted += `id: ${message.id}\n`;
    }

    if (message.event) {
      formatted += `event: ${message.event}\n`;
    }

    if (message.retry) {
      formatted += `retry: ${message.retry}\n`;
    }

    const data = typeof message.data === 'string'
      ? message.data
      : JSON.stringify(message.data);

    formatted += `data: ${data}\n\n`;

    return formatted;
  }

  /**
   * Encode message as Uint8Array
   */
  encode(message: SSEMessage): Uint8Array {
    return this.encoder.encode(this.formatMessage(message));
  }

  /**
   * Create SSE headers
   */
  static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    };
  }

  /**
   * Create a heartbeat message to keep connection alive
   */
  static heartbeat(): SSEMessage {
    return {
      event: 'heartbeat',
      data: { timestamp: new Date().toISOString() }
    };
  }
}

/**
 * Create an SSE stream with interval-based updates
 */
export function createIntervalStream<T>(
  getData: () => Promise<T> | T,
  intervalMs: number = 5000,
  options?: {
    heartbeatInterval?: number;
    onError?: (error: Error) => void;
  }
): ReadableStream {
  const sseStream = new SSEStream();
  let intervalId: NodeJS.Timeout | null = null;
  let heartbeatId: NodeJS.Timeout | null = null;
  let isActive = true;

  return new ReadableStream({
    async start(controller) {
      try {
        // Send initial data immediately
        const initialData = await getData();

        // Check if stream is still active before enqueuing
        if (isActive) {
          try {
            controller.enqueue(
              sseStream.encode({
                event: 'initial',
                data: initialData,
              })
            );
          } catch (enqueueError) {
            console.error('Failed to enqueue initial data:', enqueueError);
            isActive = false;
            return;
          }
        }

        // Set up interval for updates
        intervalId = setInterval(async () => {
          if (!isActive) return;

          try {
            const data = await getData();
            if (isActive) {
              controller.enqueue(
                sseStream.encode({
                  event: 'update',
                  data,
                  id: Date.now().toString(),
                })
              );
            }
          } catch (error) {
            console.error('SSE interval error:', error);
            options?.onError?.(error as Error);
          }
        }, intervalMs);

        // Set up heartbeat (default 30 seconds)
        const heartbeatInterval = options?.heartbeatInterval || 30000;
        heartbeatId = setInterval(() => {
          if (isActive) {
            try {
              controller.enqueue(sseStream.encode(SSEStream.heartbeat()));
            } catch (error) {
              // Heartbeat failed, stream likely closed
              isActive = false;
            }
          }
        }, heartbeatInterval);

      } catch (error) {
        console.error('SSE start error:', error);
        options?.onError?.(error as Error);
        isActive = false;
        try {
          controller.error(error);
        } catch {
          // Controller already closed
        }
      }
    },

    cancel() {
      // Clean up intervals when client disconnects
      isActive = false;
      if (intervalId) clearInterval(intervalId);
      if (heartbeatId) clearInterval(heartbeatId);
      console.log('SSE stream closed');
    },
  });
}

/**
 * Create an SSE stream with event-based updates
 */
export function createEventStream(
  subscribe: (emit: (data: any) => void) => () => void
): ReadableStream {
  const sseStream = new SSEStream();
  let unsubscribe: (() => void) | null = null;
  let heartbeatId: NodeJS.Timeout | null = null;
  let isActive = true;

  return new ReadableStream({
    start(controller) {
      // Emit function for subscribers
      const emit = (data: any) => {
        if (isActive) {
          try {
            controller.enqueue(
              sseStream.encode({
                event: 'update',
                data,
                id: Date.now().toString(),
              })
            );
          } catch (error) {
            console.error('Failed to enqueue event data:', error);
            isActive = false;
          }
        }
      };

      // Subscribe to events
      unsubscribe = subscribe(emit);

      // Set up heartbeat
      heartbeatId = setInterval(() => {
        if (isActive) {
          try {
            controller.enqueue(sseStream.encode(SSEStream.heartbeat()));
          } catch (error) {
            // Heartbeat failed, stream likely closed
            isActive = false;
          }
        }
      }, 30000);
    },

    cancel() {
      // Clean up when client disconnects
      isActive = false;
      if (unsubscribe) unsubscribe();
      if (heartbeatId) clearInterval(heartbeatId);
      console.log('SSE event stream closed');
    },
  });
}
