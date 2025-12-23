import { GoogleGenAI, Type } from "@google/genai";

// Types for API responses
export interface ProductTrend {
  name: string;
  demandScore: number;
  audience: string;
  sellingPoints: string[];
}

export interface ProductListing {
  seoTitle: string;
  description: string;
  benefits: string[];
  keywords: string[];
}

// Singleton AI client
let aiClient: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const researchProductTrends = async (niche: string): Promise<ProductTrend[]> => {
  if (!niche || niche.trim() === '') {
    throw new Error('Niche parameter is required');
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the current dropshipping market for the niche: ${niche}.
      Provide a list of 5 trending products with estimated demand score (0-100),
      target audience, and selling points. Return in structured JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              demandScore: { type: Type.NUMBER },
              audience: { type: Type.STRING },
              sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "demandScore", "audience", "sellingPoints"]
          }
        }
      }
    });

    if (!response.text) {
      console.warn('Empty response from Gemini API for product trends');
      return [];
    }

    return JSON.parse(response.text) as ProductTrend[];
  } catch (error) {
    console.error('Failed to research product trends:', error);
    throw new Error(`Product research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateListing = async (title: string, features: string[]): Promise<ProductListing> => {
  if (!title || title.trim() === '') {
    throw new Error('Title parameter is required');
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a high-converting Shopify-style product listing.
      Title: ${title}
      Features: ${features.join(', ')}
      Include:
      1. An SEO-optimized title
      2. A persuasive description
      3. Three key emotional benefits
      4. Target Keywords`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["seoTitle", "description", "benefits", "keywords"]
        }
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini API');
    }

    return JSON.parse(response.text) as ProductListing;
  } catch (error) {
    console.error('Failed to generate listing:', error);
    throw new Error(`Listing generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateProductImage = async (prompt: string): Promise<string | null> => {
  if (!prompt || prompt.trim() === '') {
    throw new Error('Prompt parameter is required');
  }

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A professional studio product photography of ${prompt}, clean white background, high resolution, soft lighting, commercial quality.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    console.warn('No image data in Gemini response');
    return null;
  } catch (error) {
    console.error('Failed to generate product image:', error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
