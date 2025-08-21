import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { ProviderType } from "@/stores/LLMConfigStore";

export function useProviderStatus() {
    const { configs, defaultProvider } = useLLMConfigStore();
    
    const configuredProviders = Object.entries(configs)
        .filter(([, config]) => config !== null)
        .map(([provider]) => provider as ProviderType);
    
    const hasAnyProvider = configuredProviders.length > 0;
    const hasDefaultProvider = defaultProvider !== null && configs[defaultProvider] !== null;
    
    return {
        configuredProviders,
        hasAnyProvider,
        hasDefaultProvider,
        defaultProvider,
        providerCount: configuredProviders.length
    };
}
