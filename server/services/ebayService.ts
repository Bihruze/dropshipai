/**
 * eBay Browse API Service
 *
 * API Documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html
 * Base URL: https://api.ebay.com/buy/browse/v1
 *
 * Features:
 * - Product search
 * - Item details
 * - Category browsing
 */

import { apiRequest, buildQueryString } from '../utils/apiClient.js';

interface EbayConfig {
  clientId: string;
  clientSecret: string;
  sandbox?: boolean;
}

interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface EbayItemSummary {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  thumbnailImages?: Array<{ imageUrl: string }>;
  itemWebUrl: string;
  seller?: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  condition?: string;
  conditionId?: string;
  categories?: Array<{ categoryId: string; categoryName: string }>;
  shippingOptions?: Array<{
    shippingCostType: string;
    shippingCost?: { value: string; currency: string };
  }>;
  itemLocation?: {
    country: string;
    postalCode?: string;
  };
  buyingOptions?: string[];
  itemAffiliateWebUrl?: string;
}

interface EbaySearchResponse {
  href: string;
  total: number;
  next?: string;
  limit: number;
  offset: number;
  itemSummaries?: EbayItemSummary[];
}

export interface EbayProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  condition: string;
  seller: {
    name: string;
    rating: number;
    feedbackScore: number;
  };
  shipping: string;
  location: string;
  category: string;
}

export class EbayService {
  private baseUrl: string;
  private authUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private config: EbayConfig) {
    this.baseUrl = config.sandbox
      ? 'https://api.sandbox.ebay.com/buy/browse/v1'
      : 'https://api.ebay.com/buy/browse/v1';
    this.authUrl = config.sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    const now = new Date();

    if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Auth failed: ${error}`);
      }

      const data: EbayTokenResponse = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(now.getTime() + (data.expires_in - 60) * 1000);

      return this.accessToken;
    } catch (error) {
      throw new Error(`eBay Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search products on eBay
   */
  async searchProducts(params: {
    keyword: string;
    category?: string;
    limit?: number;
    offset?: number;
    minPrice?: number;
    maxPrice?: number;
    condition?: 'NEW' | 'USED' | 'UNSPECIFIED';
  }): Promise<{
    success: boolean;
    data: EbayProduct[];
    total: number;
    error?: string;
  }> {
    try {
      const token = await this.getAccessToken();

      const queryParams: Record<string, string> = {
        q: params.keyword,
        limit: String(params.limit || 20),
        offset: String(params.offset || 0),
      };

      if (params.category) {
        queryParams.category_ids = params.category;
      }

      if (params.minPrice || params.maxPrice) {
        const priceFilter = [];
        if (params.minPrice) priceFilter.push(`price:[${params.minPrice}]`);
        if (params.maxPrice) priceFilter.push(`price:[..${params.maxPrice}]`);
        queryParams.filter = priceFilter.join(',');
      }

      if (params.condition) {
        queryParams.filter = queryParams.filter
          ? `${queryParams.filter},conditionIds:{${params.condition === 'NEW' ? '1000' : '3000'}}`
          : `conditionIds:{${params.condition === 'NEW' ? '1000' : '3000'}}`;
      }

      const query = new URLSearchParams(queryParams).toString();

      const response = await fetch(`${this.baseUrl}/item_summary/search?${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Search failed: ${error}`);
      }

      const data: EbaySearchResponse = await response.json();

      const products: EbayProduct[] = (data.itemSummaries || []).map(item => ({
        id: item.itemId,
        title: item.title,
        price: parseFloat(item.price?.value || '0'),
        currency: item.price?.currency || 'USD',
        image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
        url: item.itemWebUrl,
        condition: item.condition || 'Unknown',
        seller: {
          name: item.seller?.username || 'Unknown',
          rating: parseFloat(item.seller?.feedbackPercentage || '0'),
          feedbackScore: item.seller?.feedbackScore || 0,
        },
        shipping: item.shippingOptions?.[0]?.shippingCost?.value
          ? `$${item.shippingOptions[0].shippingCost.value}`
          : 'Free',
        location: item.itemLocation?.country || 'Unknown',
        category: item.categories?.[0]?.categoryName || 'General',
      }));

      return {
        success: true,
        data: products,
        total: data.total || 0,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Get item details
   */
  async getItem(itemId: string): Promise<{
    success: boolean;
    data?: EbayProduct;
    error?: string;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/item/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      });

      if (!response.ok) {
        throw new Error('Item not found');
      }

      const item = await response.json();

      return {
        success: true,
        data: {
          id: item.itemId,
          title: item.title,
          price: parseFloat(item.price?.value || '0'),
          currency: item.price?.currency || 'USD',
          image: item.image?.imageUrl || '',
          url: item.itemWebUrl,
          condition: item.condition || 'Unknown',
          seller: {
            name: item.seller?.username || 'Unknown',
            rating: parseFloat(item.seller?.feedbackPercentage || '0'),
            feedbackScore: item.seller?.feedbackScore || 0,
          },
          shipping: 'See listing',
          location: item.itemLocation?.country || 'Unknown',
          category: item.categoryPath || 'General',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get item',
      };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getAccessToken();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

export function createEbayService(config: EbayConfig): EbayService {
  return new EbayService(config);
}
