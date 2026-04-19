import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });

export interface GeneratedImage {
  url: string;
  prompt: string;
  enhancedPrompt: string;
  timestamp: number;
}

export async function enhancePrompt(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Enhance the following text prompt into a highly descriptive, artistic, and visually rich prompt for an AI image generator. Focus on lighting, textures, style, and composition. Keep it to 2-3 sentences.
    
    User Prompt: ${prompt}`,
    config: {
      temperature: 0.7,
    },
  });

  return response.text || prompt;
}

export async function generateImage(prompt: string, enhancedPrompt: string): Promise<GeneratedImage> {
  // We use gemini-2.5-flash-image for general-purpose image generation
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: enhancedPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  let imageUrl = "";
  
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        imageUrl = `data:image/png;base64,${base64Data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image was generated. Please try a different prompt.");
  }

  return {
    url: imageUrl,
    prompt,
    enhancedPrompt,
    timestamp: Date.now(),
  };
}
