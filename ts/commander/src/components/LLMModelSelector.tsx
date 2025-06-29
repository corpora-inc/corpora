// ts/commander/src/components/LLMModelSelector.tsx

import { useMemo } from "react"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { useLLMConfigStore } from "@/stores/LLMConfigStore"
import type { ProviderType } from "@/stores/LLMConfigStore"

export interface LLMModelSelectorProps {
    provider: ProviderType
    model: string
    onProviderChange: (provider: ProviderType) => void
    onModelChange: (model: string) => void
}

export function LLMModelSelector({
    provider,
    model,
    onProviderChange,
    onModelChange,
}: LLMModelSelectorProps) {
    const { configs, availableModels } = useLLMConfigStore()

    const providers = useMemo(
        () =>
            (Object.keys(configs) as ProviderType[]).filter(
                (p) => configs[p] !== null
            ),
        [configs]
    )

    const models = availableModels[provider] ?? []

    return (
        <div className="grid grid-cols-2 gap-3">
            <Select
                value={provider}
                onValueChange={(v) => onProviderChange(v as ProviderType)}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                    {providers.map((p) => (
                        <SelectItem key={p} value={p}>
                            {p.toUpperCase()}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                    {models.map((m) => (
                        <SelectItem key={m} value={m}>
                            {m}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
