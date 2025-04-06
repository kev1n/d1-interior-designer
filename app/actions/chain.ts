"use server";

import { getGeminiResponse } from "./gemini";
import { Turn, TurnImage } from "./types";

const BASE_PROMPT = `
You are a interior designer.

This is the original image that we are working with. Modify the original image such that it has the following:

\${requestedChanges}
Make sure to overlay the changes over the original image. Preserve most of the original image, only modify the parts that are necessary to make the changes.
`;
const REFERENCE_IMAGE_BASE_DESCRIPTION = `furniture and decorations that encourages productivity and wellness (with some more greenery)`;

const DESCRIBE_INTERIOR_PROMPT = `
You are an experienced and professional interior designer. Your task is to vividly describe, with abundant and specific detail, the interior design you have created for your clients based on the provided image.

In your response:

1. Begin with an engaging overview of the style or aesthetic theme of the room (e.g., contemporary, minimalist, Scandinavian, rustic, mid-century modern).
2. Clearly describe the color palette, explaining how each color choice contributes to the room's overall mood or ambiance.
3. Detail the materials and textures used (such as wood, metal, glass, textiles), including their visual and tactile impact on the design.
4. Highlight the furniture selection, placement, and its functional and aesthetic purposes.
5. Discuss lighting choices (natural and artificial), noting how these elements enhance the space.
6. Mention any decorative accessories, artwork, plants, or unique features.

Conclude with a statement about how the overall design aligns with the client's desired lifestyle, preferences, or stated objectives.

Here is the image that you have created:
`;
export async function chain(
  baseImage: TurnImage,
  referenceImage?: TurnImage,
  requestedItems: string[] = []
) {
  let requestedChanges = "";
  let referenceDescription = "";

  // If we have a reference image, get its description first
  if (referenceImage) {
    const descriptionTurns: Turn[] = [
      {
        text: DESCRIBE_INTERIOR_PROMPT,
        image: referenceImage,
      },
    ];

    const descriptionResponse = await getGeminiResponse(
      descriptionTurns,
      false
    );

    if (descriptionResponse.text) {
      referenceDescription = descriptionResponse.text;
    } else {
      // Fallback to default description if we couldn't get one
      referenceDescription = REFERENCE_IMAGE_BASE_DESCRIPTION;
    }
  } else {
    // Use default description if no reference image
    referenceDescription = REFERENCE_IMAGE_BASE_DESCRIPTION;
  }

  // Start with the reference description as the base for requested changes
  requestedChanges = referenceDescription;

  // Add custom items if any
  if (requestedItems.length > 0) {
    requestedChanges +=
      "\n\nAdditionally, add the following items to the space: " +
      requestedItems.join(", ") +
      ".";
  }

  // Create the final prompt for image generation
  const finalPrompt = BASE_PROMPT.replace(
    "${requestedChanges}",
    requestedChanges
  );

  const imageTurns: Turn[] = [
    {
      text: finalPrompt,
      image: baseImage,
    },
  ];

  // Generate the final image with the changes
  const response = await getGeminiResponse(imageTurns, true);

  return response;
}
