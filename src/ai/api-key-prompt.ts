export type ApiKeyPromptHandler = (provider: string) => Promise<boolean>;

let handler: ApiKeyPromptHandler | null = null;

export function setApiKeyPromptHandler(fn: ApiKeyPromptHandler | null): void {
  handler = fn;
}

export function getApiKeyPromptHandler(): ApiKeyPromptHandler | null {
  return handler;
}
