"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
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
import { ThreeDSceneViewer } from "@/components/ImageSearch";
import { Divider } from "@/components/Divider";
import MultipleSelector from "@/components/ui/multi-select";
import { chain } from "@/app/actions/chain";
import { generateThreeJsScene } from "@/app/actions/gemini-3d";
import { TurnImage } from "@/app/actions/types";

// Define the form schema using zod
const formSchema = z.object({
  customItems: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  baseImage: z.any().optional(),
  referenceImage: z.any().optional(),
});

export function ImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [threeJsScene, setThreeJsScene] = useState<string | null>(null);
  const [generating3DScene, setGenerating3DScene] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );

  // Base image (required for iteration)
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);

  // Reference image (optional inspiration)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null
  );
  const [referenceImageLoading, setReferenceImageLoading] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customItems: [],
      baseImage: undefined,
      referenceImage: undefined,
    },
  });

  // Handle base image upload
  const handleBaseImageUpload = (dataUrl: string, file: File) => {
    setBaseImageUrl(dataUrl);
    form.setValue("baseImage", file);
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
      setThreeJsScene(null);
      setGeneratedImageData(null);

      // Extract base image data and create TurnImage
      const baseImageData = baseImageUrl.split(",")[1];
      const baseMimeType = baseImageUrl.split(";")[0].split(":")[1];

      const baseImage: TurnImage = {
        data: baseImageData,
        mimeType: baseMimeType,
      };

      // Extract reference image data if provided
      let referenceImage: TurnImage | undefined;
      if (referenceImageUrl) {
        const refImageData = referenceImageUrl.split(",")[1];
        const refMimeType = referenceImageUrl.split(";")[0].split(":")[1];

        referenceImage = {
          data: refImageData,
          mimeType: refMimeType,
        };
      }

      // Get custom items from the MultipleSelector
      const customItems = form.getValues("customItems") || [];
      const requestedItems = customItems.map((item) => item.value);

      // Call the chain function
      const result = await chain(baseImage, referenceImage, requestedItems);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.imageData) {
        const imageDataUrl = `data:image/jpeg;base64,${result.imageData}`;
        setGeneratedImage(imageDataUrl);
        setGeneratedImageData(result.imageData);
        toast.success("Image generated successfully!");
        console.log("Image generated successfully!");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  // Generate 3D scene from the image
  const generate3DScene = async () => {
    if (!generatedImageData) {
      toast.error("No generated image to create 3D scene from");
      return;
    }

    try {
      console.log("Generating 3D scene...");
      setGenerating3DScene(true);
      setThreeJsScene(null);
      toast.info("Generating 3D scene from the image...");

      const sceneResult = await generateThreeJsScene(
        generatedImageData,
        "image/jpeg"
      );
      console.log("3D scene generated successfully!");

      if (sceneResult.error) {
        toast.error(`Failed to generate 3D scene: ${sceneResult.error}`);
      } else if (sceneResult.htmlContent) {
        setThreeJsScene(sceneResult.htmlContent);
        toast.success("3D scene generated successfully!");
      }
    } catch (error) {
      console.error("Error generating 3D scene:", error);
      toast.error("Failed to generate 3D scene");
    } finally {
      setGenerating3DScene(false);
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
  const isSubmitDisabled = loading || !baseImageUrl || referenceImageLoading;

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate Interior Design Image</CardTitle>
            <CardDescription>
              Add items to your interior design, provide a base image to iterate
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

                  {/* Base Image Upload */}
                  <ImageUploader
                    label="Upload Your Base Image"
                    description="Upload an interior design image to iterate from"
                    onImageSelect={handleBaseImageUpload}
                  />

                  {/* Base Image Preview */}
                  {baseImageUrl && (
                    <ImagePreview
                      imageUrl={baseImageUrl}
                      title="Base Image"
                      isLoading={false}
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

                {/* Custom Items MultiSelect */}
                <FormField
                  control={form.control}
                  name="customItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add Items to Your Room</FormLabel>
                      <MultipleSelector
                        placeholder="Type items to add to your room (e.g., microwave, plant, bookshelf)..."
                        creatable
                        value={field.value}
                        onChange={field.onChange}
                        emptyIndicator={
                          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                            No results found. Type to create a new item.
                          </p>
                        }
                      />
                      <FormDescription>
                        Add specific items you want to include in your design.
                        For example: sofa, coffee table, bookshelf, plants, art,
                        etc.
                      </FormDescription>
                    </FormItem>
                  )}
                />

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

        <div className="flex flex-col gap-8">
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
                onGenerate3D={generatedImage ? generate3DScene : undefined}
                onRegenerate3D={generatedImage ? generate3DScene : undefined}
                has3DScene={!!threeJsScene}
                generating3DScene={generating3DScene}
              />
            </CardContent>
          </Card>

          {threeJsScene && (
            <Card>
              <CardHeader>
                <CardTitle>3D Interactive View</CardTitle>
                <CardDescription>
                  Explore your design in 3D. Use WASD to move and mouse to look
                  around.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThreeDSceneViewer htmlContent={threeJsScene} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
