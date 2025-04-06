"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedImagePreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  onDownload?: () => void;
}

export function GeneratedImagePreview({
  imageUrl,
  isLoading,
  onDownload,
}: GeneratedImagePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt="Generated Interior Design"
              fill
              className="object-cover"
              unoptimized={true}
              priority
            />
          </div>
        ) : (
          <div className="text-muted-foreground text-center p-4">
            {isLoading ? (
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

      {imageUrl && onDownload && (
        <Button onClick={onDownload} className="w-full">
          Download Image
        </Button>
      )}
    </div>
  );
}
