// src/stores/LLMConfigStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProviderType = "openai" | "lmstudio" | "xai";

export interface OpenAIConfig {
    provider: "openai";
    apiKey: string;
    defaultModel?: string;
    baseUrl?: string;
}

export interface LMStudioConfig {
    provider: "lmstudio";
    baseUrl: string;
    defaultModel: string;
    apiKey?: string;
}

export interface XAIConfig {
    provider: "xai";
    apiKey: string;
    defaultModel?: string;
    baseUrl?: string;
}

export type LLMConfig = OpenAIConfig | LMStudioConfig | XAIConfig;

interface LLMState {
    configs: Record<ProviderType, LLMConfig | null>;
    defaultProvider: ProviderType | null;
    availableModels: Record<ProviderType, string[]>;

    addConfig: (cfg: LLMConfig) => void;
    removeConfig: (provider: ProviderType) => void;
    setDefault: (provider: ProviderType) => void;
    clearAll: () => void;
    setAvailableModels: (provider: ProviderType, models: string[]) => void;
}

export const useLLMConfigStore = create<LLMState>()(
    persist(
        (set) => ({
            configs: { openai: null, lmstudio: null, xai: null },
            defaultProvider: null,
            availableModels: { openai: [], lmstudio: [], xai: [] },

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

            clearAll: () =>
                set({
                    configs: { openai: null, lmstudio: null, xai: null },
                    defaultProvider: null,
                    availableModels: { openai: [], lmstudio: [], xai: [] },
                }),

            setAvailableModels: (provider, models) =>
                set((s) => ({
                    availableModels: {
                        ...s.availableModels,
                        [provider]: models,
                    },
                })),
        }),
        {
            name: "corpora-llm-config",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
