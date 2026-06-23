import type { InAppBrowserId, InAppBrowserInfo } from "./types.js";

interface Signature {
  id: InAppBrowserId;
  label: string;
  /** いずれかにマッチすれば該当。 */
  test: RegExp;
  /** 除外条件（マッチしたら該当しない）。 */
  not?: RegExp;
}

/**
 * User-Agent によるインアプリブラウザ判定。判定順に意味がある
 * （Messenger は Facebook トークンも含むため Messenger を先に評価する）。
 */
const SIGNATURES: Signature[] = [
  {
    id: "messenger",
    label: "Facebook Messenger",
    // iOS: "MessengerForiOS", Android: "Orca-Android" / "FB_IAB/MESSENGER"
    test: /MessengerForiOS|Orca-Android|FB_IAB\/MESSENGER|\bMessenger\b/,
  },
  {
    id: "instagram",
    label: "Instagram",
    test: /\bInstagram\b/,
  },
  {
    id: "threads",
    label: "Threads",
    test: /\bThreads\b|Barcelona/,
  },
  {
    id: "facebook",
    label: "Facebook",
    test: /FBAN|FBAV|FB_IAB|\bFB4A\b/,
  },
  {
    id: "line",
    label: "LINE",
    test: /\bLine\//,
  },
  {
    id: "kakaotalk",
    label: "KakaoTalk",
    test: /KAKAOTALK/,
  },
  {
    id: "wechat",
    label: "WeChat（微信）",
    test: /MicroMessenger/,
  },
  {
    id: "tiktok",
    label: "TikTok",
    test: /BytedanceWebview|musical_ly|\bTikTok\b|Bytedance/,
  },
  {
    id: "snapchat",
    label: "Snapchat",
    test: /Snapchat/,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    test: /\bPinterest\b/,
  },
  {
    id: "twitter",
    label: "X（旧 Twitter）",
    test: /\bTwitter\b|TwitterAndroid/,
  },
];

/**
 * 既知アプリに一致しないが WebView の特徴を持つ汎用インアプリブラウザを検出する。
 * - iOS: Safari なのに "Version/" を持たない WebView（WKWebView）
 * - Android: "; wv)" を含む WebView
 */
function detectGenericWebView(ua: string): boolean {
  const androidWebView = /; wv\)/.test(ua) && /Android/.test(ua);
  const iosWebView =
    /(iPhone|iPod|iPad)/.test(ua) &&
    /AppleWebKit/.test(ua) &&
    /Safari/.test(ua) &&
    !/Version\/\d/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return androidWebView || iosWebView;
}

export function detectInAppBrowser(ua: string): InAppBrowserInfo {
  for (const sig of SIGNATURES) {
    if (sig.test.test(ua) && !(sig.not && sig.not.test(ua))) {
      return { isInApp: true, appId: sig.id, appLabel: sig.label };
    }
  }
  if (detectGenericWebView(ua)) {
    return { isInApp: true, appId: "generic-webview", appLabel: "アプリ内ブラウザ" };
  }
  return { isInApp: false, appId: null, appLabel: null };
}
