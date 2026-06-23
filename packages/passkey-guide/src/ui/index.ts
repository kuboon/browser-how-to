import {
  createButton,
  createModal,
  createNote,
  createParagraph,
  renderSteps,
  type ModalHandle,
} from "@browser-how-to/shared/dom";
import { createPasskeyGuide } from "../controller.js";
import type {
  ExplainTopic,
  PasskeyExplainer,
  PasskeyGuideController,
  PasskeyStatus,
} from "../types.js";

export interface PasskeyGuideUiOptions {
  controller?: PasskeyGuideController;
  userAgent?: string;
  zIndex?: number;
  onClose?: () => void;
}

export interface PasskeyGuideHandle {
  close: () => void;
}

/**
 * パスキーの案内モーダルを表示する。
 * 環境を判定し、
 *  - 非対応 → 標準ブラウザへの誘導
 *  - インアプリブラウザ → 標準ブラウザへの脱出案内
 *  - この端末で使える → 仕組み・保存場所・クロスデバイスの説明
 *  - クロスデバイスのみ → スマホを使ったログイン手順
 * を出し分ける。
 */
export function showPasskeyGuide(options: PasskeyGuideUiOptions = {}): PasskeyGuideHandle {
  const controller = options.controller ?? createPasskeyGuide({ userAgent: options.userAgent });

  const modal = createModal({
    title: "パスキーについて",
    zIndex: options.zIndex,
    onClose: options.onClose,
  });
  modal.body.append(createParagraph("確認しています…"));

  controller.detect().then((status) => {
    renderBody(modal, controller, status);
  });

  return { close: modal.close };
}

function renderBody(
  modal: ModalHandle,
  controller: PasskeyGuideController,
  status: PasskeyStatus,
): void {
  const body = modal.body;
  body.replaceChildren();

  switch (status.support) {
    case "unsupported":
      modal.setTitle("この環境ではパスキーを使えません");
      body.append(
        createParagraph(
          "お使いのブラウザはパスキーに対応していません。最新のブラウザ（iPhone は Safari、Android は Chrome）で開き直してください。",
        ),
      );
      appendClose(body, modal);
      break;

    case "in-app-blocked":
      renderInApp(modal, controller, status);
      break;

    case "cross-device-only":
      renderTopic(modal, controller, "cross-device");
      break;

    case "full":
      renderFull(modal, controller, status);
      break;
  }
}

function renderInApp(
  modal: ModalHandle,
  controller: PasskeyGuideController,
  status: PasskeyStatus,
): void {
  const body = modal.body;
  const appName = status.device.inApp.appLabel ?? "アプリ内ブラウザ";
  modal.setTitle("標準ブラウザで開いてください");
  body.append(
    createParagraph(
      `${appName}の中ではパスキーを使えないことがあります。標準ブラウザで開き直してください。`,
    ),
  );

  const actions = document.createElement("div");
  actions.className = "bht-actions";
  if (status.device.platform === "android") {
    actions.append(
      createButton("標準ブラウザ（Chrome）で開く", {
        onClick: () => controller.escapeInAppBrowser({}),
      }),
    );
  } else {
    const result = controller.escapeInAppBrowser({});
    if (result.method === "manual") body.append(renderSteps(result.steps));
  }
  actions.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(actions);
}

function renderFull(
  modal: ModalHandle,
  controller: PasskeyGuideController,
  _status: PasskeyStatus,
): void {
  const body = modal.body;
  modal.setTitle("パスキーでかんたん・安全にログイン");
  const intro = controller.explain("what-is-passkey");
  for (const p of intro.body) body.append(createParagraph(p));

  body.append(
    createNote(
      "「スマホでログインしたのに、パソコンでログインできない」という心配はいりません。下のボタンで、別の端末での使い方も確認できます。",
    ),
  );

  const actions = document.createElement("div");
  actions.className = "bht-actions";
  actions.append(
    createButton("パスキーはどこに保存される？", {
      variant: "ghost",
      onClick: () => renderTopic(modal, controller, "where-saved", true),
    }),
  );
  actions.append(
    createButton("別の端末（パソコン）で使うには？", {
      variant: "ghost",
      onClick: () => renderTopic(modal, controller, "cross-device", true),
    }),
  );
  actions.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(actions);
}

function renderTopic(
  modal: ModalHandle,
  controller: PasskeyGuideController,
  topic: ExplainTopic,
  withBack = false,
): void {
  const body = modal.body;
  body.replaceChildren();
  const content: PasskeyExplainer = controller.explain(topic);
  modal.setTitle(content.title);
  for (const p of content.body) body.append(createParagraph(p));
  if (content.steps) body.append(renderSteps(content.steps));

  const actions = document.createElement("div");
  actions.className = "bht-actions";
  if (withBack) {
    actions.append(
      createButton("もどる", {
        variant: "ghost",
        onClick: () => renderFull(modal, controller, { support: "full" } as PasskeyStatus),
      }),
    );
  }
  actions.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(actions);
}

function appendClose(body: HTMLElement, modal: ModalHandle): void {
  const actions = document.createElement("div");
  actions.className = "bht-actions";
  actions.append(createButton("閉じる", { variant: "ghost", onClick: modal.close }));
  body.append(actions);
}

export { createPasskeyGuide, detectPasskeyStatus } from "../controller.js";
export type { PasskeyGuideController, PasskeyStatus } from "../types.js";
