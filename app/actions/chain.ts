"use server";

import { getGeminiResponse } from "./gemini";
import { searchProducts, ProductSearchResult } from "./product-search";
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

First, provide a general overview of the design with as much clarity and detail as possible:
1. Begin with an overview of the style or aesthetic theme of the room
2. Clearly describe the color palette, explaining how each color choice contributes to the room's overall mood or ambiance.
3. Detail the materials and textures used (such as wood, metal, glass, textiles), including their visual and tactile impact on the design.
4. Discuss lighting choices as well as the placement of windows and natural light.

Then, provide a structured inventory of furniture and decorative items in the room. For each item, include:
- Product name
- Quantity
- Short descriptive description (a three sentence description identifying the item and its style in as much detail as possible.)
- Long description (a detailed paragraph about the item including its style, materials, placement, and how it contributes to the overall design)

Your response should be in JSON format with the following structure:
{
  "overview": "The general design description...",
  "items": [
    {
      "name": "Mid-century modern sofa",
      "quantity": 1,
      "description": "INSERT A DETAILED THREE SENTENCE DESCRIPTION OF THE ITEM",
      "longDescription": "INSERT A DETAILED PARAGRAPH ABOUT THE ITEM INCLUDING ITS STYLE, MATERIALS, PLACEMENT, AND HOW IT CONTRIBUTES TO THE OVERALL DESIGN."
    },
    {
      "name": "Monstera plant",
      "quantity": 2,
      "description": "INSERT A DETAILED THREE SENTENCE DESCRIPTION OF THE ITEM",
      "longDescription": "INSERT A DETAILED PARAGRAPH ABOUT THE ITEM INCLUDING ITS STYLE, MATERIALS, PLACEMENT, AND HOW IT CONTRIBUTES TO THE OVERALL DESIGN."
    }
  ]
}

Here is the image that you have created:
`;
export async function chain(
  baseImage: TurnImage,
  referenceImage?: TurnImage,
  requestedItems: string[] = []
) {
  let requestedChanges = "";
  let referenceDescription = "";
  let productResults: ProductSearchResult | undefined;

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
      false,
      true // Use structured output
    );

    if (descriptionResponse.structuredOutput) {
      // Extract the overview and items from the structured output
      const structuredData = descriptionResponse.structuredOutput as {
        overview: string;
        items: Array<{
          name: string;
          quantity: number;
          description: string;
          longDescription: string;
        }>;
      };

      // Format the reference description using the structured data
      referenceDescription = structuredData.overview;

      // Add the items as a formatted list, using the long description
      referenceDescription += "\n\nItems in the room:";
      structuredData.items.forEach((item) => {
        referenceDescription += `\n- ${item.quantity} ${item.name}: ${item.description}`;
      });
    } else if (descriptionResponse.text) {
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

  console.log("finalPrompt", finalPrompt);

  const imageTurns: Turn[] = [
    {
      text: finalPrompt,
      image: baseImage,
    },
  ];

  // Generate the final image with the changes
  const response = await getGeminiResponse(imageTurns, true);

  // Generate structured description of the interior to get items for product search
  if (response.imageData) {
    const generatedImage: TurnImage = {
      data: response.imageData,
      mimeType: "image/jpeg",
    };

    // Get structured description of the generated image
    const descriptionTurns: Turn[] = [
      {
        text: DESCRIBE_INTERIOR_PROMPT,
        image: generatedImage,
      },
    ];

    const descriptionResponse = await getGeminiResponse(
      descriptionTurns,
      false,
      true // Use structured output
    );

    if (descriptionResponse.structuredOutput) {
      // Extract the items from the structured output
      const structuredData = descriptionResponse.structuredOutput as {
        overview: string;
        items: Array<{
          name: string;
          quantity: number;
          description: string;
          longDescription: string;
        }>;
      };

      // Search for products based on the generated items
      const { results, error } = await searchProducts(
        structuredData.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          description: item.description,
        }))
      );

      if (results && !error) {
        productResults = results;
      }
    }
  }

  return {
    ...response,
    productResults,
  };
}
