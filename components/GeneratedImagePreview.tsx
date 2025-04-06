"use client";

import Image from "next/image";
import { Loader2, Download } from "lucide-react";
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
    <div className="space-y-4 w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden rounded-md bg-muted flex items-center justify-center relative p-6">
        {imageUrl ? (
          <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
            <div className="">
              <Image
                src={imageUrl}
                alt="Generated Interior Design"
                fill
                className="object-contain"
                unoptimized={true}
                priority
              />
            </div>
            {onDownload && (
              <Button
                onClick={onDownload}
                size="icon"
                variant="outline"
                className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-sm hover:bg-white z-10 shadow-sm"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-center p-8 max-w-md">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 mb-4 animate-spin" />
                <p className="text-lg">Generating your design...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a moment
                </p>
              </div>
            ) : (
              <div className="p-6 border rounded-lg border-dashed">
                <p className="text-lg mb-2">Ready to create your design</p>
                <p className="text-sm text-muted-foreground">
                  Configure your settings in the sidebar and click
                  &quot;Generate Design&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Only show these controls if they're not moved to the 3D tab */}
      {imageUrl && (onGenerate3D || onRegenerate3D) && (
        <div className="flex justify-center space-x-4">
          {!generating3DScene && !has3DScene && onGenerate3D && (
            <Button onClick={onGenerate3D}>Generate 3D Interactive View</Button>
          )}

          {!generating3DScene && has3DScene && onRegenerate3D && (
            <Button onClick={onRegenerate3D}>Regenerate 3D View</Button>
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
