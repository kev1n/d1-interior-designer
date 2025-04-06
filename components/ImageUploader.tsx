"use client";

import { FormDescription, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ImageUploaderProps {
  label: string;
  description: string;
  onImageSelect: (dataUrl: string, file: File) => void;
}

export function ImageUploader({
  label,
  description,
  onImageSelect,
}: ImageUploaderProps) {
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        onImageSelect(dataUrl, file);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="cursor-pointer"
      />
      <FormDescription>{description}</FormDescription>
    </div>
  );
}
