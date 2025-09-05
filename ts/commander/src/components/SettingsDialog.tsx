import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { ProviderType, LLMConfig } from "@/stores/LLMConfigStore";

interface SettingsDialogProps {
    trigger?: React.ReactNode;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
    const { configs, defaultProvider, availableModels, addConfig, setAvailableModels, setDefault, removeConfig } = useLLMConfigStore();
    // availableModels may be undefined while the store initializes — provide a safe fallback
    const safeAvailableModels = {
        openai: availableModels?.openai ?? [],
        lmstudio: availableModels?.lmstudio ?? [],
        xai: availableModels?.xai ?? [],
        claude: availableModels?.claude ?? [],
    };
    const [open, setOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    // OpenAI state
    const existingOpenAI = configs.openai;
    const openaiInitialModels = safeAvailableModels.openai.length > 0 ? safeAvailableModels.openai : existingOpenAI?.defaultModel ? [existingOpenAI.defaultModel] : [];
    const [openaiApiKey, setOpenaiApiKey] = useState(existingOpenAI?.apiKey || "");
    const [openaiModels, setOpenaiModels] = useState<string[]>(openaiInitialModels);
    const [openaiSelectedModel, setOpenaiSelectedModel] = useState(existingOpenAI?.defaultModel || 'gpt-4');
    const [openaiValidated, setOpenaiValidated] = useState<boolean>(Boolean(existingOpenAI?.defaultModel));
    const [openaiLoading, setOpenaiLoading] = useState(false);
    const [openaiError, setOpenaiError] = useState<string | null>(null);
    const [openaiPing, setOpenaiPing] = useState<string | null>(null);

    // LM Studio state
    const existingLM = configs.lmstudio;
    const lmInitialModels = safeAvailableModels.lmstudio.length > 0 ? safeAvailableModels.lmstudio : existingLM?.defaultModel ? [existingLM.defaultModel] : [];
    const [lmBaseUrl, setLmBaseUrl] = useState(existingLM?.baseUrl || 'http://localhost:1234/v1');
    const [lmModels, setLmModels] = useState<string[]>(lmInitialModels);
    const [lmSelectedModel, setLmSelectedModel] = useState(existingLM?.defaultModel || '');
    const [lmValidated, setLmValidated] = useState<boolean>(Boolean(existingLM?.defaultModel));
    const [lmLoading, setLmLoading] = useState(false);
    const [lmError, setLmError] = useState<string | null>(null);

    // xAI state
    const existingXAI = configs.xai;
    const xaiInitialModels = safeAvailableModels.xai.length > 0 ? safeAvailableModels.xai : existingXAI?.defaultModel ? [existingXAI.defaultModel] : [];
    const [xaiApiKey, setXaiApiKey] = useState(existingXAI?.apiKey || '');
    const [xaiModels, setXaiModels] = useState<string[]>(xaiInitialModels);
    const [xaiSelectedModel, setXaiSelectedModel] = useState(existingXAI?.defaultModel || 'grok-beta');
    const [xaiValidated, setXaiValidated] = useState<boolean>(Boolean(existingXAI?.defaultModel));
    const [xaiLoading, setXaiLoading] = useState(false);
    const [xaiError, setXaiError] = useState<string | null>(null);
    const [xaiPing, setXaiPing] = useState<string | null>(null);

    // Claude state
    const existingClaude = configs.claude;
    const claudeInitialModels = safeAvailableModels.claude.length > 0 ? safeAvailableModels.claude : existingClaude?.defaultModel ? [existingClaude.defaultModel] : [];
    const [claudeApiKey, setClaudeApiKey] = useState(existingClaude?.apiKey || '');
    const [claudeModels, setClaudeModels] = useState<string[]>(claudeInitialModels);
    const [claudeSelectedModel, setClaudeSelectedModel] = useState(existingClaude?.defaultModel || 'claude-3-sonnet-20240229');
    const [claudeValidated, setClaudeValidated] = useState<boolean>(Boolean(existingClaude?.defaultModel));
    const [claudeLoading, setClaudeLoading] = useState(false);
    const [claudeError, setClaudeError] = useState<string | null>(null);
    const [claudePing, setClaudePing] = useState<string | null>(null);

    const togglePasswordVisibility = (provider: ProviderType) => {
        setShowPasswords(prev => ({
            ...prev,
            [provider]: !prev[provider]
        }));
    };

    // keep availableModels persisted when we actually discover lists
    useEffect(() => {
        if (openaiModels.length > 1 || (existingOpenAI?.defaultModel && openaiModels[0] !== existingOpenAI.defaultModel)) {
            setAvailableModels('openai', openaiModels);
        }
    }, [openaiModels, existingOpenAI?.defaultModel, setAvailableModels]);

    useEffect(() => {
        if (lmModels.length > 1 || (existingLM?.defaultModel && lmModels[0] !== existingLM.defaultModel)) {
            setAvailableModels('lmstudio', lmModels);
        }
    }, [lmModels, existingLM?.defaultModel, setAvailableModels]);

    useEffect(() => {
        if (xaiModels.length > 1 || (existingXAI?.defaultModel && xaiModels[0] !== existingXAI.defaultModel)) {
            setAvailableModels('xai', xaiModels);
        }
    }, [xaiModels, existingXAI?.defaultModel, setAvailableModels]);

    useEffect(() => {
        if (claudeModels.length > 1 || (existingClaude?.defaultModel && claudeModels[0] !== existingClaude.defaultModel)) {
            setAvailableModels('claude', claudeModels);
        }
    }, [claudeModels, existingClaude?.defaultModel, setAvailableModels]);

    // keep validated flags in sync with stored defaults
    useEffect(() => {
        setOpenaiValidated(openaiSelectedModel === existingOpenAI?.defaultModel);
    }, [openaiSelectedModel, existingOpenAI?.defaultModel]);

    useEffect(() => {
        setLmValidated(lmSelectedModel === existingLM?.defaultModel);
    }, [lmSelectedModel, existingLM?.defaultModel]);

    useEffect(() => {
        setXaiValidated(xaiSelectedModel === existingXAI?.defaultModel);
    }, [xaiSelectedModel, existingXAI?.defaultModel]);

    useEffect(() => {
        setClaudeValidated(claudeSelectedModel === existingClaude?.defaultModel);
    }, [claudeSelectedModel, existingClaude?.defaultModel]);

    const handleInputChange = (provider: ProviderType, field: string, value: string) => {
        switch (provider) {
            case 'openai':
                if (field === 'apiKey') setOpenaiApiKey(value);
                if (field === 'defaultModel') setOpenaiSelectedModel(value);
                if (field === 'baseUrl') {/* will store on save */}
                break;
            case 'lmstudio':
                if (field === 'baseUrl') setLmBaseUrl(value);
                if (field === 'defaultModel') setLmSelectedModel(value);
                break;
            case 'xai':
                if (field === 'apiKey') setXaiApiKey(value);
                if (field === 'defaultModel') setXaiSelectedModel(value);
                if (field === 'baseUrl') {/* optional */}
                break;
            case 'claude':
                if (field === 'apiKey') setClaudeApiKey(value);
                if (field === 'defaultModel') setClaudeSelectedModel(value);
                if (field === 'baseUrl') {/* optional */}
                break;
        }
    };

    const handleSave = (provider: ProviderType) => {
        let cfg: LLMConfig | null = null;
        switch (provider) {
            case 'openai':
                cfg = { provider: 'openai', apiKey: openaiApiKey, defaultModel: openaiSelectedModel };
                break;
            case 'lmstudio':
                cfg = { provider: 'lmstudio', baseUrl: lmBaseUrl, defaultModel: lmSelectedModel };
                break;
            case 'xai':
                cfg = { provider: 'xai', apiKey: xaiApiKey, defaultModel: xaiSelectedModel };
                break;
            case 'claude':
                cfg = { provider: 'claude', apiKey: claudeApiKey, defaultModel: claudeSelectedModel };
                break;
        }

        if (!cfg) return;
        addConfig(cfg);
        if (!defaultProvider || !configs[defaultProvider]) {
            setDefault(provider);
        }
    };

    const handleSetDefault = (provider: ProviderType) => {
        if (configs[provider]) {
            setDefault(provider);
        }
    };

    const handleRemove = (provider: ProviderType) => {
        removeConfig(provider);
        // reset local state for that provider
        switch (provider) {
            case 'openai':
                setOpenaiApiKey('');
                setOpenaiSelectedModel('gpt-4');
                setOpenaiModels([]);
                setOpenaiValidated(false);
                break;
            case 'lmstudio':
                setLmBaseUrl('http://localhost:1234/v1');
                setLmSelectedModel('');
                setLmModels([]);
                setLmValidated(false);
                break;
            case 'xai':
                setXaiApiKey('');
                setXaiSelectedModel('grok-beta');
                setXaiModels([]);
                setXaiValidated(false);
                break;
            case 'claude':
                setClaudeApiKey('');
                setClaudeSelectedModel('claude-3-sonnet-20240229');
                setClaudeModels([]);
                setClaudeValidated(false);
                break;
        }
    };

    const isConfigValid = (provider: ProviderType) => {
        switch (provider) {
            case 'openai':
                return openaiValidated;
            case 'lmstudio':
                return lmValidated;
            case 'xai':
                return xaiValidated;
            case 'claude':
                return claudeValidated;
            default:
                return false;
        }
    };

    // kept for parity but not used in this implementation

    const renderProviderConfig = (provider: ProviderType) => {
        const isConfigured = !!configs[provider];
        const isDefault = defaultProvider === provider;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize">{provider} Configuration</h3>
                    <div className="flex gap-2">
                        {isConfigured && (
                            <>
                                <Button
                                    variant={isDefault ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleSetDefault(provider)}
                                    disabled={isDefault}
                                >
                                    {isDefault ? "Default" : "Set as Default"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemove(provider)}
                                >
                                    Remove
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {provider === 'openai' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords[provider] ? "text" : "password"}
                                    placeholder="sk-..."
                                    value={openaiApiKey}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
                                    className="w-full"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => togglePasswordVisibility(provider)}
                                >
                                    {showPasswords[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {openaiError && <p className="text-red-600">{openaiError}</p>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Model</label>
                            <Select
                                value={openaiSelectedModel}
                                onValueChange={(value) => handleInputChange(provider, 'defaultModel', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {openaiModels.length > 0 ? (
                                        openaiModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)
                                    ) : (
                                        <>
                                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL (Optional)</label>
                            <Input
                                placeholder="https://api.openai.com/v1"
                                // not editable-persisted field here; kept for parity with original form
                                value={existingOpenAI?.baseUrl || ''}
                                onChange={() => {}}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button onClick={async () => await discoverOpenAIModels()} disabled={openaiLoading || !openaiApiKey.trim()}>
                                {openaiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (openaiModels.length ? 'Refresh models' : 'Fetch models')}
                            </Button>

                            <Button onClick={async () => await validateOpenAI()} disabled={openaiLoading || !openaiApiKey.trim() || !openaiSelectedModel}>
                                {openaiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Validate'}
                            </Button>

                            {openaiValidated && <CheckCircle2 className="text-green-600 h-5 w-5" />}
                        </div>
                        {openaiPing && (
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                                <p className="text-sm italic text-neutral-700">Ping:</p>
                                <p className="mt-1">{openaiPing}</p>
                            </div>
                        )}
                    </>
                )}

                {provider === 'lmstudio' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL</label>
                            <Input
                                placeholder="http://localhost:1234/v1"
                                value={lmBaseUrl}
                                onChange={(e) => handleInputChange(provider, 'baseUrl', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {lmError && <p className="text-red-600">{lmError}</p>}

                        {lmModels.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select default model</label>
                                <Select value={lmSelectedModel} onValueChange={(v) => handleInputChange(provider, 'defaultModel', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lmModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Button onClick={async () => await discoverLMModels()} disabled={lmLoading || !lmBaseUrl.trim()}>
                                {lmLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (lmModels.length ? 'Refresh models' : 'Discover models')}
                            </Button>

                            <Button onClick={async () => await validateLMModel()} disabled={lmLoading || !lmBaseUrl.trim() || !lmSelectedModel}>
                                {lmLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Validate model'}
                            </Button>

                            {lmValidated && <CheckCircle2 className="text-green-600 h-5 w-5" />}
                        </div>
                    </>
                )}

                {provider === 'xai' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords[provider] ? "text" : "password"}
                                    placeholder="xai-..."
                                    value={xaiApiKey}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
                                    className="w-full"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => togglePasswordVisibility(provider)}
                                >
                                    {showPasswords[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {xaiError && <p className="text-red-600">{xaiError}</p>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Model</label>
                            <Select value={xaiSelectedModel} onValueChange={(v) => handleInputChange(provider, 'defaultModel', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {xaiModels.length > 0 ? xaiModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>) : (
                                        <>
                                            <SelectItem value="grok-beta">Grok Beta</SelectItem>
                                            <SelectItem value="grok-vision-beta">Grok Vision Beta</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL (Optional)</label>
                            <Input placeholder="https://api.x.ai/v1" value={existingXAI?.baseUrl || ''} onChange={() => {}} className="w-full" />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button onClick={async () => await discoverXAIModels()} disabled={xaiLoading || !xaiApiKey.trim()}>
                                {xaiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (xaiModels.length ? 'Refresh models' : 'Fetch models')}
                            </Button>

                            <Button onClick={async () => await validateXAIModel()} disabled={xaiLoading || !xaiApiKey.trim() || !xaiSelectedModel}>
                                {xaiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Validate model'}
                            </Button>

                            {xaiValidated && <CheckCircle2 className="text-green-600 h-5 w-5" />}
                        </div>
                        {xaiPing && (
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                                <p className="text-sm italic text-neutral-700">Ping:</p>
                                <p className="mt-1">{xaiPing}</p>
                            </div>
                        )}
                    </>
                )}

                {provider === 'claude' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords[provider] ? "text" : "password"}
                                    placeholder="sk-ant-..."
                                    value={claudeApiKey}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
                                    className="w-full"
                                />
                                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => togglePasswordVisibility(provider)}>
                                    {showPasswords[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {claudeError && <p className="text-red-600">{claudeError}</p>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Model</label>
                            <Select value={claudeSelectedModel} onValueChange={(v) => handleInputChange(provider, 'defaultModel', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {claudeModels.length > 0 ? claudeModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>) : (
                                        <>
                                            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                                            <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                                            <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL (Optional)</label>
                            <Input placeholder="https://api.anthropic.com" value={existingClaude?.baseUrl || ''} onChange={() => {}} className="w-full" />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button onClick={async () => await discoverClaudeModels()} disabled={claudeLoading || !claudeApiKey.trim()}>
                                {claudeLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (claudeModels.length ? 'Refresh models' : 'Fetch models')}
                            </Button>

                            <Button onClick={async () => await validateClaude()} disabled={claudeLoading || !claudeApiKey.trim() || !claudeSelectedModel}>
                                {claudeLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Validate'}
                            </Button>

                            {claudeValidated && <CheckCircle2 className="text-green-600 h-5 w-5" />}
                        </div>
                        {claudePing && (
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                                <p className="text-sm italic text-neutral-700">Ping:</p>
                                <p className="mt-1">{claudePing}</p>
                            </div>
                        )}
                    </>
                )}

                <Button onClick={() => handleSave(provider)} disabled={!isConfigValid(provider)} className="w-full">
                    Save {provider.charAt(0).toUpperCase() + provider.slice(1)} Configuration
                </Button>
            </div>
        );
    };

    // --- discovery / validation helpers (copied from onboarding pages)
    const errorMessage = (e: unknown) => {
        if (e instanceof Error) return e.message;
        return String(e);
    };
    const discoverOpenAIModels = async () => {
        setOpenaiLoading(true);
        setOpenaiError(null);
        try {
            const res = await fetch('/api/commander/openai/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: openaiApiKey }) });
            if (!res.ok) throw new Error(await res.text() || 'Fetch failed');
            const { models: list }: { models: string[] } = await res.json();
            if (!list.length) throw new Error('No models returned');
            setOpenaiModels(list);
            setOpenaiSelectedModel(list[0]);
        } catch (e: unknown) {
            setOpenaiError(errorMessage(e));
        } finally {
            setOpenaiLoading(false);
        }
    };

    const validateOpenAI = async () => {
        setOpenaiLoading(true);
        setOpenaiError(null);
        setOpenaiPing(null);
        try {
            const res = await fetch('/api/commander/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'openai', api_key: openaiApiKey, model: openaiSelectedModel, messages: [{ role: 'system', text: 'You are a helpful assistant.' }, { role: 'user', text: 'Ping' }] }) });
            if (!res.ok) throw new Error(await res.text() || 'Validation failed');
            const { text } = await res.json();
            setOpenaiPing(text);
            setOpenaiValidated(true);
        } catch (e: unknown) {
            setOpenaiError(errorMessage(e));
            setOpenaiValidated(false);
        } finally {
            setOpenaiLoading(false);
        }
    };

    const discoverLMModels = async () => {
        setLmLoading(true);
        setLmError(null);
        try {
            const res = await fetch('/api/commander/lmstudio/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base_url: lmBaseUrl }) });
            if (!res.ok) throw new Error(await res.text() || 'Discovery failed');
            const payload: { models: { data: Array<{ id: string }> } } = await res.json();
            const ids = payload.models.data.map(m => m.id);
            if (!ids.length) throw new Error('No models found');
            setLmModels(ids);
            setLmSelectedModel(ids[0]);
        } catch (e: unknown) {
            setLmError(errorMessage(e));
        } finally {
            setLmLoading(false);
        }
    };

    const validateLMModel = async () => {
        setLmLoading(true);
        setLmError(null);
        try {
            const res = await fetch('/api/commander/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'local', base_url: lmBaseUrl, model: lmSelectedModel, messages: [{ role: 'system', text: 'You are a helpful assistant.' }, { role: 'user', text: 'Hello, world!' }] }) });
            if (!res.ok) throw new Error(await res.text() || 'Validation failed');
            setLmValidated(true);
        } catch (e: unknown) {
            setLmError(errorMessage(e));
        } finally {
            setLmLoading(false);
        }
    };

    const discoverXAIModels = async () => {
        setXaiLoading(true);
        setXaiError(null);
        setXaiPing(null);
        try {
            const res = await fetch('/api/commander/xai/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: xaiApiKey }) });
            if (!res.ok) throw new Error((await res.text()) || 'Fetch models failed');
            const { models: list }: { models: string[] } = await res.json();
            if (!list.length) throw new Error('No models returned');
            setXaiModels(list);
            setXaiSelectedModel(list[0]);
        } catch (e: unknown) {
            setXaiError(errorMessage(e));
        } finally {
            setXaiLoading(false);
        }
    };

    const validateXAIModel = async () => {
        setXaiLoading(true);
        setXaiError(null);
        setXaiPing(null);
        try {
            const res = await fetch('/api/commander/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'xai', api_key: xaiApiKey, model: xaiSelectedModel, messages: [{ role: 'system', text: 'You are a helpful assistant.' }, { role: 'user', text: 'Ping' }] }) });
            if (!res.ok) throw new Error((await res.text()) || 'Validation failed');
            const { text } = await res.json();
            setXaiPing(text);
            setXaiValidated(true);
        } catch (e: unknown) {
            setXaiError(errorMessage(e));
            setXaiValidated(false);
        } finally {
            setXaiLoading(false);
        }
    };

    const discoverClaudeModels = async () => {
        setClaudeLoading(true);
        setClaudeError(null);
        try {
            const res = await fetch('/api/commander/claude/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: claudeApiKey }) });
            if (!res.ok) throw new Error(await res.text() || 'Fetch failed');
            const { models: list }: { models: string[] } = await res.json();
            if (!list.length) throw new Error('No models returned');
            setClaudeModels(list);
            setClaudeSelectedModel(list[0]);
        } catch (e: unknown) {
            setClaudeError(errorMessage(e));
        } finally {
            setClaudeLoading(false);
        }
    };

    const validateClaude = async () => {
        setClaudeLoading(true);
        setClaudeError(null);
        setClaudePing(null);
        try {
            const res = await fetch('/api/commander/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'claude', api_key: claudeApiKey, model: claudeSelectedModel, messages: [{ role: 'system', text: 'You are a helpful assistant.' }, { role: 'user', text: 'Ping' }] }) });
            if (!res.ok) throw new Error(await res.text() || 'Validation failed');
            const { text } = await res.json();
            setClaudePing(text);
            setClaudeValidated(true);
        } catch (e: unknown) {
            setClaudeError(errorMessage(e));
            setClaudeValidated(false);
        } finally {
            setClaudeLoading(false);
        }
    };

    const defaultTrigger = (
        <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
                    <Tabs defaultValue="openai" orientation="horizontal">
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="openai">OpenAI</TabsTrigger>
                            <TabsTrigger value="lmstudio">LM Studio</TabsTrigger>
                            <TabsTrigger value="xai">xAI</TabsTrigger>
                            <TabsTrigger value="claude">Claude</TabsTrigger>
                        </TabsList>
                        <TabsContent value="openai" className="mt-4">
                            {renderProviderConfig('openai')}
                        </TabsContent>
                        <TabsContent value="lmstudio" className="mt-4">
                            {renderProviderConfig('lmstudio')}
                        </TabsContent>
                        <TabsContent value="xai" className="mt-4">
                            {renderProviderConfig('xai')}
                        </TabsContent>
                        <TabsContent value="claude" className="mt-4">
                            {renderProviderConfig('claude')}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
