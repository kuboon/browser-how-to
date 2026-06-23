import {
  escapeInAppBrowser,
  type DeviceInfo,
  type GuideStep,
} from "@browser-how-to/shared";
import type { InstructionSet } from "./types.js";

/**
 * iOS / iPadOS Safari でのホーム画面追加手順。
 * 共有ボタンの位置は iPhone（下中央）と iPad（右上）で異なるため出し分ける。
 */
function iosSafariInstructions(device: DeviceInfo): InstructionSet {
  const isPad = device.platform === "ipados";
  const shareLocation = isPad
    ? "画面右上にある共有ボタン（□に↑のアイコン）"
    : "画面下の中央にある共有ボタン（□に↑のアイコン）";
  return {
    title: "ホーム画面に追加する手順（Safari）",
    steps: [
      { text: `${shareLocation}をタップします。`, icon: "share" },
      {
        text: "メニューを下にスクロールし、「ホーム画面に追加」をタップします。",
        icon: "add",
        note: "見つからないときは「アクションを編集」から追加できます。",
      },
      { text: "右上の「追加」をタップすると完了です。", icon: "add" },
    ],
    note: "この操作は Safari でのみ可能です。Chrome など他のブラウザで開いている場合は、Safari で開き直してください。",
  };
}

/** iOS で Safari 以外（Chrome/Firefox/Edge など）を使っている場合。 */
function iosNonSafariInstructions(): InstructionSet {
  return {
    title: "Safari で開き直してください",
    steps: [
      { text: "このページの URL をコピーします。", icon: "browser" },
      { text: "Safari を開き、アドレスバーに貼り付けて表示します。", icon: "browser" },
      {
        text: "Safari で開いたあと、共有ボタン →「ホーム画面に追加」を選びます。",
        icon: "share",
      },
    ],
    note: "iPhone / iPad では、ホーム画面への追加は Safari からのみ行えます。",
  };
}

/** Android Chrome（プロンプトが出ない場合のフォールバック手順）。 */
function androidChromeInstructions(): InstructionSet {
  return {
    title: "ホーム画面に追加する手順（Chrome）",
    steps: [
      { text: "画面右上の「⋮」（メニュー）をタップします。", icon: "menu" },
      {
        text: "「アプリをインストール」または「ホーム画面に追加」をタップします。",
        icon: "add",
      },
      { text: "確認ダイアログで「インストール」または「追加」をタップします。", icon: "add" },
    ],
  };
}

/** Android Samsung Internet。 */
function samsungInstructions(): InstructionSet {
  return {
    title: "ホーム画面に追加する手順（Samsung Internet）",
    steps: [
      { text: "画面下部のメニュー（≡）をタップします。", icon: "menu" },
      { text: "「現在のページを追加」→「ホーム画面」を選びます。", icon: "add" },
      { text: "「追加」をタップして完了です。", icon: "add" },
    ],
  };
}

/** Android Firefox。 */
function firefoxAndroidInstructions(): InstructionSet {
  return {
    title: "ホーム画面に追加する手順（Firefox）",
    steps: [
      { text: "画面右上（または右下）の「⋮」をタップします。", icon: "menu" },
      { text: "「ホーム画面に追加」をタップします。", icon: "add" },
      { text: "「追加」をタップして完了です。", icon: "add" },
    ],
  };
}

/** インアプリブラウザのため、標準ブラウザへの移動を案内する。 */
function inAppInstructions(device: DeviceInfo): InstructionSet {
  const appName = device.inApp.appLabel ?? "アプリ内ブラウザ";
  const result = escapeInAppBrowser(device, { navigate: () => {} });
  const steps: GuideStep[] =
    result.method === "manual"
      ? result.steps
      : [{ text: "「標準ブラウザで開く」ボタンを押してください。", icon: "browser" }];
  return {
    title: `${appName}では追加できません`,
    steps,
    note: `${appName}の中ではホーム画面に追加できません。標準ブラウザ（${
      device.platform === "android" ? "Chrome" : "Safari"
    }）で開き直してから、もう一度お試しください。`,
  };
}

/** 端末・ブラウザに最適なホーム画面追加手順を組み立てる。 */
export function buildInstructions(device: DeviceInfo): InstructionSet {
  if (device.inApp.isInApp) {
    return inAppInstructions(device);
  }
  if (device.platform === "ios" || device.platform === "ipados") {
    return device.browser === "safari"
      ? iosSafariInstructions(device)
      : iosNonSafariInstructions();
  }
  if (device.platform === "android") {
    switch (device.browser) {
      case "samsung":
        return samsungInstructions();
      case "firefox":
        return firefoxAndroidInstructions();
      default:
        return androidChromeInstructions();
    }
  }
  return {
    title: "この環境ではホーム画面に追加できません",
    steps: [
      {
        text: "お使いのスマートフォン（iPhone は Safari、Android は Chrome）でこのページを開いてください。",
        icon: "browser",
      },
    ],
    note: "PC ではホーム画面への追加に対応していない場合があります。",
  };
}
