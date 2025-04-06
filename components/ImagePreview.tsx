"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  imageUrl: string;
  title: string;
  isLoading?: boolean;
  onRemove: () => void;
}

export function ImagePreview({
  imageUrl,
  title,
  isLoading = false,
  onRemove,
}: ImagePreviewProps) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium mb-2">{title}:</p>
      <div className="relative aspect-video w-full overflow-hidden rounded-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              unoptimized={imageUrl.startsWith("data:")}
            />
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 z-10"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
