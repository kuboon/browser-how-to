export { createA2hs } from "./controller.js";
export { buildInstructions } from "./instructions.js";
export type {
  A2hsController,
  A2hsControllerOptions,
  A2hsStatus,
  A2hsSupport,
  InstructionSet,
  PromptOutcome,
} from "./types.js";
// よく使う共有型・関数も再エクスポートしておく。
export {
  detectDevice,
  isStandardBrowser,
  type DeviceInfo,
  type GuideStep,
  type EscapeResult,
} from "@browser-how-to/shared";
