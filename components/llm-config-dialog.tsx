"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllProviders, getProviderById, LLMConfig, LLMProvider } from '@/lib/llm-providers';
import { ExternalLink, Info, Key, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LLMConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSubmit: (config: LLMConfig) => void;
  currentConfig?: LLMConfig;
}

export function LLMConfigDialog({ open, onOpenChange, onConfigSubmit, currentConfig }: LLMConfigDialogProps) {
  const [config, setConfig] = useState<LLMConfig>({
    providerId: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const providers = getAllProviders();

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const selectedProvider = getProviderById(config.providerId);

  const handleProviderChange = (providerId: string) => {
    const provider = getProviderById(providerId);
    if (provider) {
      setConfig(prev => ({
        ...prev,
        providerId,
        model: provider.defaultModel,
        maxTokens: provider.maxTokens || 1000,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProvider?.requiresApiKey && !config.apiKey?.trim()) {
      alert(`API key is required for ${selectedProvider.name}`);
      return;
    }

    onConfigSubmit(config);
    onOpenChange(false);
  };

  const getProviderInfo = (provider: LLMProvider) => {
    const info: { [key: string]: string } = {
      openai: "Official OpenAI API. Requires API key from platform.openai.com",
      anthropic: "Claude models via Anthropic API. Requires API key from console.anthropic.com",
      groq: "Ultra-fast inference. Get API key from console.groq.com",
      together: "Open source models. Get API key from api.together.xyz",
      ollama: "Run models locally. Install Ollama and start the service",
      perplexity: "Search-enhanced models. Get API key from perplexity.ai",
      gemini: "Google's multimodal AI. Get API key from Google AI Studio"
    };
    return info[provider.id] || "Configure your LLM provider";
  };

  const getProviderUrl = (provider: LLMProvider) => {
    const urls: { [key: string]: string } = {
      openai: "https://platform.openai.com/api-keys",
      anthropic: "https://console.anthropic.com/",
      groq: "https://console.groq.com/keys",
      together: "https://api.together.xyz/settings/api-keys",
      ollama: "https://ollama.ai/",
      perplexity: "https://www.perplexity.ai/settings/api",
      gemini: "https://aistudio.google.com/app/apikey"
    };
    return urls[provider.id];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            LLM Configuration
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your preferred AI model provider and settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="provider" className="text-white data-[state=active]:bg-gray-700">
              Provider & Model
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-white data-[state=active]:bg-gray-700">
              Advanced Settings
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <TabsContent value="provider" className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-white">AI Provider</Label>
                <Select value={config.providerId} onValueChange={handleProviderChange}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {providers.map((provider) => (
                      <SelectItem 
                        key={provider.id} 
                        value={provider.id}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <span>{provider.name}</span>
                          {!provider.requiresApiKey && (
                            <span className="text-xs bg-green-600 px-1 rounded">Local</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Info Card */}
              {selectedProvider && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      {selectedProvider.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      {getProviderInfo(selectedProvider)}
                    </CardDescription>
                  </CardHeader>
                  {selectedProvider.requiresApiKey && getProviderUrl(selectedProvider) && (
                    <CardContent className="pt-0">
                      <a
                        href={getProviderUrl(selectedProvider)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Get API Key
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* API Key */}
              {selectedProvider?.requiresApiKey && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-white flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={selectedProvider.apiKeyFormat}
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    required={selectedProvider.requiresApiKey}
                  />
                </div>
              )}

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model" className="text-white">Model</Label>
                <Select value={config.model} onValueChange={(model) => setConfig(prev => ({ ...prev, model }))}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {selectedProvider?.availableModels.map((model) => (
                      <SelectItem 
                        key={model} 
                        value={model}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Temperature</Label>
                  <span className="text-sm text-gray-400">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature || 0.7]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Higher values make output more random, lower values more focused
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Max Tokens</Label>
                  <span className="text-sm text-gray-400">{config.maxTokens}</span>
                </div>
                <Slider
                  value={[config.maxTokens || 1000]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, maxTokens: value }))}
                  max={selectedProvider?.maxTokens || 4096}
                  min={100}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Maximum number of tokens in the response
                </p>
              </div>

              {/* Custom Base URL */}
              <div className="space-y-2">
                <Label htmlFor="customBaseURL" className="text-white">
                  Custom Base URL (Optional)
                </Label>
                <Input
                  id="customBaseURL"
                  type="url"
                  placeholder={selectedProvider?.baseURL}
                  value={config.customBaseURL || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, customBaseURL: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-500">
                  Override the default API endpoint
                </p>
              </div>
            </TabsContent>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Configuration
              </Button>
            </div>
          </form>
        </Tabs>

        <div className="text-xs text-gray-500 space-y-1 mt-4 pt-4 border-t border-gray-700">
          <p>• Your configuration is stored locally in your browser</p>
          <p>• API keys are never sent to our servers, only to your chosen provider</p>
          <p>• Different providers may have different pricing and rate limits</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
