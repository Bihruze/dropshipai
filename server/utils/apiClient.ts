// Generic API client utility with retry logic and rate limiting

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface RateLimiter {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

const rateLimiters: Map<string, RateLimiter> = new Map();

function getRateLimiter(key: string, maxTokens = 40, refillRate = 2): RateLimiter {
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, {
      tokens: maxTokens,
      lastRefill: Date.now(),
      maxTokens,
      refillRate,
    });
  }
  return rateLimiters.get(key)!;
}

async function waitForToken(limiter: RateLimiter): Promise<void> {
  const now = Date.now();
  const timePassed = (now - limiter.lastRefill) / 1000;
  limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + timePassed * limiter.refillRate);
  limiter.lastRefill = now;

  if (limiter.tokens < 1) {
    const waitTime = ((1 - limiter.tokens) / limiter.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    limiter.tokens = 1;
  }

  limiter.tokens -= 1;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
  rateLimitKey?: string
): Promise<T> {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Apply rate limiting if key provided
  if (rateLimitKey) {
    const limiter = getRateLimiter(rateLimitKey);
    await waitForToken(limiter);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (lastError.message.includes('HTTP 4')) {
        throw lastError;
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed');
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}
