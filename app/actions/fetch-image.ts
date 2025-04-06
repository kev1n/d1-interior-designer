"use server";

/**
 * Server action to fetch an image from a URL and return it as base64
 * @param imageUrl URL of the image to fetch
 * @returns Base64 encoded image data and MIME type
 */
export async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ data?: string; mimeType?: string; error?: string }> {
  try {
    if (!imageUrl) {
      return { error: "Image URL is required" };
    }

    // Fetch the image using Node.js runtime (no CORS issues on server)
    const response = await fetch(imageUrl, {
      headers: {
        // Some basic headers to pretend to be a browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the MIME type from the Content-Type header
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Convert the image to a Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64
    const base64Data = buffer.toString("base64");

    return {
      data: base64Data,
      mimeType: contentType,
    };
  } catch (error) {
    console.error("Error fetching image:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
