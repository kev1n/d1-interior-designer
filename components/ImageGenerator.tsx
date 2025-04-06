"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageSearch } from "@/components/ImageSearch";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { GeneratedImagePreview } from "@/components/GeneratedImagePreview";
import { Divider } from "@/components/Divider";
import { generateImage } from "@/app/actions/gemini";
import { Turn } from "@/app/actions/types";

// Define the form schema using zod
const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  baseImage: z.any().optional(),
  referenceImage: z.any().optional(),
});

export function ImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Base image (required for iteration)
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [baseImageLoading, setBaseImageLoading] = useState(false);

  // Reference image (optional inspiration)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null
  );
  const [referenceImageLoading, setReferenceImageLoading] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referenceImage: undefined,
    },
  });

  // Handle base image upload
  const handleBaseImageUpload = (dataUrl: string, file: File) => {
    setBaseImageUrl(dataUrl);
    form.setValue("baseImage", file);
  };

  // Handle base image search selection
  const handleBaseImageSearch = (dataUrl: string) => {
    setBaseImageUrl(dataUrl);
    form.setValue("baseImage", undefined); // Clear the file input
  };

  // Handle reference image upload
  const handleReferenceImageUpload = (dataUrl: string, file: File) => {
    setReferenceImageUrl(dataUrl);
    form.setValue("referenceImage", file);
  };

  // Handle reference image search selection
  const handleReferenceImageSearch = (dataUrl: string) => {
    setReferenceImageUrl(dataUrl);
    form.setValue("referenceImage", undefined); // Clear the file input
  };

  // Clear base image
  const clearBaseImage = () => {
    setBaseImageUrl(null);
    form.setValue("baseImage", undefined);
  };

  // Clear reference image
  const clearReferenceImage = () => {
    setReferenceImageUrl(null);
    form.setValue("referenceImage", undefined);
  };

  // Handle form submission
  const onSubmit = async () => {
    try {
      // Validate that we have the required base image
      if (!baseImageUrl) {
        toast.error("Please provide a base image to iterate from");
        return;
      }

      setLoading(true);
      setGeneratedImage(null);

      // Prepare the turns data
      const turns: Turn[] = [
        {
          text: form.getValues("prompt"),
        },
      ];

      // Add base image - this is required for iteration
      if (baseImageUrl) {
        // Extract base64 data by removing the data URL prefix
        const base64Data = baseImageUrl.split(",")[1];
        const mimeType = baseImageUrl.split(";")[0].split(":")[1];

        turns.push({
          text: "Use this as the base image to iterate from.",
          image: {
            mimeType,
            data: base64Data,
          },
        });
      }

      // Add optional reference image if provided
      if (referenceImageUrl) {
        // Extract base64 data by removing the data URL prefix
        const base64Data = referenceImageUrl.split(",")[1];
        const mimeType = referenceImageUrl.split(";")[0].split(":")[1];

        turns.push({
          text: "Consider this reference image as additional inspiration.",
          image: {
            mimeType,
            data: base64Data,
          },
        });
      }

      // Call the server action
      const result = await generateImage(turns);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.imageData) {
        setGeneratedImage(`data:image/jpeg;base64,${result.imageData}`);
        toast.success("Image generated successfully!");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  // Download the generated image
  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "interior-design.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine if the submit button should be disabled
  const isSubmitDisabled =
    loading ||
    !baseImageUrl ||
    form.getValues("prompt").length < 10 ||
    baseImageLoading ||
    referenceImageLoading;

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate Interior Design Image</CardTitle>
            <CardDescription>
              Describe your interior design, provide a base image to iterate
              from, and optionally add a reference image for inspiration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Base Image Section - Required */}
                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="text-lg font-medium">Base Image (Required)</h3>
                  <p className="text-sm text-muted-foreground">
                    This image will be used as a starting point to generate
                    variations.
                  </p>

                  {/* Base Image Search */}
                  <ImageSearch
                    onImageSelect={(url) => {
                      setBaseImageLoading(true);
                      handleBaseImageSearch(url);
                      setBaseImageLoading(false);
                    }}
                  />

                  <Divider />

                  {/* Base Image Upload */}
                  <ImageUploader
                    label="Upload Your Own Base Image"
                    description="Upload an interior design image to iterate from"
                    onImageSelect={handleBaseImageUpload}
                  />

                  {/* Base Image Preview */}
                  {baseImageUrl && (
                    <ImagePreview
                      imageUrl={baseImageUrl}
                      title="Base Image"
                      isLoading={baseImageLoading}
                      onRemove={clearBaseImage}
                    />
                  )}
                </div>

                {/* Reference Image Section - Optional */}
                <div className="space-y-4 border p-4 rounded-md border-dashed">
                  <h3 className="text-lg font-medium">
                    Reference Image (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This image provides additional inspiration but won&apos;t be
                    directly iterated on.
                  </p>

                  {/* Reference Image Search */}
                  <ImageSearch
                    onImageSelect={(url) => {
                      setReferenceImageLoading(true);
                      handleReferenceImageSearch(url);
                      setReferenceImageLoading(false);
                    }}
                  />

                  <Divider />

                  {/* Reference Image Upload */}
                  <ImageUploader
                    label="Upload Your Own Reference Image"
                    description="Upload an additional image for inspiration"
                    onImageSelect={handleReferenceImageUpload}
                  />

                  {/* Reference Image Preview */}
                  {referenceImageUrl && (
                    <ImagePreview
                      imageUrl={referenceImageUrl}
                      title="Reference Image"
                      isLoading={referenceImageLoading}
                      onRemove={clearReferenceImage}
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitDisabled}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Design"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Design</CardTitle>
            <CardDescription>
              Your interior design will appear here once generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratedImagePreview
              imageUrl={generatedImage}
              isLoading={loading}
              onDownload={handleDownload}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
