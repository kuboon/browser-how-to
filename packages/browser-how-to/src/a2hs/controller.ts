import {
  detectDevice,
  escapeInAppBrowser,
  type DeviceInfo,
  type EscapeOptions,
  type EscapeResult,
} from "../core/index.js";
import { buildInstructions } from "./instructions.js";
import type {
  A2hsController,
  A2hsControllerOptions,
  A2hsStatus,
  A2hsSupport,
  PromptOutcome,
} from "./types.js";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * beforeinstallprompt はページ読み込み直後に一度だけ発火することがあるため、
 * モジュール読み込み時点で捕捉して保持しておく。
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const promptListeners = new Set<() => void>();

function notify(): void {
  for (const l of promptListeners) l();
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function computeSupport(device: DeviceInfo, canPrompt: boolean): A2hsSupport {
  if (installed || device.isStandalone) return "installed";
  if (device.inApp.isInApp) return "in-app-blocked";
  if (canPrompt) return "native-prompt";
  if (device.platform === "ios" || device.platform === "ipados") return "manual";
  if (device.platform === "android") return "manual";
  return "unsupported";
}

export function createA2hs(options: A2hsControllerOptions = {}): A2hsController {
  const device = detectDevice(options.userAgent);

  const getStatus = (): A2hsStatus => {
    const canPrompt = deferredPrompt !== null;
    return { support: computeSupport(device, canPrompt), device, canPrompt };
  };

  const promptInstall = async (): Promise<PromptOutcome> => {
    if (!deferredPrompt) return "unavailable";
    const evt = deferredPrompt;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "accepted") {
        installed = true;
      }
      return choice.outcome;
    } finally {
      // プロンプトは一度しか使えない。
      deferredPrompt = null;
      notify();
    }
  };

  const escape = (opts?: EscapeOptions): EscapeResult => escapeInAppBrowser(device, opts);

  const onChange = (listener: (status: A2hsStatus) => void): (() => void) => {
    const wrapped = () => listener(getStatus());
    promptListeners.add(wrapped);
    return () => promptListeners.delete(wrapped);
  };

  return {
    getStatus,
    promptInstall,
    getInstructions: () => buildInstructions(device),
    escapeInAppBrowser: escape,
    onChange,
  };
}
