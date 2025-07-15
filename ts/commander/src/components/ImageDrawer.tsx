import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useImageStore } from "@/stores/ImageStore";
import { useProjectImages, useImageTokens } from "@/hooks/useImages";
import ImageTokenList from "./ImageTokenList";
import ImageGallery from "./ImageGallery";
import ImageUploadDropzone from "./ImageUploadDropzone";
import { ImagePlus } from "lucide-react";

interface ImageDrawerProps {
    projectId: string;
}

export default function ImageDrawer({ projectId }: ImageDrawerProps) {
    // Sync data
    const imagesQuery = useProjectImages(projectId);
    const tokensQuery = useImageTokens(projectId);

    // Drawer state
    const isOpen = useImageStore((s) => s.isDrawerOpen);
    const setOpen = useImageStore((s) => s.setDrawerOpen);

    // Reset store when project changes
    useEffect(() => {
        useImageStore.getState().reset();
        imagesQuery.refetch();
        tokensQuery.refetch();
    }, [projectId]);

    return (
        <>
            {/* Toggle button */}
            <button
                className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-blue-600 text-white z-50 hover:bg-blue-700"
                onClick={() => setOpen(true)}
                aria-label="Open Image Manager"
            >
                <ImagePlus />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <Dialog.Root open onOpenChange={setOpen}>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
                            <motion.div
                                className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl flex flex-col z-50"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "tween", duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between p-4 border-b">
                                    <Dialog.Title className="text-lg font-medium">
                                        Image Manager
                                    </Dialog.Title>
                                    <Dialog.Close className="p-2">✕</Dialog.Close>
                                </div>

                                <div className="flex-1 overflow-auto p-4 space-y-6">
                                    <ImageTokenList />
                                    <ImageGallery />
                                </div>

                                <div className="p-4 border-t">
                                    <ImageUploadDropzone />
                                </div>
                            </motion.div>
                        </Dialog.Portal>
                    </Dialog.Root>
                )}
            </AnimatePresence>
        </>
    );
}
