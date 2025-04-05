"use server";

import { GoogleGenAI } from "@google/genai";
import { Turn } from "./types";

/**
 * Server action to generate an image using Gemini API
 * @param turns Array of turns containing text and optional image data
 * @returns Base64 encoded image data or error
 */
export async function generateImage(
  turns: Turn[]
): Promise<{ imageData?: string; error?: string }> {
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

    // Make the API call
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
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
    }

    return { error: "No image was generated in the response" };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
