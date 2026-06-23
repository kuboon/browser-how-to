export { createPasskeyGuide, detectPasskeyStatus } from "./controller.js";
export { detectPasskeyCapabilities } from "./detect.js";
export { explain } from "./explain.js";
export type {
  ExplainTopic,
  PasskeyCapabilities,
  PasskeyExplainer,
  PasskeyGuideController,
  PasskeyGuideOptions,
  PasskeyStatus,
  PasskeySupport,
} from "./types.js";
export {
  detectDevice,
  isStandardBrowser,
  type DeviceInfo,
  type GuideStep,
  type EscapeResult,
} from "../core/index.js";
