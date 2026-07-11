import {
  createButton,
  createNote,
  createParagraph,
  createModal,
  renderSteps,
  type ModalHandle,
} from "../core/dom.js";
import { createA2hs } from "./controller.js";
import type { A2hsController, A2hsStatus } from "./types.js";

export interface A2hsGuideOptions {
  /** 既存のコントローラを使う場合に指定。省略時は内部で生成。 */
  controller?: A2hsController;
  /** テスト/SSR 用の User-Agent。 */
  userAgent?: string;
  /** 重なり順。 */
  zIndex?: number;
  /** 閉じたときのコールバック。 */
  onClose?: () => void;
  /** ホーム画面に追加できたときのコールバック。 */
  onInstalled?: () => void;
}

export interface A2hsGuideHandle {
  close: () => void;
}

/**
 * ホーム画面追加の案内モーダルを表示する。
 * 環境を自動判定し、状況に応じて
 *  - インストールボタン（Android のプロンプト対応時）
 *  - 機種別の手動手順（iOS Safari など）
 *  - 標準ブラウザへの誘導（インアプリブラウザ時）
 * を出し分ける。
 */
export function showA2hsGuide(options: A2hsGuideOptions = {}): A2hsGuideHandle {
  const controller = options.controller ?? createA2hs({ userAgent: options.userAgent });
  const status = controller.getStatus();

  const modal = createModal({
    title: titleFor(status),
    zIndex: options.zIndex,
    onClose: options.onClose,
  });

  renderBody(modal, controller, status, options);

  if (status.support !== "installed") {
    // getInstalledRelatedApps() は非同期なので、初回描画後に確認できたら
    // インストール済み表示に差し替える(既に閉じられていれば何もしない)。
    controller.refreshInstallState().then((refreshed) => {
      if (refreshed.support === "installed" && !modal.closed) {
        modal.setTitle(titleFor(refreshed));
        renderBody(modal, controller, refreshed, options);
      }
    });
  }

  return { close: modal.close };
}

function titleFor(status: A2hsStatus): string {
  switch (status.support) {
    case "installed":
      return "すでにホーム画面に追加済みです";
    case "in-app-blocked":
      return "標準ブラウザで開いてください";
    case "native-prompt":
      return "ホーム画面に追加しますか？";
    case "unsupported":
      return "スマートフォンで開いてください";
    default:
      return controllerInstructionsTitle(status);
  }
}

function controllerInstructionsTitle(_status: A2hsStatus): string {
  return "ホーム画面に追加する";
}

function renderBody(
  modal: ModalHandle,
  controller: A2hsController,
  status: A2hsStatus,
  options: A2hsGuideOptions,
): void {
  const body = modal.body;
  body.replaceChildren();

  if (status.support === "installed") {
    body.append(createParagraph("このサイトはすでにホーム画面アプリとして使えます。"));
    const actions = document.createElement("div");
    actions.className = "bht-actions";
    actions.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
    body.append(actions);
    return;
  }

  if (status.support === "in-app-blocked") {
    renderInAppEscape(modal, controller, status, "ホーム画面に追加するには");
    return;
  }

  if (status.support === "native-prompt") {
    body.append(
      createParagraph("ワンタップでホーム画面に追加できます。"),
    );
    const actions = document.createElement("div");
    actions.className = "bht-actions";
    const installBtn = createButton("ホーム画面に追加", {
      onClick: async () => {
        const outcome = await controller.promptInstall();
        if (outcome === "accepted") {
          options.onInstalled?.();
          modal.close();
        } else if (outcome === "unavailable") {
          // プロンプトが使えなくなった場合は手順表示に切り替える。
          renderManual(modal, controller, options);
        }
      },
    });
    actions.append(installBtn);
    actions.append(createButton("あとで", { variant: "ghost", onClick: modal.close }));
    body.append(actions);
    return;
  }

  // manual / unsupported
  renderManual(modal, controller, options);
}

function renderInAppEscape(
  modal: ModalHandle,
  controller: A2hsController,
  status: A2hsStatus,
  _titleHint: string,
): void {
  const body = modal.body;
  body.replaceChildren();
  const appName = status.device.inApp.appLabel ?? "アプリ内ブラウザ";
  const browserLabel = status.device.platform === "android" ? "Chrome" : "Safari";
  modal.setTitle("標準ブラウザで開いてください");
  body.append(
    createParagraph(
      `${appName}の中ではホーム画面に追加できません。下のボタンで標準ブラウザ（${browserLabel}）を開いてください。`,
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

  // ボタンで開けない環境向けのフォールバック手順（遷移はさせない）。
  const result = controller.escapeInAppBrowser({ navigate: () => {} });
  const steps = result.method === "manual" ? result.steps : result.fallbackSteps;
  body.append(createNote("ボタンで開けないときは、次の操作をお試しください。"));
  body.append(renderSteps(steps));

  const closeRow = document.createElement("div");
  closeRow.className = "bht-actions";
  closeRow.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(closeRow);
}

function renderManual(
  modal: ModalHandle,
  controller: A2hsController,
  _options: A2hsGuideOptions,
): void {
  const body = modal.body;
  body.replaceChildren();
  const instructions = controller.getInstructions();
  modal.setTitle(instructions.title);
  body.append(renderSteps(instructions.steps));
  if (instructions.note) body.append(createNote(instructions.note));
  const actions = document.createElement("div");
  actions.className = "bht-actions";
  actions.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(actions);
}

export { createA2hs } from "./controller.js";
export type { A2hsController, A2hsStatus } from "./types.js";
