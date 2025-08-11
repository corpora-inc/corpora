import { create } from "zustand";
import type { ProjectImageOut } from "@/api/schemas/projectImageOut";
import type { ImageToken } from "@/api/schemas/imageToken";


interface ImageStore {
    /** All images already uploaded for the current project */
    images: ProjectImageOut[];
    /** All {{IMAGE: caption}} tokens found in the manuscript */
    tokens: ImageToken[];
    /** Whether the right‑hand drawer / modal is open */
    isDrawerOpen: boolean;

    // ─── State setters ────────────────────────────────────────────────
    setImages: (imgs: ProjectImageOut[]) => void;
    addImage: (img: ProjectImageOut) => void;
    updateImage: (img: ProjectImageOut) => void;
    removeImage: (imageId: string) => void;

    setTokens: (toks: ImageToken[]) => void;
    updateTokenFulfilled: (caption: string, imageId: string) => void;
    updateTokenUnfulfilled: (caption: string) => void;

    setDrawerOpen: (open: boolean) => void;

    /** Reset everything (call when switching projects) */
    reset: () => void;
}

export const useImageStore = create<ImageStore>((set) => ({
    images: [],
    tokens: [],
    isDrawerOpen: false,

    setImages: (imgs) => set({ images: imgs }),
    addImage: (img) =>
        set((state) => ({ images: [...state.images, img] })),
    updateImage: (img) =>
        set((state) => ({
            images: state.images.map((i) => (i.id === img.id ? img : i)),
        })),
    removeImage: (imageId) =>
        set((state) => ({
            images: state.images.filter((i) => i.id !== imageId),
        })),
    setTokens: (toks) => set({ tokens: toks }),
    updateTokenFulfilled: (caption, imageId) =>
        set((state) => ({
            tokens: state.tokens.map((t) =>
                t.caption === caption ? { ...t, fulfilled: true, image_id: imageId } : t,
            ),
        })),
    updateTokenUnfulfilled: (caption) =>
        set((state) => ({
            tokens: state.tokens.map((t) =>
                t.caption === caption ? { ...t, fulfilled: false, image_id: undefined } : t,
            ),
        })),
    setDrawerOpen: (open) => set({ isDrawerOpen: open }),
    reset: () => set({ images: [], tokens: [], isDrawerOpen: false }),
}));
