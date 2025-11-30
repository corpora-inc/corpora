import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { useImageStore } from "@/stores/ImageStore";
import { useGenerateImage } from "@/hooks/useImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageTokenListProps {
    projectId: string;
}

export default function ImageTokenList({ projectId }: ImageTokenListProps) {
    const tokens = useImageStore((s) => s.tokens);
    const generate = useGenerateImage(projectId);

    const [promptHint, setPromptHint] = useState("");

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
        missingTokens.forEach((t) => {
            generate.mutate(t.caption, promptValue);
        });
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                        Image Tokens
                    </h2>
                    <p className="text-xs text-gray-500">
                        {tokens.length} total · {fulfilledTokens.length} with
                        images · {missingTokens.length} missing
                    </p>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAllMissing}
                    disabled={
                        missingTokens.length === 0 || generate.isPending
                    }
                >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate missing
                </Button>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                    Optional style / prompt hint
                </label>
                <Input
                    value={promptHint}
                    onChange={(e) => setPromptHint(e.target.value)}
                    placeholder="e.g. clean line art, black-and-white, kid-friendly"
                />
                <p className="text-[0.7rem] text-gray-500 mt-0.5">
                    Used together with each IMAGE caption when
                    generating.
                </p>
            </div>

            <div className="border rounded-md max-h-72 overflow-auto divide-y bg-white">
                {tokens.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                        No <code>{`{{IMAGE: …}}`}</code> tokens found in this
                        project yet.
                    </div>
                )}

                {tokens.map((token) => (
                    <div
                        key={token.caption}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                                {token.caption}
                            </div>
                            <div className="text-xs text-gray-500">
                                {token.fulfilled
                                    ? "Linked to an image"
                                    : "No image yet"}
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant={token.fulfilled ? "outline" : "default"}
                            onClick={() => handleGenerate(token.caption)}
                            disabled={generate.isPending}
                        >
                            <Sparkles className="mr-1 h-3 w-3" />
                            {token.fulfilled ? "Regenerate" : "Generate"}
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
}
