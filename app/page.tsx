import { ImageGenerator } from "@/components/ImageGenerator";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Interior Design Generator
        </h1>
        <p className="text-muted-foreground text-center max-w-xl mb-12">
          Create stunning interior designs using AI. Describe your dream space
          and get instant visual concepts.
        </p>
        <ImageGenerator />
      </div>
      <Toaster />
    </main>
  );
}
