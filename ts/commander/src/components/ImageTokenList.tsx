import { useMemo, useState } from "react";
import { ArrowUpRight, Sparkles, Trash2, X } from "lucide-react";

import { useImageStore } from "@/stores/ImageStore";
import { useProjectStore } from "@/stores/ProjectStore";
import {
    corporaCommanderApiSectionGetSection,
    corporaCommanderApiSubsectionGetSubsection,
    getCorporaCommanderApiImagesListImageTokensQueryKey,
    useCorporaCommanderApiSectionUpdateSection,
    useCorporaCommanderApiSubsectionUpdateSubsection,
} from "@/api/commander/commander";
import { useGenerateImage } from "@/hooks/useImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageTokenOccurrence } from "@/api/schemas/imageTokenOccurrence";
import { useQueryClient } from "@tanstack/react-query";

interface ImageTokenListProps {
    projectId: string;
}

export default function ImageTokenList({ projectId }: ImageTokenListProps) {
    const tokens = useImageStore((s) => s.tokens);
    const setDrawerOpen = useImageStore((s) => s.setDrawerOpen);

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
    const [deletingToken, setDeletingToken] = useState<string | null>(null);

    const missingTokens = useMemo(
        () => tokens.filter((t) => !t.fulfilled),
        [tokens],
    );
    const fulfilledTokens = useMemo(
        () => tokens.filter((t) => t.fulfilled),
        [tokens],
    );

    const promptValue = promptHint.trim() || undefined;

    const handleGenerate = (caption: string) => {
        generate.mutate(caption, promptValue);
    };

    const handleGenerateAllMissing = () => {
        if (missingTokens.length === 0) return;
        missingTokens.forEach((t) => generate.mutate(t.caption, promptValue));
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

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">Image Tokens</h2>
                    <p className="text-xs text-gray-500">
                        {tokens.length} total · {fulfilledTokens.length} with images ·{" "}
                        {missingTokens.length} missing
                    </p>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAllMissing}
                    disabled={missingTokens.length === 0 || generate.isPending}
                >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate missing
                </Button>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-gray-600">
                        Optional style / prompt hint
                    </label>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={clearPromptHint}
                        disabled={!promptHint.trim()}
                        title="Clear prompt hint"
                    >
                        <X className="h-4 w-4" />
                        <span className="ml-1 text-xs">Clear</span>
                    </Button>
                </div>

                <Input
                    value={promptHint}
                    onChange={(e) => setPromptHint(e.target.value)}
                    placeholder="e.g. clean line art, black-and-white, kid-friendly"
                />

                <p className="text-[0.7rem] text-gray-500 mt-0.5">
                    Used together with each IMAGE caption when generating.
                </p>
            </div>

            <div className="border rounded-md max-h-72 overflow-auto divide-y bg-white">
                {tokens.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                        No <code>{`{{IMAGE: …}}`}</code> tokens found in this project yet.
                    </div>
                )}

                {tokens.map((token) => {
                    const occ0 = token.occurrences?.[0];
                    const canGo = Boolean(occ0);

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
                        <div key={token.caption} className="flex items-center gap-3 px-3 py-2">
                            <div className="flex-1 min-w-0">
                                <div className="truncate text-sm font-medium">{token.caption}</div>
                                <div className="text-xs text-gray-500 truncate">
                                    {token.fulfilled ? "Linked to an image" : "No image yet"}
                                    {locationLabel ? ` · ${locationLabel}` : ""}
                                    {extraCount > 0 ? ` (+${extraCount})` : ""}
                                </div>
                            </div>

                            <div className="w-[260px] shrink-0 flex items-center justify-end gap-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                        handleDeleteToken(token.caption, token.occurrences)
                                    }
                                    disabled={deletingToken === token.caption}
                                    aria-label="Delete token"
                                    title="Delete token"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={!canGo}
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
                                    disabled={generate.isPending || deletingToken === token.caption}
                                >
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    {token.fulfilled ? "Regenerate" : "Generate"}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
