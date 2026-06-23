import {
  createButton,
  createModal,
  createNote,
  createParagraph,
  renderSteps,
  type ModalHandle,
} from "../core/dom.js";
import { showA2hsGuide } from "../a2hs/ui.js";
import { createPushGuide } from "./controller.js";
import type { PushController, PushStatus } from "./types.js";

export interface PushGuideUiOptions {
  controller?: PushController;
  userAgent?: string;
  zIndex?: number;
  onClose?: () => void;
}

export interface PushGuideHandle {
  close: () => void;
}

/**
 * プッシュ通知の案内モーダルを表示する（通知の購読自体は行わず、前提条件を案内する）。
 * 環境を判定し、
 *  - in-app-blocked → 標準ブラウザへの脱出案内
 *  - needs-install  → 先にホーム画面追加（a2hs）を案内し、その後の通知許可を説明
 *  - ready          → この後の許可ダイアログで「許可」を選ぶよう案内
 *  - denied         → 設定からの再許可手順を案内
 *  - unsupported    → 非対応の案内
 * を出し分ける。
 */
export function showPushGuide(options: PushGuideUiOptions = {}): PushGuideHandle {
  const controller = options.controller ?? createPushGuide({ userAgent: options.userAgent });
  const status = controller.getStatus();

  const modal = createModal({
    title: "通知を受け取るには",
    zIndex: options.zIndex,
    onClose: options.onClose,
  });

  renderBody(modal, controller, status, options);
  return { close: modal.close };
}

function appendClose(body: HTMLElement, modal: ModalHandle): void {
  const row = document.createElement("div");
  row.className = "bht-actions";
  row.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(row);
}

function renderBody(
  modal: ModalHandle,
  controller: PushController,
  status: PushStatus,
  options: PushGuideUiOptions,
): void {
  const body = modal.body;
  body.replaceChildren();

  switch (status.support) {
    case "in-app-blocked": {
      const appName = status.device.inApp.appLabel ?? "アプリ内ブラウザ";
      const browserLabel = status.device.platform === "android" ? "Chrome" : "Safari";
      modal.setTitle("標準ブラウザで開いてください");
      body.append(
        createParagraph(
          `${appName}の中では通知を有効にできません。標準ブラウザ（${browserLabel}）で開き直してください。`,
        ),
      );
      const actions = document.createElement("div");
      actions.className = "bht-actions";
      actions.append(
        createButton(`${browserLabel}で開く`, {
          onClick: () => controller.escapeInAppBrowser({}),
        }),
      );
      body.append(actions);
      const result = controller.escapeInAppBrowser({ navigate: () => {} });
      const steps = result.method === "manual" ? result.steps : result.fallbackSteps;
      body.append(createNote("ボタンで開けないときは、次の操作をお試しください。"));
      body.append(renderSteps(steps));
      appendClose(body, modal);
      break;
    }

    case "needs-install": {
      modal.setTitle("まずホーム画面に追加してください");
      body.append(
        createParagraph(
          "iPhone / iPad で通知を受け取るには、先にこのサイトを「ホーム画面に追加」し、追加したアイコンから開く必要があります。",
        ),
      );
      body.append(
        renderSteps([
          { text: "下のボタンから、ホーム画面に追加する手順を確認します。", icon: "add" },
          {
            text: "ホーム画面のアイコンを開き、表示される通知の確認で「許可」を選びます。",
            icon: "browser",
            note: "通知の許可は、ホーム画面アプリとして開いたときに表示されます。",
          },
        ]),
      );
      const actions = document.createElement("div");
      actions.className = "bht-actions";
      actions.append(
        createButton("ホーム画面に追加する手順を見る", {
          onClick: () => {
            modal.close();
            showA2hsGuide({ userAgent: options.userAgent, zIndex: options.zIndex });
          },
        }),
      );
      actions.append(createButton("あとで", { variant: "ghost", onClick: modal.close }));
      body.append(actions);
      break;
    }

    case "ready":
      modal.setTitle("通知を許可してください");
      body.append(
        createParagraph(
          "このあとブラウザが「通知を許可しますか？」と尋ねます。「許可」を選ぶと、お知らせを受け取れます。",
        ),
      );
      body.append(
        createNote("許可は後からブラウザやスマホの設定でいつでも変更できます。"),
      );
      appendClose(body, modal);
      break;

    case "denied":
      modal.setTitle("通知がオフになっています");
      body.append(
        createParagraph("通知がブロックされています。次の手順で「許可」に変更してください。"),
      );
      body.append(renderSteps(controller.getReenableSteps()));
      appendClose(body, modal);
      break;

    case "unsupported":
      modal.setTitle("この環境では通知を使えません");
      body.append(
        createParagraph(
          "お使いのブラウザは通知に対応していません。最新のブラウザ（iPhone は Safari、Android は Chrome）で開き直してください。",
        ),
      );
      appendClose(body, modal);
      break;
  }
}

export { createPushGuide, detectPushStatus } from "./controller.js";
export type { PushController, PushStatus } from "./types.js";
