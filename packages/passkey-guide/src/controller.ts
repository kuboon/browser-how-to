import {
  detectDevice,
  escapeInAppBrowser,
  type DeviceInfo,
  type EscapeOptions,
  type EscapeResult,
} from "@browser-how-to/shared";
import { detectPasskeyCapabilities } from "./detect.js";
import { explain } from "./explain.js";
import type {
  ExplainTopic,
  PasskeyCapabilities,
  PasskeyGuideController,
  PasskeyGuideOptions,
  PasskeyStatus,
  PasskeySupport,
} from "./types.js";

function computeSupport(device: DeviceInfo, caps: PasskeyCapabilities): PasskeySupport {
  if (!caps.webauthnSupported) return "unsupported";
  if (device.inApp.isInApp) return "in-app-blocked";
  if (caps.platformAuthenticatorAvailable) return "full";
  if (caps.crossDeviceSupported) return "cross-device-only";
  return "unsupported";
}

export function createPasskeyGuide(
  options: PasskeyGuideOptions = {},
): PasskeyGuideController {
  const device = detectDevice(options.userAgent);

  return {
    getDevice: () => device,
    detect: async (): Promise<PasskeyStatus> => {
      const capabilities = await detectPasskeyCapabilities();
      return {
        support: computeSupport(device, capabilities),
        capabilities,
        device,
      };
    },
    escapeInAppBrowser: (opts?: EscapeOptions): EscapeResult =>
      escapeInAppBrowser(device, opts),
    explain: (topic: ExplainTopic) => explain(topic, device),
  };
}

/** 対応状況を一度に検出する簡易関数。 */
export async function detectPasskeyStatus(
  options: PasskeyGuideOptions = {},
): Promise<PasskeyStatus> {
  return createPasskeyGuide(options).detect();
}
