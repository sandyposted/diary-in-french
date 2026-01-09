
import { GoogleGenAI, Type } from "@google/genai";
import { DiaryAnalysis } from "../types";

// Always use the API key directly from process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDiary = async (text: string): Promise<DiaryAnalysis> => {
  const model = "gemini-3-pro-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Translate the following diary entry into natural, expressive French. 
    Then, provide a detailed grammatical analysis and a structural breakdown:
    1. Grammar points (tenses, agreements).
    2. Specific verb conjugations used.
    3. Key vocabulary: List EVERY significant word used in the French translation. For each word, include its gender (if applicable), its meaning in Chinese, and its part of speech (pos).
    4. Fixed expressions or idioms used.
    5. Structural Breakdown: Provide a "segmentedText" array. Each segment must have:
       - "text": The French text segment.
       - "role": One of ['subject', 'object', 'predicate', 'preposition', 'modifier', 'connective', 'other'].
       - "meaning_cn": Meaning in Chinese.
       - "meaning_en": Meaning in English.
       - "grammar_info": Brief grammar explanation in English (e.g., "Direct object", "Main verb in passé composé").

    Rules for roles:
    - Subject (主语) and Object (宾语) -> roles 'subject' or 'object'.
    - Predicate (谓语) -> role 'predicate'.
    - Preposition (介词) -> role 'preposition'.
    - Others as 'modifier', 'connective', or 'other'.

    Ensure that joining all "text" fields in "segmentedText" reproduces the exact 'translatedText' including spaces and punctuation.

    Diary Entry: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING },
          segmentedText: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                role: { type: Type.STRING, enum: ['subject', 'object', 'predicate', 'preposition', 'modifier', 'connective', 'other'] },
                meaning_cn: { type: Type.STRING },
                meaning_en: { type: Type.STRING },
                grammar_info: { type: Type.STRING }
              },
              required: ["text", "role", "meaning_cn", "meaning_en", "grammar_info"]
            }
          },
          grammarPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                point: { type: Type.STRING },
                explanation: { type: Type.STRING },
                example: { type: Type.STRING }
              },
              required: ["point", "explanation", "example"]
            }
          },
          verbConjugations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                infinitive: { type: Type.STRING },
                tense: { type: Type.STRING },
                group: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["infinitive", "tense", "group", "explanation"]
            }
          },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                gender: { type: Type.STRING },
                meaning: { type: Type.STRING },
                pos: { type: Type.STRING, description: "Part of speech: noun, verb, adjective, adverb, preposition, etc." }
              },
              required: ["word", "gender", "meaning", "pos"]
            }
          },
          fixedExpressions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                expression: { type: Type.STRING },
                meaning: { type: Type.STRING },
                context: { type: Type.STRING }
              },
              required: ["expression", "meaning", "context"]
            }
          },
          culturalNote: { type: Type.STRING }
        },
        required: ["translatedText", "segmentedText", "grammarPoints", "verbConjugations", "vocabulary", "fixedExpressions"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Empty response from AI");
  }

  return JSON.parse(response.text.trim());
};
