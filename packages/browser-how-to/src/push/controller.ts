import {
  detectDevice,
  escapeInAppBrowser,
  type DeviceInfo,
  type EscapeOptions,
  type EscapeResult,
  type GuideStep,
} from "../core/index.js";
import type {
  PushController,
  PushGuideOptions,
  PushPermission,
  PushStatus,
  PushSupport,
} from "./types.js";

function readPermission(): PushPermission {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PushPermission;
}

/** この環境が Web Push の API を備えているか。 */
function pushApiSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function isApple(device: DeviceInfo): boolean {
  return device.platform === "ios" || device.platform === "ipados";
}

function computeSupport(device: DeviceInfo, permission: PushPermission): PushSupport {
  if (device.inApp.isInApp) return "in-app-blocked";
  // iOS/iPadOS は「ホーム画面に追加」した PWA でのみ Web Push を使える。
  if (isApple(device) && !device.isStandalone) return "needs-install";
  if (!pushApiSupported()) return "unsupported";
  if (permission === "denied") return "denied";
  return "ready";
}

/** denied / 設定確認時に案内する、端末別の再許可手順。 */
function reenableSteps(device: DeviceInfo): GuideStep[] {
  if (isApple(device)) {
    return [
      { text: "iPhone/iPad の「設定」アプリを開きます。", icon: "menu" },
      { text: "「通知」→ このアプリ（ホーム画面に追加したアイコン）を選びます。", icon: "more" },
      { text: "「通知を許可」をオンにします。", icon: "add" },
    ];
  }
  if (device.platform === "android") {
    return [
      { text: "ブラウザのアドレスバー左側の鍵（または ⓘ）アイコンをタップします。", icon: "more" },
      { text: "「権限」→「通知」を「許可」に変更します。", icon: "add" },
      { text: "設定アプリの「アプリ」→ ブラウザ →「通知」からも変更できます。", icon: "menu" },
    ];
  }
  return [
    { text: "アドレスバー左側の鍵アイコンをクリックします。", icon: "more" },
    { text: "「通知」を「許可」に変更し、ページを再読み込みします。", icon: "add" },
  ];
}

export function createPushGuide(options: PushGuideOptions = {}): PushController {
  const device = detectDevice(options.userAgent);
  return {
    getStatus: (): PushStatus => ({
      support: computeSupport(device, readPermission()),
      permission: readPermission(),
      device,
    }),
    escapeInAppBrowser: (opts?: EscapeOptions): EscapeResult => escapeInAppBrowser(device, opts),
    getReenableSteps: (): GuideStep[] => reenableSteps(device),
  };
}

/** 通知の案内状況を一度に取得する簡易関数。 */
export function detectPushStatus(options: PushGuideOptions = {}): PushStatus {
  return createPushGuide(options).getStatus();
}
