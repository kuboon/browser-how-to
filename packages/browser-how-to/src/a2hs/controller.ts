import {
  detectDevice,
  escapeInAppBrowser,
  type DeviceInfo,
  type EscapeOptions,
  type EscapeResult,
} from "../core/index.js";
import { buildInstructions } from "./instructions.js";
import { hasInstalledRelatedApps } from "./relatedApps.js";
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

const INSTALLED_STORAGE_KEY = "bht:a2hs:installed";

/**
 * appinstalled はブラウザ・端末単位でしか発火せず、次にタブで開いたときは
 * 覚えていないと再度プロンプト/手順を出してしまう。localStorage に恒久的に
 * 記録しておき、ページ読み込みのたびに読み戻す。
 */
function readPersistedInstalled(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(INSTALLED_STORAGE_KEY) === "1";
  } catch {
    // プライベートモード等で localStorage が使えない場合は諦めて false 扱い。
    return false;
  }
}

function persistInstalled(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
    }
  } catch {
    // 保存できなくても致命的ではない（今回のセッション内は installed 変数で覚えている）。
  }
}

/**
 * beforeinstallprompt はページ読み込み直後に一度だけ発火することがあるため、
 * モジュール読み込み時点で捕捉して保持しておく。
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = readPersistedInstalled();
const promptListeners = new Set<() => void>();

function notify(): void {
  for (const l of promptListeners) l();
}

function markInstalled(): void {
  deferredPrompt = null;
  installed = true;
  persistInstalled();
  notify();
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", markInstalled);
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
        persistInstalled();
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

  const refreshInstallState = async (): Promise<A2hsStatus> => {
    // isStandalone / appinstalled / localStorage のいずれかで既にわかっていれば
    // わざわざ非同期 API を呼ばない。
    if (!installed && (await hasInstalledRelatedApps())) {
      markInstalled();
    }
    return getStatus();
  };

  return {
    getStatus,
    promptInstall,
    getInstructions: () => buildInstructions(device),
    escapeInAppBrowser: escape,
    onChange,
    refreshInstallState,
  };
}
