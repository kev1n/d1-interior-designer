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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageSearch } from "@/components/ImageSearch";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { GeneratedImagePreview } from "@/components/GeneratedImagePreview";
import { ThreeDSceneViewer } from "@/components/ImageSearch";
import { Divider } from "@/components/Divider";
import { ProductCarousel } from "@/components/ProductCarousel";
import MultipleSelector from "@/components/ui/multi-select";
import { chain } from "@/app/actions/chain";
import { generateThreeJsScene } from "@/app/actions/gemini-3d";
import { TurnImage } from "@/app/actions/types";
import { ProductSearchResult } from "@/app/actions/product-search";

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
  budget: z.number().min(100).max(10000).default(1000),
});

export function ImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [threeJsScene, setThreeJsScene] = useState<string | null>(null);
  const [generating3DScene, setGenerating3DScene] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [productResults, setProductResults] =
    useState<ProductSearchResult | null>(null);
  const [searchingProducts, setSearchingProducts] = useState(false);
  // Active tab state
  const [activeTab, setActiveTab] = useState("image");

  // Base image (required for iteration)
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);

  // Reference image (optional for inspiration)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null
  );
  const [referenceImageLoading, setReferenceImageLoading] = useState(false);

  const [budget, setBudget] = useState(1000);

  // Initialize the form
  const form = useForm({
    defaultValues: {
      customItems: [],
      baseImage: undefined,
      referenceImage: undefined,
      budget: 1000,
    },
    resolver: zodResolver(formSchema),
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
      setProductResults(null);
      setSearchingProducts(false);

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
        setActiveTab("image"); // Switch to image tab after generation

        toast.success("Image generated successfully!");

        // If we have a structuredOutput but no product results yet,
        // show a loading indicator while searching for products
        if (result.structuredOutput && !result.productResults) {
          setSearchingProducts(true);
          toast.info("Searching for product recommendations...");
        }

        // Handle product results if available
        if (result.productResults) {
          setProductResults(result.productResults);
          toast.success("Product recommendations found!");
        }

        console.log("Image generated successfully!");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setLoading(false);
      setSearchingProducts(false);
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
        setActiveTab("3d"); // Switch to 3D tab after generation
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
    <div className="flex w-full h-full">
      {/* Left Sidebar */}
      <div className="w-116 flex-shrink-0 border-r overflow-auto h-full">
        <Card className="h-full border-0 rounded-none shadow-none">
          <CardHeader className="px-4 py-3">
            <div className="p-6 pb-2 flex-shrink-0">
              <h1 className="text-4xl font-bold tracking-tight mb-3 text-center">
                Interior Design Generator
              </h1>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-1">
                Create stunning interior designs using AI. Describe your dream
                space and get instant visual concepts.
              </p>
            </div>
            <hr className="my-4" />
            <CardTitle className="text-lg">Design Controls</CardTitle>
            <CardDescription>
              Configure your interior design generation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 mb-4"
              >
                {/* Base Image Section - Required */}
                <div className="space-y-3 border p-3 rounded-md">
                  <h3 className="text-md font-medium">Base Image (Required)</h3>
                  <p className="text-sm text-muted-foreground">
                    This image will be used as a starting point.
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
                <div className="space-y-3 border p-3 rounded-md border-dashed">
                  <h3 className="text-md font-medium">
                    Reference Image (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This image provides additional inspiration.
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
                        placeholder="Type items to add (e.g., plant, sofa)..."
                        creatable
                        value={field.value}
                        onChange={field.onChange}
                        emptyIndicator={
                          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                            Type to create a new item
                          </p>
                        }
                      />
                      <FormDescription className="text-xs">
                        Add items you want in your design: sofa, table, plants,
                        etc.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Budget Slider */}
                <div className="space-y-3 border p-3 rounded-md">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between mb-2">
                          <FormLabel>Budget</FormLabel>
                          <span className="font-medium text-amber-700">
                            ${field.value}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                            setBudget(value);
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <FormDescription className="text-xs mt-2">
                          Set your budget for furnishing this room
                        </FormDescription>
                      </FormItem>
                    )}
                  />
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
      </div>

      {/* Right Canvas Area with Tabs */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <div className="border-b p-3 flex items-center justify-between bg-white">
          <h2 className="font-medium">Design Preview</h2>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger
                value="image"
                className={
                  activeTab === "image" ? "bg-amber-100 text-amber-900" : ""
                }
              >
                2D Image
              </TabsTrigger>
              <TabsTrigger
                value="3d"
                className={
                  activeTab === "3d" ? "bg-amber-100 text-amber-900" : ""
                }
              >
                3D View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
          <div className="flex-1 min-h-0 relative">
            {activeTab === "image" && (
              <div className="h-full flex flex-col items-center justify-center p-0">
                <div className="w-full h-full">
                  <GeneratedImagePreview
                    imageUrl={generatedImage}
                    isLoading={loading}
                    onDownload={handleDownload}
                    onGenerate3D={undefined}
                    onRegenerate3D={undefined}
                    has3DScene={!!threeJsScene}
                    generating3DScene={generating3DScene}
                  />
                </div>
              </div>
            )}

            {activeTab === "3d" && (
              <div className="h-full flex flex-col">
                {threeJsScene ? (
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex-1 w-full h-full overflow-hidden relative">
                      <ThreeDSceneViewer htmlContent={threeJsScene} />

                      {!productResults?.items.length && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-center">
                          <Button
                            onClick={() => setActiveTab("image")}
                            variant="outline"
                            className="bg-white/90 hover:bg-white"
                          >
                            Back to 2D View
                          </Button>
                          <Button
                            onClick={generate3DScene}
                            disabled={generating3DScene}
                            className="bg-white/90 hover:bg-white text-black"
                          >
                            {generating3DScene ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              "Regenerate 3D Scene"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    {generatedImage ? (
                      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm border">
                        <h3 className="text-xl font-medium mb-4">
                          Create 3D View
                        </h3>
                        <p className="text-muted-foreground mb-8">
                          Transform your 2D design into an interactive 3D
                          environment that you can explore.
                        </p>
                        <Button
                          onClick={generate3DScene}
                          disabled={!generatedImage || generating3DScene}
                          size="lg"
                          className="px-8"
                        >
                          {generating3DScene ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Generating 3D Scene...
                            </>
                          ) : (
                            "Generate 3D Scene"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center max-w-md mx-auto p-8 bg-white/50 rounded-lg">
                        <h3 className="text-xl font-medium mb-4">
                          No Image Available
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Generate a 2D image first before creating a 3D view.
                        </p>
                        <Button
                          onClick={() => setActiveTab("image")}
                          variant="secondary"
                        >
                          Switch to 2D Tab
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Carousel - shown in both tabs if products are available */}
          {searchingProducts ? (
            <div className="flex-shrink-0 bg-white p-6 border-t product-carousel-animate">
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Searching for product recommendations...</span>
              </div>
            </div>
          ) : productResults && productResults.items.length > 0 ? (
            <div className="flex-shrink-0">
              <ProductCarousel
                products={productResults.items}
                totalCost={productResults.total_cost}
                budget={budget}
              />

              {/* 3D View controls when product carousel is visible */}
              {activeTab === "3d" && threeJsScene && (
                <div className="p-3 bg-white border-t flex justify-between items-center">
                  <Button
                    onClick={() => setActiveTab("image")}
                    variant="outline"
                  >
                    Back to 2D View
                  </Button>
                  <Button
                    onClick={generate3DScene}
                    disabled={generating3DScene}
                  >
                    {generating3DScene
                      ? "Regenerating..."
                      : "Regenerate 3D Scene"}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
