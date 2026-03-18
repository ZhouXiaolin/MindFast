import { useCallback, useEffect, useRef, useState } from "react";
import type { Model } from "@mariozechner/pi-ai";
import type { Agent } from "@mariozechner/pi-agent-core";
import { getEnabledModels, getModelForProvider } from "../../init";

export interface EnabledModelOption {
  providerId: string;
  modelId: string;
  name: string;
}

interface UseChatModelMenuParams {
  agent: Agent | null;
  syncAgentState: (agent: Agent) => void;
}

interface UseChatModelMenuResult {
  enabledModels: EnabledModelOption[];
  handleSelectModelOption: (providerId: string, modelId: string) => Promise<void>;
  handleToggleMenu: () => Promise<void>;
  isLoadingModels: boolean;
  modelMenuOpen: boolean;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
}

export function useChatModelMenu({
  agent,
  syncAgentState,
}: UseChatModelMenuParams): UseChatModelMenuResult {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [enabledModels, setEnabledModels] = useState<EnabledModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modelMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModelMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modelMenuOpen]);

  const handleToggleMenu = useCallback(async () => {
    if (!enabledModels.length && !isLoadingModels) {
      setIsLoadingModels(true);
      try {
        setEnabledModels(await getEnabledModels());
      } catch (error) {
        console.error("Failed to load enabled models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    }

    setModelMenuOpen((open) => !open);
  }, [enabledModels.length, isLoadingModels]);

  const handleSelectModelOption = useCallback(
    async (providerId: string, modelId: string) => {
      if (!agent) {
        return;
      }

      try {
        const model = await getModelForProvider(providerId, modelId);
        agent.setModel(model as Model<any>);
        syncAgentState(agent);
        setModelMenuOpen(false);
      } catch (error) {
        console.error("Failed to select model:", error);
      }
    },
    [agent, syncAgentState]
  );

  return {
    enabledModels,
    handleSelectModelOption,
    handleToggleMenu,
    isLoadingModels,
    modelMenuOpen,
    modelMenuRef,
  };
}
