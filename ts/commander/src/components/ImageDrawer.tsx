import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useImageStore } from "@/stores/ImageStore";
import { useProjectImages, useImageTokens } from "@/hooks/useImages";
import ImageTokenList from "./ImageTokenList";
import ImageGallery from "./ImageGallery";
import ImageUploadDropzone from "./ImageUploadDropzone";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageDrawerProps {
  projectId: string;
}

export default function ImageDrawer({ projectId }: ImageDrawerProps) {
  // Sync data
  const imagesQuery = useProjectImages(projectId);
  const tokensQuery = useImageTokens(projectId);
  // Reset store when project changes
  useEffect(() => {
    if (!projectId) return;
    useImageStore.getState().reset();
    imagesQuery.refetch();
    tokensQuery.refetch();
    // it's safe to omit queries' changing fields because refetch is called explicitly on projectId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <Sheet>
      <SheetTrigger>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-blue-600 text-white z-50 hover:bg-blue-700"
          aria-label="Open Image Manager"
        >
          <ImagePlus />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Image Manager</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-4 space-y-6">
          <ImageTokenList />
          <ImageGallery />
        </div>

        <div className="p-4 border-t">
          <ImageUploadDropzone />
        </div>
      </SheetContent>
    </Sheet>
  );
}
