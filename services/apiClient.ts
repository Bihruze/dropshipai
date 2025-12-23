// Frontend API Client for DropshipAI Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // ============ AUTH ============

  async login(email: string, name?: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const result = await this.request<ApiResponse<{ user: any; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async register(email: string, name: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const result = await this.request<ApiResponse<{ user: any; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  logout(): void {
    this.setToken(null);
  }

  // ============ SETTINGS ============

  async getSettings(): Promise<ApiResponse<any>> {
    return this.request('/settings');
  }

  async updateSettings(settings: Record<string, any>): Promise<ApiResponse<any>> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async testTelegram(): Promise<ApiResponse<void>> {
    return this.request('/settings/test-telegram', { method: 'POST' });
  }

  // ============ SHOPIFY ============

  async testShopify(): Promise<ApiResponse<{ shop: string }>> {
    return this.request('/shopify/test', { method: 'POST' });
  }

  async getShopifyOrders(params: {
    status?: string;
    fulfillment_status?: string;
    limit?: number;
  } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/shopify/orders?${query}`);
  }

  async getShopifyOrder(orderId: number): Promise<ApiResponse<any>> {
    return this.request(`/shopify/orders/${orderId}`);
  }

  async fulfillShopifyOrder(orderId: number, trackingNumber: string, trackingCompany: string): Promise<ApiResponse<void>> {
    return this.request(`/shopify/orders/${orderId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify({ trackingNumber, trackingCompany }),
    });
  }

  async getShopifyProducts(params: { limit?: number; status?: string } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/shopify/products?${query}`);
  }

  async createShopifyProduct(product: any): Promise<ApiResponse<any>> {
    return this.request('/shopify/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateShopifyProduct(productId: number, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/shopify/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteShopifyProduct(productId: number): Promise<ApiResponse<void>> {
    return this.request(`/shopify/products/${productId}`, { method: 'DELETE' });
  }

  // ============ ETSY ============

  async getEtsyAuthUrl(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    return this.request('/etsy/auth-url');
  }

  async testEtsy(): Promise<ApiResponse<{ shop: string }>> {
    return this.request('/etsy/test', { method: 'POST' });
  }

  async getEtsyReceipts(params: { limit?: number; offset?: number } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/etsy/receipts?${query}`);
  }

  async shipEtsyOrder(receiptId: number, trackingCode: string, carrierName: string): Promise<ApiResponse<void>> {
    return this.request(`/etsy/receipts/${receiptId}/ship`, {
      method: 'POST',
      body: JSON.stringify({ trackingCode, carrierName }),
    });
  }

  async getEtsyListings(params: { limit?: number; offset?: number; state?: string } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/etsy/listings?${query}`);
  }

  async createEtsyListing(listing: any): Promise<ApiResponse<any>> {
    return this.request('/etsy/listings', {
      method: 'POST',
      body: JSON.stringify(listing),
    });
  }

  async updateEtsyInventory(listingId: number, quantity: number): Promise<ApiResponse<void>> {
    return this.request(`/etsy/listings/${listingId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // ============ CJ DROPSHIPPING ============

  async testCJ(): Promise<ApiResponse<{ connected: boolean }>> {
    return this.request('/cj/test', { method: 'POST' });
  }

  async searchCJProducts(params: {
    keyword?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/cj/products/search?${query}`);
  }

  async getCJProduct(productId: string): Promise<ApiResponse<any>> {
    return this.request(`/cj/products/${productId}`);
  }

  async getCJCategories(): Promise<ApiResponse<any[]>> {
    return this.request('/cj/categories');
  }

  async checkCJStock(variantId: string): Promise<ApiResponse<{ stock: number; available: boolean }>> {
    return this.request(`/cj/stock/${variantId}`);
  }

  async createCJOrder(orderData: {
    orderNumber: string;
    shippingZip: string;
    shippingCountry: string;
    shippingCountryCode: string;
    shippingProvince: string;
    shippingCity: string;
    shippingAddress: string;
    shippingCustomerName: string;
    shippingPhone: string;
    products: Array<{ vid: string; quantity: number }>;
  }): Promise<ApiResponse<any>> {
    return this.request('/cj/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getCJOrders(params: { status?: string; page?: number; limit?: number } = {}): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/cj/orders?${query}`);
  }

  async getCJTracking(orderId: string): Promise<ApiResponse<{
    trackingNumber: string;
    carrier: string;
    trackingUrl: string;
    events: Array<{ date: string; status: string; location: string }>;
  }>> {
    return this.request(`/cj/tracking/${orderId}`);
  }

  async calculateCJShipping(endCountry: string, weight: number): Promise<ApiResponse<any[]>> {
    return this.request('/cj/shipping/calculate', {
      method: 'POST',
      body: JSON.stringify({ endCountry, weight }),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
