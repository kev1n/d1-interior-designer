"use client";

import { useState, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDescription, FormLabel } from "@/components/ui/form";
import { searchImages } from "@/app/actions/google-search";
import { fetchImageAsBase64 } from "@/app/actions/fetch-image";
import { cn } from "@/lib/utils";

interface SearchItem {
  title: string;
  link: string;
  thumbnailLink: string;
}

interface ImageSearchProps {
  onImageSelect: (imageDataUrl: string) => void;
}

export function ImageSearch({ onImageSelect }: ImageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [selectedSearchImage, setSelectedSearchImage] = useState<string | null>(
    null
  );
  const isSearchingRef = useRef(false);

  // Handle image search with protection against double-triggering
  const handleImageSearch = async () => {
    if (!searchQuery || searchLoading || isSearchingRef.current) {
      return;
    }

    try {
      // Set ref flag to prevent concurrent executions
      isSearchingRef.current = true;
      setSearchLoading(true);

      const { results, error } = await searchImages(searchQuery);

      if (error) {
        toast.error(error);
        return;
      }

      if (results?.items && results.items.length > 0) {
        const searchItems: SearchItem[] = results.items.map((item) => ({
          title: item.title,
          link: item.link,
          thumbnailLink: item.image.thumbnailLink,
        }));
        setSearchResults(searchItems);
        toast.success(
          `Found ${searchItems.length} images for "${searchQuery}"`
        );
      } else {
        toast.error(`No images found for "${searchQuery}"`);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching images:", error);
      toast.error("Failed to search images");
    } finally {
      setSearchLoading(false);
      // Reset the flag after completion
      isSearchingRef.current = false;
    }
  };

  // Handle selecting a search result image
  const handleSelectSearchImage = async (imageUrl: string) => {
    if (imageLoading) return;

    try {
      setSelectedSearchImage(imageUrl);
      setImageLoading(true);

      // Use the server action to fetch the image
      const { data, mimeType, error } = await fetchImageAsBase64(imageUrl);

      if (error) {
        toast.error(`Failed to load image: ${error}`);
        return;
      }

      if (data && mimeType) {
        const dataUrl = `data:${mimeType};base64,${data}`;
        onImageSelect(dataUrl);
      }
    } catch (error) {
      console.error("Error loading image:", error);
      toast.error("Failed to load the selected image");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle key press for search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleImageSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormLabel>Find Inspiration Images</FormLabel>
        <div className="flex gap-2">
          <Input
            placeholder="Search for interior design images"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={searchLoading}
            onKeyDown={handleKeyPress}
          />
          <Button
            type="button"
            onClick={handleImageSearch}
            disabled={searchLoading || !searchQuery}
            className="whitespace-nowrap"
          >
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
        <FormDescription>
          Search for inspiration images from the web
        </FormDescription>
      </div>

      {/* Search results section */}
      {searchResults.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Search Results:</h4>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "cursor-pointer overflow-hidden rounded-md border-2 transition-all hover:opacity-90",
                  selectedSearchImage === result.link
                    ? "border-primary"
                    : "border-transparent"
                )}
                onClick={() => handleSelectSearchImage(result.link)}
              >
                <div className="relative h-20 w-full">
                  <Image
                    src={result.link}
                    alt={result.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 100px"
                  />
                </div>
              </div>
            ))}
          </div>
          {imageLoading && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading selected image...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ThreeDSceneViewerProps {
  htmlContent: string;
}

export function ThreeDSceneViewer({ htmlContent }: ThreeDSceneViewerProps) {
  return (
    <div className="relative w-full h-full">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        title="3D Interior Design Scene"
        style={{ height: "100%" }}
      />
    </div>
  );
}
