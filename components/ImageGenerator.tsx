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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateImage } from "@/app/actions/gemini";
import { Turn } from "@/app/actions/types";

// Define the form schema using zod
const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  referenceImage: z.any().optional(),
});

export function ImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setPreviewImage(dataUrl);
        form.setValue("referenceImage", file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setGeneratedImage(null);

      // Prepare the turns data
      const turns: Turn[] = [
        {
          text: values.prompt,
        },
      ];

      // Add reference image if provided
      if (previewImage) {
        // Extract base64 data by removing the data URL prefix
        const base64Data = previewImage.split(",")[1];
        const mimeType = previewImage.split(";")[0].split(":")[1];

        turns.push({
          text: "Consider this reference image as inspiration.",
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

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate Interior Design Image</CardTitle>
            <CardDescription>
              Describe the interior design you want to generate and optionally
              upload a reference image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your dream interior design (e.g., A modern minimalist living room with large windows, wooden floors, and a neutral color palette)"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be as detailed as possible for better results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Reference Image (Optional)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <FormDescription>
                    Upload a reference image to guide the generation.
                  </FormDescription>
                </div>

                {previewImage && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      Reference Image Preview:
                    </p>
                    <div className="relative aspect-video w-full overflow-hidden rounded-md">
                      <img
                        src={previewImage}
                        alt="Reference"
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreviewImage(null);
                          form.setValue("referenceImage", undefined);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
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
            <div className="aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated Interior Design"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-muted-foreground text-center p-4">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                      <p>Generating your design...</p>
                    </div>
                  ) : (
                    <p>Generated image will appear here</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          {generatedImage && (
            <CardFooter>
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = generatedImage;
                  link.download = "interior-design.jpg";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full"
              >
                Download Image
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
