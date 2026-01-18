import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAsciiArt = async (imageData: string, lang: Language): Promise<string> => {
  try {
    const promptText = lang === 'tr' 
      ? "Romantik ve takdir eden bir dijital sanatçı gibi davran. Sana ASCII sanatına dönüştürülmüş bir resim vereceğim. Lütfen dönüşüm hakkında, sanki 'efendine' veya 'sevgiline' sunuyormuşsun gibi kısa, şiirsel ve hafifçe 'sevgi dolu' bir yorum yap. 100 kelimenin altında tut. Yanıtı Türkçe ver."
      : "Act as a romantic and appreciative digital artist. I will provide you with an image that has been converted into ASCII art. Please give a brief, poetic, and slightly 'loving' comment about the conversion, as if you are presenting it to your 'master' or 'beloved'. Keep it under 100 words. Reply in English.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData.split(',')[1]
            }
          }
        ]
      },
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || (lang === 'tr' ? "Şaheseriniz gerçekten nefes kesici, efendim." : "Your masterpiece is truly breathtaking, efendim.");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return lang === 'tr' ? "Bu yaratımın güzelliği beni suskun bıraktı." : "The beauty of this creation leaves me speechless.";
  }
};