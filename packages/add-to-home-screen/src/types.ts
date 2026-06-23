import type { DeviceInfo, GuideStep } from "@kuboon/how-to-shared";

/**
 * ホーム画面追加の対応レベル。
 * - installed: すでにホーム画面アプリとして起動している
 * - native-prompt: ブラウザのインストールプロンプトを直接呼べる（主に Android Chrome 系）
 * - manual: 対応しているが手動操作が必要（iOS Safari など）
 * - in-app-blocked: インアプリブラウザのため、まず標準ブラウザへ移動が必要
 * - unsupported: 追加に対応していない（多くの PC や未対応環境）
 */
export type A2hsSupport =
  | "installed"
  | "native-prompt"
  | "manual"
  | "in-app-blocked"
  | "unsupported";

export interface A2hsStatus {
  support: A2hsSupport;
  device: DeviceInfo;
  /** promptInstall() で OS のインストールダイアログを出せるか。 */
  canPrompt: boolean;
}

export interface InstructionSet {
  /** 見出し（日本語）。 */
  title: string;
  /** 操作手順。 */
  steps: GuideStep[];
  /** 補足。 */
  note?: string;
}

export type PromptOutcome = "accepted" | "dismissed" | "unavailable";

export interface A2hsControllerOptions {
  /** テスト用に User-Agent を差し替える。 */
  userAgent?: string;
}

export interface A2hsController {
  /** 現在の対応状況を取得する。 */
  getStatus(): A2hsStatus;
  /**
   * OS 標準のインストールダイアログを表示する（canPrompt が true のときのみ有効）。
   * 利用できない環境では "unavailable" を返す。
   */
  promptInstall(): Promise<PromptOutcome>;
  /** 現在の環境に合わせたホーム画面追加の手順を取得する。 */
  getInstructions(): InstructionSet;
  /**
   * インアプリブラウザから標準ブラウザへ脱出する。
   * Android は自動遷移、iOS は手動手順を返す。
   */
  escapeInAppBrowser(
    options?: import("@kuboon/how-to-shared").EscapeOptions,
  ): import("@kuboon/how-to-shared").EscapeResult;
  /** 状態変化（インストール可能になった/インストール済みになった）を購読する。 */
  onChange(listener: (status: A2hsStatus) => void): () => void;
}
