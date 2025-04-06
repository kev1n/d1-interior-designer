"use server";

import {
  GoogleGenAI,
  Type,
  GenerateContentConfig,
  Schema,
} from "@google/genai";
import { Turn } from "./types";

/**
 * Server action to generate a response using Gemini API
 * @param turns Array of turns containing text and optional image data
 * @param isImageGeneration Whether to generate an image
 * @param useStructuredOutput Whether to use structured output
 * @returns Base64 encoded image data or text or structured output or error
 */
export async function getGeminiResponse(
  turns: Turn[],
  isImageGeneration: boolean = true,
  useStructuredOutput: boolean = false
): Promise<{
  imageData?: string;
  text?: string;
  structuredOutput?: Record<string, unknown>;
  error?: string;
}> {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare the content for the API call
    const contents = [];

    for (const turn of turns) {
      // Add the text part
      contents.push({ text: turn.text });

      // Add the image part if it exists
      if (turn.image) {
        contents.push({
          inlineData: {
            mimeType: turn.image.mimeType,
            data: turn.image.data,
          },
        });
      }
    }

    // Configure the API call
    const config: GenerateContentConfig = {
      responseModalities: isImageGeneration ? ["Image", "Text"] : ["Text"],
    };

    // Add structured output configuration if requested
    if (useStructuredOutput) {
      config.responseMimeType = "application/json";
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          overview: {
            type: Type.STRING,
            description: "General description of the design",
            nullable: false,
          } as Schema,
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the product or item",
                  nullable: false,
                } as Schema,
                quantity: {
                  type: Type.NUMBER,
                  description: "Number of this item present",
                  nullable: false,
                } as Schema,
                description: {
                  type: Type.STRING,
                  description: "Short descriptive details about the item",
                  nullable: false,
                } as Schema,
                longDescription: {
                  type: Type.STRING,
                  description:
                    "Detailed description of the item including its style, materials, placement, and how it contributes to the overall design",
                  nullable: false,
                } as Schema,
              },
              required: ["name", "quantity", "description", "longDescription"],
            } as Schema,
          } as Schema,
        },
        required: ["overview", "items"],
      } as Schema;
    }

    // Make the API call
    const response = await ai.models.generateContent({
      model: isImageGeneration
        ? "gemini-2.0-flash-exp-image-generation"
        : "gemini-2.0-flash",
      contents: contents,
      config: config,
    });

    // Process the response
    if (!response.candidates || response.candidates.length === 0) {
      return { error: "No candidates in the response" };
    }

    const candidateParts = response.candidates[0]?.content?.parts;
    if (!candidateParts || candidateParts.length === 0) {
      return { error: "No parts in the candidate response" };
    }

    for (const part of candidateParts) {
      if (part.inlineData) {
        return { imageData: part.inlineData.data };
      }
      if (part.text) {
        // If we requested structured output, try to parse the text as JSON
        if (useStructuredOutput) {
          try {
            const structuredOutput: Record<string, unknown> = JSON.parse(
              part.text
            );
            return {
              structuredOutput,
              text: part.text, // Include the original text as well
            };
          } catch (e) {
            // If parsing fails, return the text as is
            console.warn("Failed to parse structured output as JSON:", e);
            return { text: part.text };
          }
        }
        return { text: part.text };
      }
    }

    return { error: "No image was generated in the response" };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
