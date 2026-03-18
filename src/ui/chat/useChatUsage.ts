import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { formatUsage, type Usage } from "../../utils/format";

interface UseChatUsageResult {
  hasUsage: boolean;
  usageText: string;
  usageTotals: Usage;
}

export function useChatUsage(messages: AgentMessage[]): UseChatUsageResult {
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalCost = 0;

  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }

    const usage = (message as { usage?: Usage }).usage;
    if (!usage) {
      continue;
    }

    totalInput += usage.input ?? 0;
    totalOutput += usage.output ?? 0;
    totalCacheRead += usage.cacheRead ?? 0;
    totalCacheWrite += usage.cacheWrite ?? 0;
    totalCost += usage.cost?.total ?? 0;
  }

  const usageTotals: Usage = {
    input: totalInput || undefined,
    output: totalOutput || undefined,
    cacheRead: totalCacheRead || undefined,
    cacheWrite: totalCacheWrite || undefined,
    cost: totalCost ? { total: totalCost } : undefined,
  };
  const hasUsage = totalInput + totalOutput + totalCacheRead + totalCacheWrite > 0;

  return {
    hasUsage,
    usageText: hasUsage ? formatUsage(usageTotals) : "",
    usageTotals,
  };
}
