import { useEffect } from "react";
import {
    useCorporaCommanderApiImagesListImages,
    useCorporaCommanderApiImagesListImageTokens,
    useCorporaCommanderApiImagesCreateImage,
    useCorporaCommanderApiImagesUpdateImage,
    useCorporaCommanderApiImagesDeleteImage,
} from "@/api/commander/commander";
import { useImageStore } from "@/stores/ImageStore";
import type { ProjectImageOut } from "@/api/schemas/projectImageOut";
import type { ImageToken } from "@/api/schemas/imageToken";

/**
 * Synchronizes project images with Zustand store.
 */
export function useProjectImages(projectId?: string) {
    const setImages = useImageStore((s) => s.setImages);
    const query = useCorporaCommanderApiImagesListImages(
        projectId || "",
        { query: { enabled: !!projectId } }
    );

    useEffect(() => {
        if (query.data) {
            setImages(query.data.data as ProjectImageOut[]);
        }
    }, [query.data, setImages]);

    return query;
}

/**
 * Synchronizes image tokens with Zustand store.
 */
export function useImageTokens(projectId?: string) {
    const setTokens = useImageStore((s) => s.setTokens);
    const query = useCorporaCommanderApiImagesListImageTokens(
        projectId || "",
        { query: { enabled: !!projectId } }
    );

    useEffect(() => {
        if (query.data) {
            setTokens(query.data.data as ImageToken[]);
        }
    }, [query.data, setTokens]);

    return query;
}

// ─── Mutations ──────────────────────────────────────────────────────

/**
 * Uploads a new image. Call `mutate({ caption, image })` to trigger.
 */
export function useUploadImage(projectId: string) {
    const addImage = useImageStore((s) => s.addImage);
    const updateTokenFulfilled = useImageStore((s) => s.updateTokenFulfilled);
    const mutation = useCorporaCommanderApiImagesCreateImage({
        mutation: {
            onSuccess: (response) => {
                const img = response.data as ProjectImageOut;
                addImage(img);
                // Fulfill matching token across the project
                updateTokenFulfilled(img.caption, img.id);
            },
        },
    });

    const mutate = (caption: string, image: File) => {
        mutation.mutate({ projectId, data: { caption, image } });
    };

    return { ...mutation, mutate };
}

/**
 * Updates an image caption. Call `mutate(newCaption)` to trigger.
 */
export function useUpdateImage(projectId: string, imageId: string) {
    const updateImage = useImageStore((s) => s.updateImage);
    const images = useImageStore((s) => s.images);
    const updateTokenFulfilled = useImageStore((s) => s.updateTokenFulfilled);
    const updateTokenUnfulfilled = useImageStore((s) => s.updateTokenUnfulfilled);
    const mutation = useCorporaCommanderApiImagesUpdateImage({
        mutation: {
            onSuccess: (response) => {
                const updated = response.data as ProjectImageOut;
                const prev = images.find((i) => i.id === updated.id);
                updateImage(updated);
                // If caption changed, move fulfillment to new caption
                if (prev && prev.caption !== updated.caption) {
                    updateTokenUnfulfilled(prev.caption);
                    updateTokenFulfilled(updated.caption, updated.id);
                }
            },
        },
    });

    const mutate = (caption: string) => {
        mutation.mutate({ projectId, imageId, data: { caption } });
    };

    return { ...mutation, mutate };
}

/**
 * Deletes an image. Call `mutate()` to trigger.
 */
export function useDeleteImage(projectId: string, imageId: string) {
    const removeImage = useImageStore((s) => s.removeImage);
    const images = useImageStore((s) => s.images);
    const updateTokenUnfulfilled = useImageStore((s) => s.updateTokenUnfulfilled);
    const mutation = useCorporaCommanderApiImagesDeleteImage({
        mutation: {
            onSuccess: () => {
                const deleted = images.find((i) => i.id === imageId);
                if (deleted) {
                    // Un-fulfill matching token across the project
                    updateTokenUnfulfilled(deleted.caption);
                }
                removeImage(imageId);
            },
        },
    });

    const mutate = () => {
        mutation.mutate({ projectId, imageId });
    };

    return { ...mutation, mutate };
}
