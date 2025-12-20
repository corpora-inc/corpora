import { useEffect, useState } from "react";
import {
    ArrowUpRight,
    Loader2,
    Pencil,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

import { useImageStore } from "@/stores/ImageStore";
import { useProjectStore } from "@/stores/ProjectStore";
import {
    corporaCommanderApiSectionGetSection,
    corporaCommanderApiSubsectionGetSubsection,
    getCorporaCommanderApiImagesListImagesQueryKey,
    getCorporaCommanderApiImagesListImageTokensQueryKey,
    getCorporaCommanderApiSectionGetSectionQueryKey,
    getCorporaCommanderApiSectionListSectionsQueryKey,
    getCorporaCommanderApiSubsectionGetSubsectionQueryKey,
    useCorporaCommanderApiImagesUpdateImage,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander";
import { useDeleteImage, useGenerateImage, useUploadImage } from "@/hooks/useImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageTokenOccurrence } from "@/api/schemas/imageTokenOccurrence";
import type { ImageToken } from "@/api/schemas/imageToken";
import type { ProjectImageOut } from "@/api/schemas/projectImageOut";
import { useQueryClient } from "@tanstack/react-query";

interface ImageTokenListProps {
    projectId: string;
}

export default function ImageTokenList({ projectId }: ImageTokenListProps) {
    const tokens = useImageStore((s) => s.tokens);
    const images = useImageStore((s) => s.images);
    const setDrawerOpen = useImageStore((s) => s.setDrawerOpen);

    const updateImage = useCorporaCommanderApiImagesUpdateImage();
    const updateSection = useCorporaCommanderApiSectionUpdateSection();
    const updateSubsection = useCorporaCommanderApiSubsectionUpdateSubsection();
    const queryClient = useQueryClient();

    const promptHint = useImageStore((s) => s.promptHint);
    const setPromptHint = useImageStore((s) => s.setPromptHint);
    const clearPromptHint = useImageStore((s) => s.clearPromptHint);

    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId);
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId,
    );

    const generate = useGenerateImage(projectId);
    const upload = useUploadImage(projectId);
    const [deletingToken, setDeletingToken] = useState<string | null>(null);
    const [editingToken, setEditingToken] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [savingToken, setSavingToken] = useState<string | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [uploadingToken, setUploadingToken] = useState<string | null>(null);
    const [dragOverToken, setDragOverToken] = useState<string | null>(null);

    const promptValue = promptHint.trim() || undefined;

    const handleGenerate = (caption: string) => {
        generate.mutate(caption, promptValue);
    };

    const goToOccurrence = (occ: ImageTokenOccurrence) => {
        setSelectedSectionId(occ.section_id);

        if (occ.subsection_id) {
            setSelectedSubsectionId(occ.subsection_id);
        } else {
            setSelectedSubsectionId(null);
        }

        setDrawerOpen(false);
    };

    const getImageForToken = (token: ImageToken) => {
        if (token.image_id) {
            return images.find((img) => img.id === token.image_id);
        }
        return images.find((img) => img.caption === token.caption);
    };

    useEffect(() => {
        if (!upload.isPending) setUploadingToken(null);
    }, [upload.isPending]);

    const triggerUpload = (token: ImageToken, file: File) => {
        if (getImageForToken(token)) return;
        setUploadingToken(token.caption);
        upload.mutate(token.caption, file);
    };

    const openFilePicker = (token: ImageToken) => {
        if (getImageForToken(token)) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const file = input.files?.[0];
            if (file) triggerUpload(token, file);
        };
        input.click();
    };

    const replaceImageToken = (
        value: string | null | undefined,
        fromCaption: string,
        toCaption: string,
    ) => {
        if (!value) return { text: value ?? "", changed: false };
        const escaped = fromCaption.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\{\\{IMAGE:\\s*${escaped}\\s*\\}\\}`, "g");
        const replacement = `{{IMAGE: ${toCaption}}}`;
        const next = value.replace(regex, replacement);
        return { text: next, changed: next !== value };
    };

    const removeImageToken = (value: string | null | undefined, caption: string) => {
        if (!value) return { text: value ?? "", changed: false };
        const escaped = caption.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\{\\{IMAGE:\\s*${escaped}\\s*\\}\\}`, "g");
        const next = value.replace(regex, "");
        return { text: next, changed: next !== value };
    };

    const handleDeleteToken = async (caption: string, occurrences?: ImageTokenOccurrence[]) => {
        if (!occurrences || occurrences.length === 0) return;
        const ok = window.confirm(
            `Remove all {{IMAGE: ${caption}}} tokens from their sections/subsections?`,
        );
        if (!ok) return;

        const targets = new Map<
            string,
            { sectionId: string; subsectionId?: string | null }
        >();
        occurrences.forEach((occ) => {
            const key = occ.subsection_id
                ? `sub:${occ.subsection_id}`
                : `sec:${occ.section_id}`;
            if (!targets.has(key)) {
                targets.set(key, {
                    sectionId: occ.section_id,
                    subsectionId: occ.subsection_id ?? null,
                });
            }
        });

        setDeletingToken(caption);
        try {
            for (const target of targets.values()) {
                if (target.subsectionId) {
                    const subRes = await corporaCommanderApiSubsectionGetSubsection(
                        target.subsectionId,
                    );
                    const sub = subRes.data;
                    const content = removeImageToken(sub.content ?? "", caption);
                    const instructions = removeImageToken(
                        sub.instructions ?? "",
                        caption,
                    );

                    if (!content.changed && !instructions.changed) continue;

                    const payload: {
                        content?: string;
                        instructions?: string;
                    } = {};
                    if (content.changed) payload.content = content.text;
                    if (instructions.changed) payload.instructions = instructions.text;

                    await updateSubsection.mutateAsync({
                        subsectionId: target.subsectionId,
                        data: payload,
                    });
                } else {
                    const secRes = await corporaCommanderApiSectionGetSection(
                        target.sectionId,
                    );
                    const sec = secRes.data;
                    const intro = removeImageToken(sec.introduction ?? "", caption);
                    const instructions = removeImageToken(
                        sec.instructions ?? "",
                        caption,
                    );

                    if (!intro.changed && !instructions.changed) continue;

                    const payload: {
                        introduction?: string;
                        instructions?: string;
                    } = {};
                    if (intro.changed) payload.introduction = intro.text;
                    if (instructions.changed) payload.instructions = instructions.text;

                    await updateSection.mutateAsync({
                        sectionId: target.sectionId,
                        data: payload,
                    });
                }
            }
        } finally {
            setDeletingToken(null);
            queryClient.invalidateQueries({
                queryKey: getCorporaCommanderApiImagesListImageTokensQueryKey(
                    projectId,
                ),
            });
        }
    };

    const handleEditToken = (token: ImageToken) => {
        setEditingToken(token.caption);
        setEditingValue(token.caption);
    };

    const handleCancelEdit = () => {
        setEditingToken(null);
        setEditingValue("");
    };

    const handleSaveEdit = async (token: ImageToken) => {
        const nextCaption = editingValue.trim();
        if (!nextCaption || nextCaption === token.caption) {
            handleCancelEdit();
            return;
        }

        setSavingToken(token.caption);
        try {
            const occurrences = token.occurrences ?? [];
            const targets = new Map<
                string,
                { sectionId: string; subsectionId?: string | null }
            >();
            occurrences.forEach((occ) => {
                const key = occ.subsection_id
                    ? `sub:${occ.subsection_id}`
                    : `sec:${occ.section_id}`;
                if (!targets.has(key)) {
                    targets.set(key, {
                        sectionId: occ.section_id,
                        subsectionId: occ.subsection_id ?? null,
                    });
                }
            });

            for (const target of targets.values()) {
                if (target.subsectionId) {
                    const subRes = await corporaCommanderApiSubsectionGetSubsection(
                        target.subsectionId,
                    );
                    const sub = subRes.data;
                    const content = replaceImageToken(
                        sub.content ?? "",
                        token.caption,
                        nextCaption,
                    );
                    const instructions = replaceImageToken(
                        sub.instructions ?? "",
                        token.caption,
                        nextCaption,
                    );

                    if (!content.changed && !instructions.changed) continue;

                    const payload: {
                        content?: string;
                        instructions?: string;
                    } = {};
                    if (content.changed) payload.content = content.text;
                    if (instructions.changed) payload.instructions = instructions.text;

                    await updateSubsection.mutateAsync({
                        subsectionId: target.subsectionId,
                        data: payload,
                    });

                    queryClient.invalidateQueries({
                        queryKey:
                            getCorporaCommanderApiSubsectionGetSubsectionQueryKey(
                                target.subsectionId,
                            ),
                    });
                } else {
                    const secRes = await corporaCommanderApiSectionGetSection(
                        target.sectionId,
                    );
                    const sec = secRes.data;
                    const intro = replaceImageToken(
                        sec.introduction ?? "",
                        token.caption,
                        nextCaption,
                    );
                    const instructions = replaceImageToken(
                        sec.instructions ?? "",
                        token.caption,
                        nextCaption,
                    );

                    if (!intro.changed && !instructions.changed) continue;

                    const payload: {
                        introduction?: string;
                        instructions?: string;
                    } = {};
                    if (intro.changed) payload.introduction = intro.text;
                    if (instructions.changed) payload.instructions = instructions.text;

                    await updateSection.mutateAsync({
                        sectionId: target.sectionId,
                        data: payload,
                    });

                    queryClient.invalidateQueries({
                        queryKey: getCorporaCommanderApiSectionGetSectionQueryKey(
                            target.sectionId,
                        ),
                    });
                }
            }

            if (token.image_id) {
                await updateImage.mutateAsync({
                    projectId,
                    imageId: token.image_id,
                    data: { caption: nextCaption },
                });
            }

            queryClient.invalidateQueries({
                queryKey: getCorporaCommanderApiImagesListImagesQueryKey(projectId),
            });
            queryClient.invalidateQueries({
                queryKey: getCorporaCommanderApiImagesListImageTokensQueryKey(
                    projectId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: getCorporaCommanderApiSectionListSectionsQueryKey(projectId),
            });
        } finally {
            setSavingToken(null);
            setEditingToken(null);
            setEditingValue("");
        }
    };

    return (
        <section className="flex h-full flex-col gap-3">
            <div className="flex items-center gap-2">
                <Input
                    value={promptHint}
                    onChange={(e) => setPromptHint(e.target.value)}
                    placeholder="Optional prompt (e.g. clean line art, black-and-white)"
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={clearPromptHint}
                    disabled={!promptHint.trim()}
                    title="Clear prompt hint"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto divide-y">
                {tokens.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                        No <code>{`{{IMAGE: …}}`}</code> tokens found in this project yet.
                    </div>
                )}

                {tokens.map((token) => {
                    const occ0 = token.occurrences?.[0];
                    const canGo = Boolean(occ0);
                    const isEditing = editingToken === token.caption;
                    const tokenImage = getImageForToken(token);

                    const locationLabel = occ0
                        ? occ0.subsection_title
                            ? `${occ0.section_title} → ${occ0.subsection_title}`
                            : occ0.section_title
                        : null;

                    const extraCount =
                        token.occurrences && token.occurrences.length > 1
                            ? token.occurrences.length - 1
                            : 0;

                    return (
                        <div
                            key={token.caption}
                            className={[
                                "flex items-start gap-3 px-3 py-2 transition",
                                dragOverToken === token.caption
                                    ? "bg-blue-50"
                                    : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            onDragOver={(e) => {
                                if (tokenImage) return;
                                e.preventDefault();
                                setDragOverToken(token.caption);
                            }}
                            onDragLeave={() => {
                                if (dragOverToken === token.caption) {
                                    setDragOverToken(null);
                                }
                            }}
                            onDrop={(e) => {
                                if (tokenImage) return;
                                e.preventDefault();
                                setDragOverToken(null);
                                const file = e.dataTransfer.files?.[0];
                                if (file) triggerUpload(token, file);
                            }}
                        >
                            <button
                                type="button"
                                className="mt-0.5 h-12 w-12 shrink-0 rounded-md border bg-gray-50 overflow-hidden"
                                onClick={() => {
                                    if (tokenImage) setSelectedImageId(tokenImage.id);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) triggerUpload(token, file);
                                }}
                                disabled={!tokenImage && uploadingToken === token.caption}
                                aria-label={
                                    tokenImage
                                        ? "Open image detail"
                                        : "Drop to upload image"
                                }
                                title={
                                    tokenImage
                                        ? "Open image detail"
                                        : "Drop to upload image"
                                }
                            >
                                {tokenImage ? (
                                    <img
                                        src={`http://localhost:8877${tokenImage.image}`}
                                        alt={tokenImage.caption}
                                        className="h-full w-full object-cover"
                                    />
                                ) : uploadingToken === token.caption ? (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[0.6rem] text-gray-400">
                                        —
                                    </div>
                                )}
                            </button>

                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="h-9 text-sm"
                                            placeholder="Image token caption"
                                            autoFocus
                                        />
                                        <div className="text-[0.7rem] text-gray-500">
                                            Updates the section/subsection token and linked image caption.
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="truncate text-sm font-medium">
                                            {token.caption}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {token.fulfilled
                                                ? "Linked to an image"
                                                : "No image yet"}
                                            {locationLabel ? ` · ${locationLabel}` : ""}
                                            {extraCount > 0 ? ` (+${extraCount})` : ""}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="shrink-0 flex items-center justify-end gap-2">
                                {isEditing ? (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSaveEdit(token)}
                                            disabled={savingToken === token.caption}
                                        >
                                            {savingToken === token.caption ? "Saving…" : "Save"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCancelEdit}
                                            disabled={savingToken === token.caption}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleEditToken(token)}
                                        disabled={deletingToken === token.caption}
                                        aria-label="Edit token"
                                        title="Edit token"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}

                                {!tokenImage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openFilePicker(token)}
                                        disabled={
                                            uploadingToken === token.caption ||
                                            savingToken === token.caption ||
                                            isEditing
                                        }
                                        title="Upload image for this token"
                                    >
                                        {uploadingToken === token.caption ? (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        ) : (
                                            <UploadCloud className="mr-1 h-3 w-3" />
                                        )}
                                        Upload
                                    </Button>
                                )}

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                        handleDeleteToken(token.caption, token.occurrences)
                                    }
                                    disabled={
                                        deletingToken === token.caption ||
                                        savingToken === token.caption ||
                                        isEditing
                                    }
                                    aria-label="Delete token"
                                    title="Delete token"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={!canGo || isEditing}
                                    onClick={() => {
                                        if (!occ0) return;
                                        goToOccurrence(occ0);
                                    }}
                                    aria-label="Go to section"
                                    title={locationLabel ?? "Go to section"}
                                >
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="sm"
                                    className="min-w-[150px] justify-center"
                                    variant={token.fulfilled ? "outline" : "default"}
                                    onClick={() => handleGenerate(token.caption)}
                                    disabled={
                                        generate.isPending ||
                                        deletingToken === token.caption ||
                                        savingToken === token.caption ||
                                        isEditing
                                    }
                                >
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    {token.fulfilled ? "Regenerate" : "Generate"}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ImageDetailModal
                projectId={projectId}
                image={images.find((img) => img.id === selectedImageId) ?? null}
                onClear={() => setSelectedImageId(null)}
            />
        </section>
    );
}

function ImageDetailModal({
    projectId,
    image,
    onClear,
}: {
    projectId: string;
    image: ProjectImageOut | null;
    onClear: () => void;
}) {
    if (!image) return null;

    const del = useDeleteImage(projectId, image.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="absolute inset-0" onClick={onClear} />
            <div className="relative z-10 flex h-[88vh] w-[92vw] max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                            Image Detail
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                            {image.caption}
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={onClear}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto">
                    <img
                        src={`http://localhost:8877${image.image}`}
                        alt={image.caption}
                        className="max-h-none max-w-none object-contain"
                    />
                </div>

                <div className="flex items-center justify-between border-t px-5 py-4">
                    <div />
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                            if (confirm(`Delete image for caption "${image.caption}"?`)) {
                                del.mutate();
                                onClear();
                            }
                        }}
                        disabled={del.isPending}
                    >
                        {del.isPending ? "Deleting…" : "Delete image"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
