import type { DeviceInfo } from "@kuboon/how-to-shared";
import type { ExplainTopic, PasskeyExplainer } from "./types.js";

/** その端末でパスキーが保存される場所の名称（日本語）。 */
function passkeyManagerName(device: DeviceInfo): string {
  if (device.platform === "ios" || device.platform === "ipados") {
    return "iCloud キーチェーン（Apple アカウント）";
  }
  if (device.platform === "android") {
    return "Google パスワードマネージャー（Google アカウント）";
  }
  if (device.browser === "safari") return "iCloud キーチェーン";
  return "ブラウザ／OS のパスワードマネージャー";
}

function whatIsPasskey(): PasskeyExplainer {
  return {
    title: "パスキーってなに？",
    body: [
      "パスキーは、パスワードの代わりに使える新しいログイン方法です。指紋・顔認証・画面ロックの暗証番号でログインできます。",
      "覚える必要も、入力する必要もありません。パスワードのように他人に盗まれたり、偽サイトに入力してしまう心配がほとんどない、安全な仕組みです。",
      "一度この端末で登録すれば、次からはボタンを押して指紋や顔をかざすだけでログインできます。",
    ],
  };
}

function crossDevice(device: DeviceInfo): PasskeyExplainer {
  const isApple = device.platform === "ios" || device.platform === "ipados";
  return {
    title: "スマホで作ったパスキーをパソコンで使うには",
    body: [
      "パスキーはスマホの中に安全に保管されていますが、手元にスマホがあれば別のパソコンでもログインできます。パスキーをパソコンへコピーする必要はありません。",
      "パソコンのログイン画面で「別のデバイスを使う」「スマートフォンを使う」などを選ぶと QR コードが表示されます。それをスマホのカメラで読み取り、画面の指示に従うだけです。",
    ],
    steps: [
      { text: "パソコンのログイン画面で「パスキーでログイン」を押します。", icon: "browser" },
      {
        text: "「別のデバイス」「スマートフォンを使う」などを選びます。",
        icon: "more",
        note: "選択肢が出ない場合は、自動で QR コードが表示されることもあります。",
      },
      {
        text: `スマホの${isApple ? "カメラ" : "カメラまたは Google レンズ"}で、画面の QR コードを読み取ります。`,
        icon: "share",
      },
      {
        text: "スマホに出る確認画面で、指紋・顔認証・画面ロックで承認します。",
        icon: "add",
        note: "スマホとパソコンの Bluetooth がオンで、近くにある必要があります。",
      },
      { text: "パソコン側のログインが自動で完了します。", icon: "browser" },
    ],
  };
}

function whereSaved(device: DeviceInfo): PasskeyExplainer {
  const manager = passkeyManagerName(device);
  const sameAccountDevices =
    device.platform === "ios" || device.platform === "ipados"
      ? "同じ Apple アカウントでログインしている iPhone・iPad・Mac"
      : device.platform === "android"
        ? "同じ Google アカウントでログインしている Android スマホ・Chrome"
        : "同じアカウントでログインしている端末";
  return {
    title: "パスキーはどこに保存される？",
    body: [
      `このサイトのパスキーは ${manager} に保存されます。「Apple Wallet」や「Google ウォレット」のような決済用のお財布アプリとは別のものです。`,
      `${manager} に保存されたパスキーは、${sameAccountDevices} に自動で同期されます。そのため、同じアカウントの端末ならどれでもログインできます。`,
      "別のメーカーの端末（例: iPhone のパスキーを Windows パソコンで使う）でログインしたいときは、スマホを手元に用意し、QR コードを読み取る方法でログインできます。",
    ],
  };
}

export function explain(topic: ExplainTopic, device: DeviceInfo): PasskeyExplainer {
  switch (topic) {
    case "what-is-passkey":
      return whatIsPasskey();
    case "cross-device":
      return crossDevice(device);
    case "where-saved":
      return whereSaved(device);
  }
}
