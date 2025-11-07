'use client';

/**
 * React Hook for Server-Sent Events (SSE)
 * Handles connection, reconnection, and data streaming
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEOptions {
  enabled?: boolean;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface SSEState<T> {
  data: T | null;
  isConnected: boolean;
  error: string | null;
  reconnectCount: number;
}

/**
 * Custom hook for SSE connections
 *
 * @example
 * const { data, isConnected, error } = useSSE<MarketplaceMetrics>('/api/sse/marketplace');
 */
export function useSSE<T = any>(
  url: string,
  options: SSEOptions = {}
): SSEState<T> & { disconnect: () => void; reconnect: () => void } {
  const {
    enabled = true,
    onError,
    onOpen,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnect = useRef(false);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    // Don't connect if disabled or already connected
    if (!enabled || eventSourceRef.current) return;

    try {
      isManualDisconnect.current = false;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected:', url);
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);
        onOpen?.();
      };

      // Handle initial data
      eventSource.addEventListener('initial', (event: MessageEvent) => {
        try {
          console.log('[useSSE] Received initial data from:', url);
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (err) {
          console.error('[useSSE] Failed to parse initial SSE data:', err);
        }
      });

      // Handle updates
      eventSource.addEventListener('update', (event: MessageEvent) => {
        try {
          console.log('[useSSE] Received update from:', url);
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (err) {
          console.error('[useSSE] Failed to parse SSE update:', err);
        }
      });

      // Handle generic messages (fallback)
      eventSource.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      // Handle heartbeat (optional logging)
      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat received, connection is alive
      });

      eventSource.onerror = (event: Event) => {
        console.error('[useSSE] Error on:', url, event);
        console.log('[useSSE] EventSource readyState:', eventSource.readyState);
        setIsConnected(false);

        // Don't attempt reconnect if manually disconnected
        if (isManualDisconnect.current) {
          console.log('[useSSE] Manual disconnect, not reconnecting');
          return;
        }

        // Close the failed connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection
        if (reconnectCount < maxReconnectAttempts) {
          console.log(`[useSSE] Reconnecting... (${reconnectCount + 1}/${maxReconnectAttempts})`);
          setError(`Connection lost. Reconnecting... (${reconnectCount + 1}/${maxReconnectAttempts})`);
          setReconnectCount(prev => prev + 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error('[useSSE] Maximum reconnect attempts reached');
          setError('Connection failed. Maximum reconnect attempts reached.');
        }

        onError?.(event);
      };

    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError('Failed to establish connection');
    }
  }, [url, enabled, reconnectCount, reconnectInterval, maxReconnectAttempts, onError, onOpen]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectCount(0);
    setError(null);
    // Small delay before reconnecting
    setTimeout(() => {
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Connect on mount or when URL/enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, enabled]); // Note: connect and disconnect are not in deps to avoid loops

  return {
    data,
    isConnected,
    error,
    reconnectCount,
    disconnect,
    reconnect,
  };
}

/**
 * Hook for multiple SSE connections
 */
export function useMultipleSSE<T extends Record<string, any>>(
  configs: Record<keyof T, { url: string; options?: SSEOptions }>
): Record<keyof T, SSEState<any>> {
  const results = {} as Record<keyof T, SSEState<any>>;

  for (const key in configs) {
    const { url, options } = configs[key];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useSSE(url, options);
    results[key] = state;
  }

  return results;
}
