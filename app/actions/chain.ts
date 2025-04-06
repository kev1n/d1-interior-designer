"use server";

import { getGeminiResponse } from "./gemini";
import { Turn, TurnImage } from "./types";

const BASE_PROMPT = `
You are a interior designer.

This is the original image that we are working with. Modify the original image such that it has the following:

\${requestedChanges}
Make sure to overlay the changes over the original image
`;
const REFERENCE_IMAGE_BASE_DESCRIPTION = `furniture and decorations that encourages productivity and wellness (with some more greenery)`;

const DESCRIBE_INTERIOR_PROMPT = `
You are a interior designer trying to describe what design you've created for your clients

In plentiful detail, describe what design you've created for your clients

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
