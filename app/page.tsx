import { ImageGenerator } from "@/components/ImageGenerator";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <main className="min-h-screen h-screen bg-background font-sans flex flex-col overflow-hidden">
      <div className="flex flex-1 h-full overflow-hidden">
        <ImageGenerator />
      </div>
      <Toaster />
    </main>
  );
}
