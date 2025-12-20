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

  useEffect(() => {
    if (!isOpen) return;
    tokensQuery.refetch();
  }, [isOpen, tokensQuery]);

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
          <SheetTitle>Image Manager</SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 py-4">
          <ImageTokenList projectId={projectId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
