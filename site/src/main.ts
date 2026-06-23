import { createA2hs, detectDevice } from "@browser-how-to/add-to-home-screen";
import { showA2hsGuide } from "@browser-how-to/add-to-home-screen/ui";
import { createPasskeyGuide } from "@browser-how-to/passkey-guide";
import { showPasskeyGuide } from "@browser-how-to/passkey-guide/ui";

interface Preset {
  label: string;
  ua?: string; // undefined = 実機
}

const PRESETS: Preset[] = [
  { label: "実機（このブラウザ）" },
  {
    label: "iPhone Safari",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  },
  {
    label: "iPhone Chrome",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
  },
  {
    label: "Android Chrome",
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  },
  {
    label: "Android Samsung Internet",
    ua: "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
  },
  {
    label: "Facebook Messenger (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/450.0]",
  },
  {
    label: "Facebook アプリ (Android)",
    ua: "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0;]",
  },
  {
    label: "LINE (iOS)",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.5.0",
  },
];

const SUPPORT_LABELS: Record<string, string> = {
  installed: "✅ すでにホーム画面に追加済み",
  "native-prompt": "✅ ワンタップで追加可能（インストールプロンプト）",
  manual: "📝 手動で追加可能（手順を案内）",
  "in-app-blocked": "⛔ アプリ内ブラウザ → 標準ブラウザへ誘導",
  unsupported: "❌ この環境では追加不可",
};

const PASSKEY_LABELS: Record<string, string> = {
  full: "✅ この端末でパスキーを作成・利用できる",
  "cross-device-only": "📱 別の端末（スマホ）を使えばログイン可能",
  "in-app-blocked": "⛔ アプリ内ブラウザ → 標準ブラウザへ誘導",
  unsupported: "❌ パスキー非対応",
};

const $ = <T extends Element>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing element: ${sel}`);
  return el;
};

function currentUa(): string | undefined {
  const select = $<HTMLSelectElement>("#ua-preset");
  return PRESETS[select.selectedIndex]?.ua;
}

function refreshDetect(): void {
  const ua = currentUa();
  const d = detectDevice(ua);
  const inApp = d.inApp.isInApp
    ? `✅ アプリ内ブラウザ（${d.inApp.appLabel} / id: ${d.inApp.appId}）`
    : "—（通常のブラウザ）";
  $("#detect-output").innerHTML =
    `<strong>device.inApp.isInApp:</strong> ${d.inApp.isInApp}<br />` +
    `<span class="muted small">${inApp}<br />` +
    `platform: ${d.platform} / browser: ${d.browser}` +
    (d.osVersion ? ` / OS ${d.osVersion.major}.${d.osVersion.minor}` : "") +
    `</span>`;
}

function refreshA2hs(): void {
  const ua = currentUa();
  const status = createA2hs({ userAgent: ua }).getStatus();
  const d = status.device;
  $("#a2hs-status").innerHTML =
    `<strong>${SUPPORT_LABELS[status.support] ?? status.support}</strong><br />` +
    `<span class="muted small">platform: ${d.platform} / browser: ${d.browser}` +
    (d.inApp.isInApp ? ` / アプリ内: ${d.inApp.appLabel}` : "") +
    `</span>`;
}

async function refreshPasskey(): Promise<void> {
  const ua = currentUa();
  const guide = createPasskeyGuide({ userAgent: ua });
  const status = await guide.detect();
  const c = status.capabilities;
  $("#passkey-status").innerHTML =
    `<strong>${PASSKEY_LABELS[status.support] ?? status.support}</strong><br />` +
    `<span class="muted small">この端末で利用可: ${c.platformAuthenticatorAvailable ? "はい" : "いいえ"}` +
    ` / クロスデバイス: ${c.crossDeviceSupported ? "はい" : "いいえ"}` +
    ` / 自動入力: ${c.conditionalMediationAvailable ? "はい" : "いいえ"}</span>`;
}

function init(): void {
  const select = $<HTMLSelectElement>("#ua-preset");
  select.innerHTML = "";
  PRESETS.forEach((p) => {
    const opt = document.createElement("option");
    opt.textContent = p.label;
    select.append(opt);
  });

  select.addEventListener("change", () => {
    refreshDetect();
    refreshA2hs();
    void refreshPasskey();
  });

  $("#a2hs-show").addEventListener("click", () => {
    showA2hsGuide({ userAgent: currentUa() });
  });
  $("#passkey-show").addEventListener("click", () => {
    showPasskeyGuide({ userAgent: currentUa() });
  });

  refreshDetect();
  refreshA2hs();
  void refreshPasskey();
}

init();
