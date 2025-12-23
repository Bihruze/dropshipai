/**
 * SerpAPI Service - Google Shopping Results
 *
 * Free tier: 100 searches/month
 * Sign up: https://serpapi.com
 */

interface SerpApiProduct {
  position: number;
  title: string;
  link: string;
  product_link?: string;
  source: string;
  price: string;
  extracted_price: number;
  rating?: number;
  reviews?: number;
  thumbnail: string;
  delivery?: string;
}

interface SerpApiResponse {
  shopping_results?: SerpApiProduct[];
  error?: string;
}

export interface GoogleProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  source: string;
  url: string;
  rating: number;
  reviews: number;
  delivery: string;
}

export async function searchGoogleShopping(params: {
  query: string;
  apiKey: string;
  limit?: number;
}): Promise<{ success: boolean; data: GoogleProduct[]; error?: string }> {
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_shopping');
    url.searchParams.set('q', params.query);
    url.searchParams.set('api_key', params.apiKey);
    url.searchParams.set('num', String(params.limit || 20));
    url.searchParams.set('gl', 'us'); // US market

    const response = await fetch(url.toString());
    const data: SerpApiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const products: GoogleProduct[] = (data.shopping_results || []).map((item, idx) => ({
      id: `google-${idx}-${Date.now()}`,
      title: item.title,
      price: item.extracted_price || 0,
      image: item.thumbnail,
      source: item.source,
      url: item.link || item.product_link || '',
      rating: item.rating || 0,
      reviews: item.reviews || 0,
      delivery: item.delivery || 'Varies',
    }));

    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}
