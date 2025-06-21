// src/stores/llmConfigStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProviderType = "openai" | "lmstudio" | "xai";

export interface OpenAIConfig {
    provider: "openai";
    apiKey: string;
}

export interface LMStudioConfig {
    provider: "lmstudio";
    baseUrl: string;       // e.g. "http://host.docker.internal:1234/v1"
    apiKey?: string;       // if LM Studio is token-protected
}

export interface XAIConfig {
    provider: "xai";
    apiKey: string;
    url?: string;          // optional override
}

export type LLMConfig = OpenAIConfig | LMStudioConfig | XAIConfig;

type LLMState = {
    configs: Record<ProviderType, LLMConfig | null>;
    defaultProvider: ProviderType | null;

    addConfig: (cfg: LLMConfig) => void;
    removeConfig: (provider: ProviderType) => void;
    setDefault: (provider: ProviderType) => void;
    clearAll: () => void;
};

export const useLLMConfigStore = create<LLMState>()(
    persist(
        (set, _get) => ({
            configs: { openai: null, lmstudio: null, xai: null },
            defaultProvider: null,

            addConfig: (cfg) =>
                set((s) => ({
                    configs: { ...s.configs, [cfg.provider]: cfg },
                })),

            removeConfig: (provider) =>
                set((s) => ({
                    configs: { ...s.configs, [provider]: null },
                    defaultProvider:
                        s.defaultProvider === provider ? null : s.defaultProvider,
                })),

            setDefault: (provider) =>
                set((s) => ({
                    defaultProvider:
                        s.configs[provider] != null ? provider : s.defaultProvider,
                })),

            clearAll: () => set({ configs: { openai: null, lmstudio: null, xai: null }, defaultProvider: null }),
        }),
        { name: "corpora-llm-config" },
    )
);
