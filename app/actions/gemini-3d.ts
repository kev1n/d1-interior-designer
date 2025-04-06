"use server";

import { GoogleGenAI } from "@google/genai";

/**
 * Helper function to strip non-English Unicode characters
 * @param text Text to clean
 * @returns Text with only ASCII characters
 */
function stripNonEnglishChars(text: string): string {
  // This regex keeps only ASCII characters (0-127)
  return text.replace(/[^\x00-\x7F]/g, "");
}

/**
 * Server action to generate a 3D scene from an image using Gemini 2.5 Pro
 * @param imageData Base64 encoded image data
 * @returns HTML content for 3D scene or error
 */
export async function generateThreeJsScene(
  imageData: string,
  mimeType: string
): Promise<{ htmlContent?: string; error?: string }> {
  try {
    // Initialize the Gemini API client
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }
    console.log("Generating 3D scene with Gemini 2.5 Pro with key", apiKey);

    const ai = new GoogleGenAI({ apiKey });

    // Create the prompt
    const prompt = `
Given an image of an indoor scene, generate a realistic and spatially accurate Three.js scene that exactly replicates the image. The output should be a self-contained HTML file that renders the scene and allows the user to explore it in first-person. Follow these requirements:

📐 Scene Construction:
Recreate all visible objects, furniture, walls, floors, ceilings, and windows.
Ensure each element has the correct position, size, scale, and orientation relative to other elements.
Accurately represent structural elements like windows, walls, doors, and frames. Make windows transparent with visible borders.

🎨 Visual Detail:
Provide enough geometric and material detail to clearly differentiate all items.
Use basic but effective materials (e.g., matte, glossy, transparent) to reflect the real-world surfaces.
Use distinct colors, textures, or placeholder materials to visually separate similar items.

💡 Lighting:
Match the lighting conditions (color, brightness, etc) of the image using directional or ambient light (e.g., sunlight through windows).
Include realistic shadows for depth and clarity.

🎥 Camera & Navigation (Street View-Style):
Enable first-person navigation using pointer lock controls or equivalent:
Allow the user to walk using WASD keys and look around with the mouse, similar to Google Street View.
Place the camera at eye level (~1.6 meters from the ground).
Include basic collision detection to prevent walking through walls, furniture, or other solid objects.
Ensure the starting camera perspective closely matches that of the original image.

⚙️ Technical Constraints:
The output must be a single standalone HTML file using Three.js.
Do not rely on external file dependencies (e.g., external textures or models). Inline everything or use placeholders.
Ensure the scene renders and is fully navigable in a modern browser without extra setup.

First, in your thinking process, note down the relative positions of all the objects in the image. Be sure to consider depth and perspective.
Then, think about what specific items/components you need to build the scene and how they should be positioned. If you need more than one of the same item, make sure to make it into a function that can be called multiple times.
Finally, assemble the scene from the components you've created.
`;

    // Prepare the content for the API call
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: imageData,
        },
      },
    ];

    // Make the API call using the specified model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
      contents: contents,
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
      if (part.text) {
        // Strip non-English Unicode characters
        const cleanedText = stripNonEnglishChars(part.text);

        // Extract the HTML content from the response text
        const htmlRegex = /<html[\s\S]*<\/html>/i;
        const htmlMatch = cleanedText.match(htmlRegex);

        if (htmlMatch && htmlMatch[0]) {
          return { htmlContent: htmlMatch[0] };
        } else {
          return { htmlContent: cleanedText };
        }
      }
    }

    return { error: "No HTML content was generated in the response" };
  } catch (error) {
    console.error("Error generating 3D scene:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
