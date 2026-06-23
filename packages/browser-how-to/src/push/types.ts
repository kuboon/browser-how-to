import type { DeviceInfo, GuideStep } from "../core/index.js";

/** Notification.permission 相当（未対応は "unsupported"）。 */
export type PushPermission = "default" | "granted" | "denied" | "unsupported";

/**
 * プッシュ通知の案内レベル。
 * - ready: いまから通知の許可を求められる（許可すれば受け取れる）
 * - needs-install: iOS で未インストール。先にホーム画面へ追加（a2hs）が必要
 * - in-app-blocked: アプリ内ブラウザのため、まず標準ブラウザへ移動が必要
 * - denied: 通知がブロックされている（設定から再許可が必要）
 * - unsupported: この環境では通知に非対応
 */
export type PushSupport =
  | "ready"
  | "needs-install"
  | "in-app-blocked"
  | "denied"
  | "unsupported";

export interface PushStatus {
  support: PushSupport;
  permission: PushPermission;
  device: DeviceInfo;
}

export interface PushController {
  /** 現在の通知の案内状況を取得する（同期）。 */
  getStatus(): PushStatus;
  /** アプリ内ブラウザから標準ブラウザへ脱出する。 */
  escapeInAppBrowser(
    options?: import("../core/index.js").EscapeOptions,
  ): import("../core/index.js").EscapeResult;
  /** denied 時などに表示する、端末別の再許可手順を取得する。 */
  getReenableSteps(): GuideStep[];
}

export interface PushGuideOptions {
  /** テスト/SSR 用に User-Agent を差し替える。 */
  userAgent?: string;
}
