import type { MindFastExtension } from "../types";
import { coreWidget } from "./core-widget";
import { coreArtifact } from "./core-artifact";
import { corePlan } from "./core-plan";
import { coreSubagentPlan } from "./core-subagent-plan";

export const builtinExtensions: MindFastExtension[] = [
  coreWidget,
  coreArtifact,
  corePlan,
  coreSubagentPlan,
];
