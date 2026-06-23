import type { DeviceInfo, GuideStep } from "@browser-how-to/shared";

export interface PasskeyCapabilities {
  /** WebAuthn（パスキー）に対応しているか。 */
  webauthnSupported: boolean;
  /** この端末自身でパスキーを作成・利用できるか（生体認証など / isUVPAA）。 */
  platformAuthenticatorAvailable: boolean;
  /** ログインフォームの自動入力（条件付き UI / conditionalGet）に対応しているか。 */
  conditionalMediationAvailable: boolean;
  /** 別の端末（スマホ）を使ったクロスデバイス認証に対応しているか（hybridTransport）。 */
  crossDeviceSupported: boolean;
  /** 関連オリジン（Related Origins）に対応しているか。 */
  relatedOriginsSupported: boolean;
  /** capability の取得に getClientCapabilities() を使えたか（false の場合は推定値を含む）。 */
  usedClientCapabilities: boolean;
}

/**
 * パスキーの対応レベル。
 * - full: この端末でパスキーを作成・利用できる
 * - cross-device-only: この端末では作れないが、スマホ等を使ってログインできる
 * - in-app-blocked: インアプリブラウザのため、まず標準ブラウザへ移動が必要
 * - unsupported: パスキーに非対応
 */
export type PasskeySupport = "full" | "cross-device-only" | "in-app-blocked" | "unsupported";

export interface PasskeyStatus {
  support: PasskeySupport;
  capabilities: PasskeyCapabilities;
  device: DeviceInfo;
}

/** 案内コンテンツの 1 トピック。 */
export interface PasskeyExplainer {
  title: string;
  /** 本文（段落ごと）。 */
  body: string[];
  /** 任意の手順。 */
  steps?: GuideStep[];
}

export type ExplainTopic = "what-is-passkey" | "cross-device" | "where-saved";

export interface PasskeyGuideOptions {
  /** テスト/SSR 用の User-Agent。 */
  userAgent?: string;
}

export interface PasskeyGuideController {
  /** capability を検出して対応状況を返す（非同期）。 */
  detect(): Promise<PasskeyStatus>;
  /** 端末情報のみを同期取得する（capability 検出は行わない）。 */
  getDevice(): DeviceInfo;
  /** インアプリブラウザから標準ブラウザへ脱出する。 */
  escapeInAppBrowser(
    options?: import("@browser-how-to/shared").EscapeOptions,
  ): import("@browser-how-to/shared").EscapeResult;
  /** 指定トピックの案内コンテンツを取得する。 */
  explain(topic: ExplainTopic): PasskeyExplainer;
}
