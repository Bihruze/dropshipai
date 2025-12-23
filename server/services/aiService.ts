/**
 * AI Service - Claude API Integration
 * Real AI responses for dropshipping automation
 */

interface AIConfig {
  apiKey: string;
  model?: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-haiku-20240307'; // Fast & cheap
  }

  private async callClaude(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data: ClaudeResponse = await response.json();
    return data.content[0]?.text || '';
  }

  // Trend Analysis
  async analyzeTrend(product: string): Promise<string> {
    const systemPrompt = `Sen bir dropshipping ve e-ticaret uzmanısın. Türkçe yanıt ver.
Ürün trendlerini analiz et ve şunları belirt:
- Arama hacmi tahmini
- Büyüme trendi
- Rekabet seviyesi
- En iyi satış dönemi
- Öneri ve stratejiler

Kısa ve öz bilgiler ver, emoji kullan.`;

    return this.callClaude(systemPrompt, `"${product}" ürünü/nişi için trend analizi yap.`);
  }

  // Product Research
  async researchProduct(product: string): Promise<string> {
    const systemPrompt = `Sen bir dropshipping ürün araştırma uzmanısın. Türkçe yanıt ver.
Ürün değerlendirmesi yap ve şunları belirt:
- Tahmini maliyet aralığı (Çin'den)
- Önerilen satış fiyatı
- Tahmini kar marjı
- Kargo süresi
- Potansiyel riskler
- Genel skor (100 üzerinden)

Gerçekçi tahminler ver.`;

    return this.callClaude(systemPrompt, `"${product}" ürünü için dropshipping değerlendirmesi yap.`);
  }

  // Content Generation
  async generateContent(product: string, type: 'title' | 'description' | 'bullets' | 'full'): Promise<string> {
    const prompts: Record<string, string> = {
      title: `E-ticaret için SEO uyumlu, dikkat çekici ürün başlığı yaz. 60-80 karakter. Sadece başlığı ver.`,
      description: `E-ticaret için ikna edici, SEO uyumlu ürün açıklaması yaz. 150-200 kelime. Özellikleri ve faydaları vurgula.`,
      bullets: `Ürün için 5 adet bullet point (madde işareti) yaz. Her biri bir özellik veya fayda belirtsin. Kısa ve etkili.`,
      full: `Tam ürün içeriği oluştur:
1. SEO uyumlu başlık
2. Kısa açıklama (2-3 cümle)
3. Detaylı açıklama (150 kelime)
4. 5 bullet point
5. 10 SEO etiketi`,
    };

    const systemPrompt = `Sen bir e-ticaret içerik yazarısın. Türkçe yaz.
${prompts[type]}
Satış odaklı, ikna edici bir dil kullan.`;

    return this.callClaude(systemPrompt, `"${product}" için içerik oluştur.`);
  }

  // Price Optimization
  async optimizePrice(product: string, cost?: number): Promise<string> {
    const systemPrompt = `Sen bir e-ticaret fiyatlandırma uzmanısın. Türkçe yanıt ver.
Fiyat stratejisi öner ve şunları belirt:
- Tahmini rakip fiyat aralığı
- Önerilen giriş fiyatı
- Premium fiyat seçeneği
- Kampanya fiyatı
- Fiyatlandırma stratejisi önerisi

${cost ? `Maliyet: $${cost}` : 'Maliyet bilinmiyor, tahmin yap.'}`;

    return this.callClaude(systemPrompt, `"${product}" için fiyat optimizasyonu yap.`);
  }

  // Competitor Analysis
  async analyzeCompetitors(product: string): Promise<string> {
    const systemPrompt = `Sen bir e-ticaret rekabet analizi uzmanısın. Türkçe yanıt ver.
Rekabet analizi yap ve şunları belirt:
- Ana rakip türleri (Amazon, yerel mağazalar, vb.)
- Rakip avantajları
- Senin potansiyel avantajların
- Farklılaşma stratejileri
- Pazara giriş önerileri`;

    return this.callClaude(systemPrompt, `"${product}" için rekabet analizi yap.`);
  }

  // Marketing Copy
  async generateMarketingCopy(product: string, platform: 'facebook' | 'google' | 'instagram' | 'email'): Promise<string> {
    const platformPrompts: Record<string, string> = {
      facebook: 'Facebook reklam metni yaz. Dikkat çekici başlık, kısa açıklama ve call-to-action içersin.',
      google: 'Google Ads metni yaz. Başlık (30 karakter), açıklama (90 karakter) formatında.',
      instagram: 'Instagram post caption yaz. Emoji kullan, hashtag öner, engaging bir dil kullan.',
      email: 'E-posta pazarlama metni yaz. Konu satırı, önizleme metni ve ana içerik.',
    };

    const systemPrompt = `Sen bir dijital pazarlama uzmanısın. Türkçe yaz.
${platformPrompts[platform]}
Satış odaklı, ikna edici ol.`;

    return this.callClaude(systemPrompt, `"${product}" için ${platform} reklamı/içeriği oluştur.`);
  }

  // SEO Optimization
  async optimizeSEO(product: string): Promise<string> {
    const systemPrompt = `Sen bir e-ticaret SEO uzmanısın. Türkçe yanıt ver.
SEO optimizasyonu öner:
- Ana anahtar kelimeler (5 adet)
- Uzun kuyruk anahtar kelimeler (5 adet)
- Meta başlık önerisi
- Meta açıklama önerisi
- URL yapısı önerisi
- İçerik stratejisi`;

    return this.callClaude(systemPrompt, `"${product}" için SEO optimizasyonu yap.`);
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.callClaude('Test', 'Merhaba, bu bir test mesajıdır. Sadece "OK" yaz.');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

export function createAIService(apiKey: string): AIService {
  return new AIService({ apiKey });
}
