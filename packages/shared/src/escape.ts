import type { DeviceInfo, EscapeResult, GuideStep, InAppBrowserId } from "./types.js";

export interface EscapeOptions {
  /** 開きたい URL。省略時は現在のページ。 */
  url?: string;
  /**
   * Android で優先的に開くブラウザのパッケージ名。
   * 省略時は端末標準のブラウザに委ねる（パッケージ指定なし）。
   * 例: "com.android.chrome"
   */
  androidPackage?: string;
  /** ナビゲーションを実行する関数（テスト用に差し替え可能）。 */
  navigate?: (target: string) => void;
}

function currentUrl(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof location !== "undefined") return location.href;
  return "";
}

/** intent:// など、同一ウィンドウでのスキーム遷移（Android 向け）。 */
function locationNavigate(target: string): void {
  if (typeof location !== "undefined") {
    location.href = target;
  }
}

/**
 * x-safari-https:// など、iOS のアプリ内ブラウザから外部アプリを開く遷移。
 * WebView では location 代入が無視されることがあるため、
 * ユーザー操作中に <a target="_blank"> をクリックする方式を優先する。
 */
function anchorNavigate(target: string): void {
  if (typeof document !== "undefined" && document.body) {
    const a = document.createElement("a");
    a.href = target;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  locationNavigate(target);
}

/**
 * iOS のアプリ内ブラウザから Safari を開くための x-safari-https:// URL を生成する。
 * https://example.com → x-safari-https://example.com
 * 参考: https://stackoverflow.com/a/77466893 （CC BY-SA 4.0）
 */
export function buildSafariSchemeUrl(url: string): string {
  return "x-safari-" + url;
}

/**
 * Android 用の intent:// URL を生成する。
 * これによりインアプリ WebView から端末のブラウザへ抜け出せる。
 */
export function buildAndroidIntentUrl(url: string, androidPackage?: string): string {
  const u = new URL(url);
  const scheme = u.protocol.replace(":", "");
  const hostAndPath = url.replace(/^[a-zA-Z]+:\/\//, "");
  const fallback = encodeURIComponent(url);
  const pkg = androidPackage ? `package=${androidPackage};` : "";
  return (
    `intent://${hostAndPath}#Intent;scheme=${scheme};` +
    pkg +
    `S.browser_fallback_url=${fallback};end`
  );
}

/**
 * インアプリブラウザごとの「標準ブラウザで開く」手動手順（日本語）。
 * iOS はプログラムから脱出できないため、ここで案内する。
 */
function manualSteps(appId: InAppBrowserId | null, platform: DeviceInfo["platform"]): GuideStep[] {
  const isApple = platform === "ios" || platform === "ipados";
  const browserLabel = isApple ? "Safari" : "Chrome";

  // アプリ個別に「メニューの場所」が異なるため、代表的なものを用意する。
  const perApp: Partial<Record<InAppBrowserId, GuideStep[]>> = {
    messenger: [
      { text: "画面の右上にある「•••」（その他）をタップします。", icon: "more" },
      { text: `表示されたメニューから「${browserLabel}で開く」または「ブラウザで開く」を選びます。`, icon: "browser" },
    ],
    facebook: [
      { text: "画面の右上または右下にある「•••」（その他）をタップします。", icon: "more" },
      { text: `「${browserLabel}で開く」または「外部ブラウザで開く」を選びます。`, icon: "browser" },
    ],
    instagram: [
      { text: "画面の右上にある「•••」（その他）をタップします。", icon: "more" },
      { text: `「${browserLabel}で開く」または「ブラウザで開く」を選びます。`, icon: "browser" },
    ],
    threads: [
      { text: "画面の右上にある「•••」（その他）をタップします。", icon: "more" },
      { text: `「${browserLabel}で開く」を選びます。`, icon: "browser" },
    ],
    line: [
      { text: "画面の右下（または右上）にあるメニューアイコンをタップします。", icon: "menu" },
      { text: `「${browserLabel}で開く」または「他のアプリで開く」を選びます。`, icon: "browser" },
    ],
    twitter: [
      { text: "画面右上の共有アイコン、または「•••」をタップします。", icon: "more" },
      { text: `「${browserLabel}で開く」を選びます。`, icon: "browser" },
    ],
  };

  if (perApp[appId ?? "generic-webview"]) {
    return perApp[appId as InAppBrowserId]!;
  }

  // 汎用フォールバック。
  if (isApple) {
    return [
      { text: "画面のメニュー（多くは右上か右下の「•••」や共有アイコン）をタップします。", icon: "more" },
      { text: "「Safariで開く」または「ブラウザで開く」を選びます。", icon: "browser" },
      {
        text: "メニューが見つからない場合は、このページの URL をコピーして Safari に貼り付けてください。",
        icon: "browser",
        note: "アドレスバーを長押しすると URL をコピーできます。",
      },
    ];
  }
  return [
    { text: "画面のメニュー（多くは右上の「⋮」や「•••」）をタップします。", icon: "menu" },
    { text: "「Chrome で開く」または「ブラウザで開く」を選びます。", icon: "browser" },
    {
      text: "見つからない場合は URL をコピーし、Chrome のアドレスバーに貼り付けてください。",
      icon: "browser",
    },
  ];
}

/**
 * インアプリブラウザから標準ブラウザへの脱出を試みる。
 * - Android: intent:// で端末ブラウザを開く（成功とみなす）。
 * - iOS/iPadOS: 確実な手段がないため手動手順を返す。
 */
export function escapeInAppBrowser(device: DeviceInfo, options: EscapeOptions = {}): EscapeResult {
  const url = currentUrl(options.url);
  const steps = manualSteps(device.inApp.appId, device.platform);
  const isApple = device.platform === "ios" || device.platform === "ipados";

  if (device.platform === "android" && url) {
    const target = buildAndroidIntentUrl(url, options.androidPackage);
    (options.navigate ?? locationNavigate)(target);
    return { method: "redirect", ok: true, target, fallbackSteps: steps };
  }

  if (isApple && url) {
    // x-safari-https:// で Safari を開く（best-effort）。失敗時は fallbackSteps を案内。
    const target = buildSafariSchemeUrl(url);
    (options.navigate ?? anchorNavigate)(target);
    return { method: "redirect", ok: true, target, fallbackSteps: steps };
  }

  // URL 不明 / PC など: 手動案内のみ
  return { method: "manual", ok: false, steps };
}
