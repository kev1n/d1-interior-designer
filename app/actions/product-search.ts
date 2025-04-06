"use server";

import { GoogleGenAI } from "@google/genai";

/**
 * Product search result interface
 */
export interface ProductSearchResult {
  items: ProductItem[];
  total_cost: number;
}

/**
 * Product item interface
 */
export interface ProductItem {
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  source_link: string;
}

/**
 * Search for products based on items description using Gemini with grounding
 * @param items Array of item descriptions to search for
 * @returns Product search results with links and prices
 */
export async function searchProducts(
  items: Array<{
    name: string;
    quantity: number;
    description: string;
  }>
): Promise<{ results?: ProductSearchResult; error?: string }> {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Craft the prompt for product search
    const itemsText = items
      .map((item) => `- ${item.name} (${item.quantity}): ${item.description}`)
      .join("\n");

    const prompt = `
You are a helpful interior design shopping assistant. I have a list of interior design items that I need to purchase. 
For each item in the list, use your web search capabilities to find actual products that match the description.

To complete this task, you MUST use the Google Search grounding tool to find real, available products that match each item's description.

Here are the items I need:
${itemsText}

Using your Google Search grounding tool, search for real, available products for each item. Return the results in a valid JSON format with this exact structure:
\`\`\`json
{
  "items": [
    {
      "item_name": "Product name",
      "description": "Brief product description",
      "quantity": 2,
      "unit_price": 149.99,
      "total_price": 299.98,
      "source_link": "Direct link to the product page from your Google Search results"
    }
  ],
  "total_cost": 299.98
}
\`\`\`

CRITICAL REQUIREMENTS:
1. You MUST use the Google Search grounding tool to find real products from reputable retailers
2. Include all requested fields in your response
3. The source_link MUST be a direct link to the product page from your Google Search results
4. Each product must have exactly ONE source_link that leads to where the product can be purchased
5. Calculate the total_price (unit_price * quantity) accurately for each item
6. Sum all total_price values to calculate the total_cost field
7. ONLY PROVIDE VALID JSON STRUCTURE - DO NOT include any explanatory text, comments, or anything outside of the JSON structure
8. Your response must strictly follow the JSON format shown above - no extra text before or after the JSON

DO NOT use markdown syntax around the JSON - only provide the raw JSON object. Your entire response must be a single, parseable JSON object.
`;

    // Make the API call with grounding enabled
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        topP: 0.1,
        topK: 16,
        responseMimeType: "application/json",
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      return { error: "No response from Gemini API" };
    }

    const responseText =
      response.candidates[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from the response text
    const jsonMatch =
      responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
      responseText.match(/```\s*([\s\S]*?)\s*```/);

    // If we found a JSON block with backticks, use that, otherwise try to parse the whole response
    let jsonString = "";
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim();
    } else {
      // Try to extract JSON from the text - find first { and last }
      const firstBrace = responseText.indexOf("{");
      const lastBrace = responseText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = responseText.substring(firstBrace, lastBrace + 1);
      } else {
        // Fall back to the whole text
        jsonString = responseText.trim();
      }
    }

    try {
      const results = JSON.parse(jsonString) as ProductSearchResult;

      // Validate the parsed data has the expected structure
      if (!results.items || !Array.isArray(results.items)) {
        return { error: "Invalid product search results format" };
      }

      // Ensure all required fields are present and have correct types
      results.items = results.items.map((item) => ({
        item_name: item.item_name || "Unknown Product",
        description: item.description || "",
        quantity: typeof item.quantity === "number" ? item.quantity : 1,
        unit_price: typeof item.unit_price === "number" ? item.unit_price : 0,
        total_price:
          typeof item.total_price === "number" ? item.total_price : 0,
        source_link: item.source_link || "",
      }));

      // Recalculate total cost if needed
      if (typeof results.total_cost !== "number") {
        results.total_cost = results.items.reduce(
          (sum, item) => sum + item.total_price,
          0
        );
      }

      return { results };
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      return { error: "Failed to parse product search results" };
    }
  } catch (error) {
    console.error("Error searching for products:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
