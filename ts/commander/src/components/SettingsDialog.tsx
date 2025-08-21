import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Eye, EyeOff } from "lucide-react";
import { useLLMConfigStore } from "@/stores/LLMConfigStore";
import type { ProviderType, LLMConfig, OpenAIConfig, LMStudioConfig, XAIConfig, ClaudeConfig } from "@/stores/LLMConfigStore";

interface SettingsDialogProps {
    trigger?: React.ReactNode;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
    const { configs, defaultProvider, addConfig, setDefault, removeConfig } = useLLMConfigStore();
    const [open, setOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState<Record<ProviderType, Partial<LLMConfig>>>({
        openai: configs.openai || { provider: 'openai', apiKey: '', defaultModel: 'gpt-4' },
        lmstudio: configs.lmstudio || { provider: 'lmstudio', baseUrl: 'http://localhost:1234/v1', defaultModel: '' },
        xai: configs.xai || { provider: 'xai', apiKey: '', defaultModel: 'grok-beta' },
        claude: configs.claude || { provider: 'claude', apiKey: '', defaultModel: 'claude-3-sonnet-20240229' }
    });

    const togglePasswordVisibility = (provider: ProviderType) => {
        setShowPasswords(prev => ({
            ...prev,
            [provider]: !prev[provider]
        }));
    };

    const handleInputChange = (provider: ProviderType, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value
            }
        }));
    };

    const handleSave = (provider: ProviderType) => {
        const config = formData[provider] as LLMConfig;
        if (isConfigValid(config)) {
            addConfig(config);
            // If this is the first provider being configured, make it default
            if (!defaultProvider || !configs[defaultProvider]) {
                setDefault(provider);
            }
        }
    };

    const handleSetDefault = (provider: ProviderType) => {
        if (configs[provider]) {
            setDefault(provider);
        }
    };

    const handleRemove = (provider: ProviderType) => {
        removeConfig(provider);
        setFormData(prev => ({
            ...prev,
            [provider]: getDefaultFormData(provider)
        }));
    };

    const isConfigValid = (config: Partial<LLMConfig>): config is LLMConfig => {
        switch (config.provider) {
            case 'openai':
                return !!(config as OpenAIConfig).apiKey;
            case 'lmstudio':
                return !!(config as LMStudioConfig).baseUrl && !!(config as LMStudioConfig).defaultModel;
            case 'xai':
                return !!(config as XAIConfig).apiKey;
            case 'claude':
                return !!(config as ClaudeConfig).apiKey;
            default:
                return false;
        }
    };

    const getDefaultFormData = (provider: ProviderType): Partial<LLMConfig> => {
        switch (provider) {
            case 'openai':
                return { provider: 'openai', apiKey: '', defaultModel: 'gpt-4' };
            case 'lmstudio':
                return { provider: 'lmstudio', baseUrl: 'http://localhost:1234/v1', defaultModel: '' };
            case 'xai':
                return { provider: 'xai', apiKey: '', defaultModel: 'grok-beta' };
            case 'claude':
                return { provider: 'claude', apiKey: '', defaultModel: 'claude-3-sonnet-20240229' };
        }
    };

    const renderProviderConfig = (provider: ProviderType) => {
        const config = formData[provider];
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
                                    value={(config as OpenAIConfig).apiKey || ''}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Model</label>
                            <Select
                                value={(config as OpenAIConfig).defaultModel || 'gpt-4'}
                                onValueChange={(value) => handleInputChange(provider, 'defaultModel', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL (Optional)</label>
                            <Input
                                placeholder="https://api.openai.com/v1"
                                value={(config as OpenAIConfig).baseUrl || ''}
                                onChange={(e) => handleInputChange(provider, 'baseUrl', e.target.value)}
                            />
                        </div>
                    </>
                )}

                {provider === 'lmstudio' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL</label>
                            <Input
                                placeholder="http://localhost:1234/v1"
                                value={(config as LMStudioConfig).baseUrl || ''}
                                onChange={(e) => handleInputChange(provider, 'baseUrl', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Model Name</label>
                            <Input
                                placeholder="model-name"
                                value={(config as LMStudioConfig).defaultModel || ''}
                                onChange={(e) => handleInputChange(provider, 'defaultModel', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key (Optional)</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords[provider] ? "text" : "password"}
                                    placeholder="Optional API key"
                                    value={(config as LMStudioConfig).apiKey || ''}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
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
                                    value={(config as XAIConfig).apiKey || ''}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Model</label>
                            <Select
                                value={(config as XAIConfig).defaultModel || 'grok-beta'}
                                onValueChange={(value) => handleInputChange(provider, 'defaultModel', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grok-beta">Grok Beta</SelectItem>
                                    <SelectItem value="grok-vision-beta">Grok Vision Beta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL (Optional)</label>
                            <Input
                                placeholder="https://api.x.ai/v1"
                                value={(config as XAIConfig).baseUrl || ''}
                                onChange={(e) => handleInputChange(provider, 'baseUrl', e.target.value)}
                            />
                        </div>
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
                                    value={(config as ClaudeConfig).apiKey || ''}
                                    onChange={(e) => handleInputChange(provider, 'apiKey', e.target.value)}
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Model</label>
                            <Select
                                value={(config as ClaudeConfig).defaultModel || 'claude-3-sonnet-20240229'}
                                onValueChange={(value) => handleInputChange(provider, 'defaultModel', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base URL (Optional)</label>
                            <Input
                                placeholder="https://api.anthropic.com"
                                value={(config as ClaudeConfig).baseUrl || ''}
                                onChange={(e) => handleInputChange(provider, 'baseUrl', e.target.value)}
                            />
                        </div>
                    </>
                )}

                <Button 
                    onClick={() => handleSave(provider)}
                    disabled={!isConfigValid(config)}
                    className="w-full"
                >
                    Save {provider.charAt(0).toUpperCase() + provider.slice(1)} Configuration
                </Button>
            </div>
        );
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
                    <Tabs defaultValue="providers" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="providers">AI Providers</TabsTrigger>
                            <TabsTrigger value="general">General</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="providers" className="space-y-6">
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
                        </TabsContent>
                        
                        <TabsContent value="general" className="space-y-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">General Settings</h3>
                                <p className="text-sm text-gray-600">
                                    Additional settings and preferences will be added here in future updates.
                                </p>
                                
                                {defaultProvider && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Current Default Provider</label>
                                        <div className="p-3 bg-gray-50 rounded-md">
                                            <span className="capitalize font-medium">{defaultProvider}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
