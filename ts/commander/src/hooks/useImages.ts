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
    const mutation = useCorporaCommanderApiImagesCreateImage({
        mutation: {
            onSuccess: (response) => {
                addImage(response.data as ProjectImageOut);
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
    const mutation = useCorporaCommanderApiImagesUpdateImage({
        mutation: {
            onSuccess: (response) => {
                updateImage(response.data as ProjectImageOut);
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
    const mutation = useCorporaCommanderApiImagesDeleteImage({
        mutation: {
            onSuccess: () => {
                removeImage(imageId);
            },
        },
    });

    const mutate = () => {
        mutation.mutate({ projectId, imageId });
    };

    return { ...mutation, mutate };
}
