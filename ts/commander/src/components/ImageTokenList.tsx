import { useMemo } from "react";
import { ArrowUpRight, Sparkles, X } from "lucide-react";

import { useImageStore } from "@/stores/ImageStore";
import { useProjectStore } from "@/stores/ProjectStore";
import { useGenerateImage } from "@/hooks/useImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageTokenOccurrence } from "@/api/schemas/imageTokenOccurrence";

interface ImageTokenListProps {
    projectId: string;
}

export default function ImageTokenList({ projectId }: ImageTokenListProps) {
    const tokens = useImageStore((s) => s.tokens);
    const setDrawerOpen = useImageStore((s) => s.setDrawerOpen);

    const promptHint = useImageStore((s) => s.promptHint);
    const setPromptHint = useImageStore((s) => s.setPromptHint);
    const clearPromptHint = useImageStore((s) => s.clearPromptHint);

    const setSelectedSectionId = useProjectStore((s) => s.setSelectedSectionId);
    const setSelectedSubsectionId = useProjectStore(
        (s) => s.setSelectedSubsectionId,
    );

    const generate = useGenerateImage(projectId);

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
                                    disabled={generate.isPending}
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
