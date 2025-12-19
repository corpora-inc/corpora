import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";

import { useImageStore } from "@/stores/ImageStore";
import { useProjectImages, useImageTokens } from "@/hooks/useImages";
import ImageTokenList from "./ImageTokenList";
import ImageGallery from "./ImageGallery";
import ImageUploadDropzone from "./ImageUploadDropzone";

interface ImageDrawerProps {
  projectId: string;
}

export default function ImageDrawer({ projectId }: ImageDrawerProps) {
  // Sync from backend into Zustand
  const imagesQuery = useProjectImages(projectId);
  const tokensQuery = useImageTokens(projectId);

  // Control drawer open/close via store
  const isOpen = useImageStore((s) => s.isDrawerOpen);
  const setOpen = useImageStore((s) => s.setDrawerOpen);

  // Reset store when project changes
  useEffect(() => {
    if (!projectId) return;
    useImageStore.getState().reset();
    imagesQuery.refetch();
    tokensQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const tokenCount = useImageStore((s) => s.tokens.length);
  const imageCount = useImageStore((s) => s.images.length);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-blue-600 text-white z-50 hover:bg-blue-700"
          aria-label="Open Image Manager"
        >
          <ImagePlus />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-[80vw] flex flex-col">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="flex items-baseline gap-2">
            <span>Image Manager</span>
            <span className="text-xs font-normal text-gray-500">
              {tokenCount} tokens · {imageCount} images
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Tokens + generation UI */}
          <div className="border rounded-md bg-white/80 px-4 py-3 shadow-sm">
            <ImageTokenList projectId={projectId} />
          </div>

          {/* Gallery + upload */}
          <div className="flex-1 min-h-0 flex flex-col gap-3 border rounded-md bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Image Library</h2>
              <p className="text-xs text-gray-500">
                {imagesQuery.isLoading || tokensQuery.isLoading ? "Syncing…" : "Synced"}
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <ImageGallery />
            </div>

            <div className="pt-2 border-t mt-2">
              <ImageUploadDropzone />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
