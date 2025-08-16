export interface llmConfig {
  providerId: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customBaseURL?: string;
}
