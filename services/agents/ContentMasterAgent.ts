// =====================================================
// DROPSHIPAI - ContentMaster Agent
// Generates high-converting product content
// =====================================================

import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentMessage, GeneratedContent, ScoutedProduct } from './types';

export class ContentMasterAgent extends BaseAgent {
  constructor() {
    super('content-master', 'ContentMaster', [
      'Generate SEO titles',
      'Write product descriptions',
      'Create bullet points',
      'Generate social media content',
      'Translate to multiple languages',
      'A/B test variations',
    ]);
  }

  protected handleMessage(message: AgentMessage): void {
    if (message.type === 'request' && message.from === 'product-scout') {
      this.log(`Received products to create content for`);
    }
  }

  protected async performTask(task: AgentTask): Promise<any> {
    switch (task.type) {
      case 'generate_content':
        return this.generateContent(task as any);
      case 'translate':
        return this.translateContent(task as any);
      case 'generate_variations':
        return this.generateVariations(task as any);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async execute(input: {
    product?: ScoutedProduct;
    products?: ScoutedProduct[];
    style?: 'premium' | 'value' | 'conversion-focused';
    languages?: string[];
  }): Promise<GeneratedContent | GeneratedContent[]> {
    const products = input.products || (input.product ? [input.product] : []);

    if (products.length === 0) {
      throw new Error('No products provided for content generation');
    }

    if (products.length === 1) {
      const task = this.createTask(
        'generate_content',
        `Creating content for: ${products[0].title}`,
        'medium'
      );
      await this.think(`Crafting compelling content for "${products[0].title}"...`);
      return this.executeTask({ ...task, product: products[0], style: input.style || 'conversion-focused' } as any);
    }

    // Multiple products
    const results: GeneratedContent[] = [];
    for (const product of products) {
      const content = await this.generateSingleContent(product, input.style || 'conversion-focused');
      results.push(content);
    }
    return results;
  }

  // ==================== CORE METHODS ====================

  private async generateContent(task: AgentTask & {
    product: ScoutedProduct;
    style: 'premium' | 'value' | 'conversion-focused';
  }): Promise<GeneratedContent> {
    const { product, style } = task;

    this.sendMessage('user', 'progress', `Generating content for "${product.title}"...`);
    this.updateProgress(10);

    // Generate title variations
    this.sendMessage('user', 'progress', 'Creating SEO-optimized titles...');
    const titles = await this.generateTitles(product, style);
    this.updateProgress(25);

    // Generate descriptions
    this.sendMessage('user', 'progress', 'Writing compelling descriptions...');
    const descriptions = await this.generateDescriptions(product, style);
    this.updateProgress(45);

    // Generate bullet points
    this.sendMessage('user', 'progress', 'Creating benefit-focused bullet points...');
    const bulletPoints = await this.generateBulletPoints(product, style);
    this.updateProgress(60);

    // Generate SEO keywords
    this.sendMessage('user', 'progress', 'Optimizing for search engines...');
    const seoKeywords = this.generateSEOKeywords(product);
    const metaDescription = this.generateMetaDescription(product, style);
    this.updateProgress(75);

    // Generate social media content
    this.sendMessage('user', 'progress', 'Creating social media content...');
    const socialMedia = await this.generateSocialMedia(product, style);
    this.updateProgress(90);

    // Generate email template
    const emailTemplate = this.generateEmailTemplate(product, style);
    this.updateProgress(100);

    const content: GeneratedContent = {
      productId: product.id,
      title: {
        original: product.title,
        seoOptimized: titles.seoOptimized,
        variations: titles.variations,
      },
      description: descriptions,
      bulletPoints,
      seoKeywords,
      metaDescription,
      socialMedia,
      emailTemplate,
    };

    this.sendMessage('user', 'info', `Content generated successfully for "${product.title}"!`);

    return content;
  }

  private async generateSingleContent(product: ScoutedProduct, style: string): Promise<GeneratedContent> {
    const task = this.createTask(
      'generate_content',
      `Creating content for: ${product.title}`,
      'medium'
    );
    return this.executeTask({ ...task, product, style } as any);
  }

  private async translateContent(task: AgentTask): Promise<any> {
    // Implementation for translation
    return {};
  }

  private async generateVariations(task: AgentTask): Promise<any> {
    // Implementation for A/B variations
    return {};
  }

  // ==================== CONTENT GENERATORS ====================

  private async generateTitles(product: ScoutedProduct, style: string): Promise<{
    seoOptimized: string;
    variations: string[];
  }> {
    await this.simulateAICall();

    const baseTitle = product.title.replace(/[^\w\s]/g, '').trim();
    const keywords = this.extractKeywords(product);

    const templates = {
      premium: [
        `Premium ${baseTitle} - Luxury Quality`,
        `${baseTitle} Pro - Professional Grade`,
        `Exclusive ${baseTitle} | Free Shipping`,
      ],
      value: [
        `${baseTitle} - Best Value Deal`,
        `Affordable ${baseTitle} - Great Quality`,
        `${baseTitle} Sale - Limited Time Offer`,
      ],
      'conversion-focused': [
        `${baseTitle} - #1 Best Seller`,
        `${baseTitle} - 5-Star Rated | Fast Shipping`,
        `${baseTitle} - As Seen on TikTok`,
      ],
    };

    const variations = templates[style as keyof typeof templates] || templates['conversion-focused'];

    return {
      seoOptimized: `${baseTitle} - ${keywords[0]} | Free Shipping`,
      variations,
    };
  }

  private async generateDescriptions(product: ScoutedProduct, style: string): Promise<{
    short: string;
    long: string;
    html: string;
  }> {
    await this.simulateAICall();

    const benefits = this.generateBenefits(product, style);
    const features = this.generateFeatures(product);

    const short = `Discover the ${product.title.toLowerCase()} that everyone's talking about. ${benefits[0]} ${benefits[1]}`;

    const long = `
Introducing the ${product.title} - Your perfect solution for modern living.

${benefits.join(' ')}

What makes this product special:
${features.map(f => `• ${f}`).join('\n')}

Join thousands of satisfied customers who have already made the smart choice. Order now and experience the difference!

${product.rating >= 4.5 ? '⭐ Rated ' + product.rating.toFixed(1) + '/5 by our customers' : ''}
${product.sold >= 1000 ? '🔥 Over ' + product.sold.toLocaleString() + ' sold' : ''}
    `.trim();

    const html = `
<div class="product-description">
  <p class="intro"><strong>Introducing the ${product.title}</strong> - Your perfect solution for modern living.</p>

  <div class="benefits">
    ${benefits.map(b => `<p>✓ ${b}</p>`).join('')}
  </div>

  <h4>Key Features:</h4>
  <ul class="features">
    ${features.map(f => `<li>${f}</li>`).join('')}
  </ul>

  <div class="social-proof">
    ${product.rating >= 4.5 ? `<span class="rating">⭐ ${product.rating.toFixed(1)}/5</span>` : ''}
    ${product.sold >= 1000 ? `<span class="sold">🔥 ${product.sold.toLocaleString()}+ sold</span>` : ''}
  </div>
</div>
    `.trim();

    return { short, long, html };
  }

  private async generateBulletPoints(product: ScoutedProduct, style: string): Promise<string[]> {
    await this.simulateAICall();

    const basePoints = [
      `Premium quality materials built to last`,
      `Easy to use - perfect for beginners and experts`,
      `Compact design - perfect for home and travel`,
      `30-day money-back guarantee`,
      `Free worldwide shipping`,
    ];

    const styleSpecific = {
      premium: ['Luxury finish and premium feel', 'Exclusive design you won\'t find elsewhere'],
      value: ['Unbeatable price for this quality', 'Save money without compromising quality'],
      'conversion-focused': ['#1 choice of influencers', 'Limited stock - order now!'],
    };

    return [
      ...basePoints.slice(0, 3),
      ...(styleSpecific[style as keyof typeof styleSpecific] || styleSpecific['conversion-focused']),
    ];
  }

  private generateSEOKeywords(product: ScoutedProduct): string[] {
    const baseKeywords = this.extractKeywords(product);
    const modifiers = ['best', 'buy', 'cheap', 'premium', 'quality', 'online', '2024'];

    const keywords: string[] = [...baseKeywords];

    baseKeywords.slice(0, 3).forEach(keyword => {
      modifiers.slice(0, 2).forEach(mod => {
        keywords.push(`${mod} ${keyword}`);
      });
    });

    return keywords.slice(0, 15);
  }

  private generateMetaDescription(product: ScoutedProduct, style: string): string {
    const ctaMap = {
      premium: 'Experience luxury today.',
      value: 'Get yours at the best price.',
      'conversion-focused': 'Order now - limited stock!',
    };

    return `Shop ${product.title} - High quality, fast shipping. ${product.rating >= 4.5 ? `⭐ ${product.rating.toFixed(1)}/5 rated. ` : ''}${ctaMap[style as keyof typeof ctaMap] || ctaMap['conversion-focused']}`.slice(0, 155);
  }

  private async generateSocialMedia(product: ScoutedProduct, style: string): Promise<{
    instagram: string;
    facebook: string;
    tiktok: string;
  }> {
    await this.simulateAICall();

    const hashtags = this.generateHashtags(product);

    return {
      instagram: `✨ NEW DROP ✨\n\n${product.title}\n\nThe ${product.title.toLowerCase()} you've been waiting for is finally here! 🙌\n\n💫 Premium quality\n📦 Free shipping\n⭐ 5-star reviews\n\nTap link in bio to shop! 🛒\n\n${hashtags}`,

      facebook: `🔥 JUST DROPPED: ${product.title}\n\nWhy everyone's loving it:\n✓ Premium quality\n✓ Affordable price\n✓ Fast shipping\n\n${product.rating >= 4.5 ? `Rated ${product.rating.toFixed(1)}/5 by our customers!` : ''}\n\n👉 Shop now: [link]\n\nLimited stock available!`,

      tiktok: `POV: You finally got the ${product.title.toLowerCase()} everyone's been talking about 😍\n\n#${product.title.replace(/\s+/g, '')} #TikTokMadeMeBuyIt #ViralProduct #MustHave #Trending`,
    };
  }

  private generateEmailTemplate(product: ScoutedProduct, style: string): string {
    return `
Subject: 🔥 Just Dropped: ${product.title}

Hi [Name],

We're excited to introduce our latest product that's taking the market by storm!

**${product.title}**

${this.generateBenefits(product, style).slice(0, 2).join('\n')}

🎁 Special Launch Offer: Get FREE shipping on your order today!

[SHOP NOW]

Best regards,
The DropshipAI Team

P.S. This is a limited-time offer. Don't miss out!
    `.trim();
  }

  // ==================== HELPERS ====================

  private extractKeywords(product: ScoutedProduct): string[] {
    const words = product.title.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'to', 'of'];
    return words.filter(w => w.length > 2 && !stopWords.includes(w));
  }

  private generateBenefits(product: ScoutedProduct, style: string): string[] {
    const benefitTemplates = {
      premium: [
        'Experience unmatched quality and craftsmanship.',
        'Stand out with exclusive, premium design.',
        'Invest in something that lasts.',
      ],
      value: [
        'Get premium quality at an affordable price.',
        'Smart shoppers choose value without compromise.',
        'Why pay more when you can get the best for less?',
      ],
      'conversion-focused': [
        'Join thousands of happy customers.',
        'See why this is the #1 choice.',
        'Transform your life with one simple upgrade.',
      ],
    };

    return benefitTemplates[style as keyof typeof benefitTemplates] || benefitTemplates['conversion-focused'];
  }

  private generateFeatures(product: ScoutedProduct): string[] {
    return [
      'High-quality materials',
      'Modern, sleek design',
      'Easy to use and maintain',
      'Versatile for multiple uses',
      'Eco-friendly packaging',
    ];
  }

  private generateHashtags(product: ScoutedProduct): string {
    const base = ['#DropshippingLife', '#OnlineShopping', '#MustHave', '#TrendingNow', '#ShopNow'];
    const keywords = this.extractKeywords(product).slice(0, 3).map(k => `#${k}`);
    return [...keywords, ...base].slice(0, 10).join(' ');
  }

  private async simulateAICall(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  }
}

export default ContentMasterAgent;
