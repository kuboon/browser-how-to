/** 端末のプラットフォーム種別。 */
export type Platform = "ios" | "ipados" | "android" | "desktop" | "unknown";

/** ブラウザ種別（標準ブラウザ判定にも使う）。 */
export type BrowserName =
  | "safari"
  | "chrome"
  | "firefox"
  | "samsung"
  | "edge"
  | "opera"
  | "other";

/**
 * 既知のインアプリ（アプリ内）ブラウザの識別子。
 * これらの環境ではホーム画面追加・パスキーが使えない、または不安定なことが多い。
 */
export type InAppBrowserId =
  | "facebook"
  | "messenger"
  | "instagram"
  | "threads"
  | "line"
  | "twitter"
  | "wechat"
  | "tiktok"
  | "kakaotalk"
  | "snapchat"
  | "pinterest"
  | "generic-webview";

export interface OsVersion {
  major: number;
  minor: number;
}

export interface InAppBrowserInfo {
  /** インアプリブラウザで開かれているか。 */
  isInApp: boolean;
  /** 判別できたアプリの識別子。判別不能なら null。 */
  appId: InAppBrowserId | null;
  /** ユーザーに見せる日本語のアプリ名（例: "Facebook Messenger"）。 */
  appLabel: string | null;
}

export interface DeviceInfo {
  platform: Platform;
  /** OS バージョン（iOS / Android）。取得できなければ null。 */
  osVersion: OsVersion | null;
  browser: BrowserName;
  inApp: InAppBrowserInfo;
  /** すでにホーム画面アプリ（standalone / フルスクリーン）として起動しているか。 */
  isStandalone: boolean;
  /** 検出に用いた User-Agent 文字列。 */
  userAgent: string;
}

/** 標準ブラウザへ脱出した結果。 */
export type EscapeResult =
  /**
   * 標準ブラウザへの遷移（ナビゲーション）を試みた。
   * - Android: intent:// で端末の既定ブラウザを開く（ほぼ確実）。
   * - iOS/iPadOS: x-safari-https:// で Safari を開く（best-effort：環境により失敗しうる）。
   * 失敗時のフォールバックとして手動手順 fallbackSteps を併せて返す。
   */
  | { method: "redirect"; ok: true; target: string; fallbackSteps: GuideStep[] }
  /**
   * プログラムからは脱出を試せないため、手順案内のみ（URL 不明・PC 等）。
   * steps に従って操作してもらう。
   */
  | { method: "manual"; ok: false; steps: GuideStep[] };

/** 案内の 1 ステップ。 */
export interface GuideStep {
  /** 操作内容（日本語）。 */
  text: string;
  /**
   * UI で添えるアイコンのヒント。実体のアイコン描画は UI 側に委ねる。
   * 例: "share" | "menu" | "more" | "browser" | "add"
   */
  icon?: string;
  /** 補足説明。 */
  note?: string;
}
