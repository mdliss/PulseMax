/**
 * Rails API Client for data ingestion
 */

const RAILS_API_URL = process.env.RAILS_API_URL || 'http://localhost:3001';
const RAILS_API_KEY = process.env.RAILS_API_KEY || '';

interface RailsApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    perPage: number;
  };
}

class RailsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'RailsApiError';
  }
}

export class RailsClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl = RAILS_API_URL, apiKey = RAILS_API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<RailsApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new RailsApiError(
          `Rails API error: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof RailsApiError) {
        throw error;
      }
      throw new RailsApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Session endpoints
  async getSessions(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('start_date', params.startDate);
    if (params?.endDate) queryParams.set('end_date', params.endDate);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.perPage) queryParams.set('per_page', params.perPage.toString());

    const query = queryParams.toString();
    const endpoint = `/api/sessions${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  async getSession(sessionId: string) {
    return this.request<any>(`/api/sessions/${sessionId}`);
  }

  // Customer endpoints
  async getCustomers(params?: {
    status?: string;
    page?: number;
    perPage?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.perPage) queryParams.set('per_page', params.perPage.toString());

    const query = queryParams.toString();
    const endpoint = `/api/customers${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  async getCustomer(customerId: string) {
    return this.request<any>(`/api/customers/${customerId}`);
  }

  // Tutor endpoints
  async getTutors(params?: {
    status?: string;
    page?: number;
    perPage?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.perPage) queryParams.set('per_page', params.perPage.toString());

    const query = queryParams.toString();
    const endpoint = `/api/tutors${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  async getTutor(tutorId: string) {
    return this.request<any>(`/api/tutors/${tutorId}`);
  }

  // Booking endpoints
  async getBookings(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    perPage?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('start_date', params.startDate);
    if (params?.endDate) queryParams.set('end_date', params.endDate);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.perPage) queryParams.set('per_page', params.perPage.toString());

    const query = queryParams.toString();
    const endpoint = `/api/bookings${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  // Inbound calls endpoints
  async getInboundCalls(params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    page?: number;
    perPage?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('start_date', params.startDate);
    if (params?.endDate) queryParams.set('end_date', params.endDate);
    if (params?.customerId) queryParams.set('customer_id', params.customerId);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.perPage) queryParams.set('per_page', params.perPage.toString());

    const query = queryParams.toString();
    const endpoint = `/api/inbound_calls${query ? `?${query}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  // Health check
  async healthCheck() {
    try {
      await this.request('/api/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const railsClient = new RailsClient();
