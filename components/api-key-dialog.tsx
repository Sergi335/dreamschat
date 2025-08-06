"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySubmit: (apiKey: string) => void;
  currentApiKey?: string;
}

export function ApiKeyDialog({ open, onOpenChange, onApiKeySubmit, currentApiKey }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="h-5 w-5" />
            OpenAI API Key
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your OpenAI API key to start chatting with GPT. Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-white">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Save API Key
            </Button>
            
            <div className="text-center">
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              >
                Get your API key from OpenAI
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </form>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your API key is stored locally in your browser</p>
          <p>• We never store or transmit your API key to our servers</p>
          <p>• You'll need an OpenAI account with available credits</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}