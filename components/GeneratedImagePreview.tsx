"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedImagePreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  onDownload?: () => void;
  onGenerate3D?: () => void;
  onRegenerate3D?: () => void;
  has3DScene?: boolean;
  generating3DScene?: boolean;
}

export function GeneratedImagePreview({
  imageUrl,
  isLoading,
  onDownload,
  onGenerate3D,
  onRegenerate3D,
  has3DScene,
  generating3DScene,
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

      {imageUrl && (
        <div className="space-y-2">
          {onDownload && (
            <Button onClick={onDownload} className="w-full">
              Download Image
            </Button>
          )}

          {!generating3DScene && !has3DScene && onGenerate3D && (
            <Button onClick={onGenerate3D} className="w-full">
              Generate 3D Interactive View
            </Button>
          )}

          {!generating3DScene && has3DScene && onRegenerate3D && (
            <Button onClick={onRegenerate3D} className="w-full">
              Regenerate 3D View
            </Button>
          )}

          {generating3DScene && (
            <div className="flex items-center justify-center p-4 border rounded-md">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Generating 3D scene...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
