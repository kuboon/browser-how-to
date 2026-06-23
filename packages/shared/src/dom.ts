import type { GuideStep } from "./types.js";

const STYLE_ID = "bht-base-styles";

const BASE_CSS = `
.bht-overlay {
  position: fixed; inset: 0; z-index: var(--bht-z, 2147483000);
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(0,0,0,.5); padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN",
    "Hiragino Sans", "Noto Sans JP", Meiryo, sans-serif;
  -webkit-font-smoothing: antialiased;
  animation: bht-fade .2s ease;
}
@media (min-width: 600px) { .bht-overlay { align-items: center; padding: 16px; } }
.bht-card {
  background: #fff; color: #1a1a1a; width: 100%; max-width: 480px;
  border-radius: 16px 16px 0 0; box-shadow: 0 -8px 40px rgba(0,0,0,.25);
  max-height: 90vh; overflow-y: auto; animation: bht-slide .25s ease;
}
@media (min-width: 600px) { .bht-card { border-radius: 16px; } }
.bht-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 8px; gap: 12px;
}
.bht-title { font-size: 17px; font-weight: 700; margin: 0; line-height: 1.4; }
.bht-close {
  border: 0; background: #f0f0f0; color: #555; width: 32px; height: 32px;
  border-radius: 50%; font-size: 18px; cursor: pointer; flex: 0 0 auto;
}
.bht-close:hover { background: #e4e4e4; }
.bht-body { padding: 4px 20px 20px; font-size: 15px; line-height: 1.7; }
.bht-note {
  background: #f6f8fa; border-radius: 10px; padding: 10px 12px; margin: 12px 0 0;
  font-size: 13px; color: #555;
}
.bht-steps { list-style: none; counter-reset: bht; margin: 8px 0 0; padding: 0; }
.bht-step {
  position: relative; padding: 10px 0 10px 40px; counter-increment: bht;
  border-top: 1px solid #f0f0f0;
}
.bht-step:first-child { border-top: 0; }
.bht-step::before {
  content: counter(bht); position: absolute; left: 0; top: 10px;
  width: 26px; height: 26px; border-radius: 50%; background: #2563eb; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
}
.bht-step-note { display: block; color: #888; font-size: 13px; margin-top: 2px; }
.bht-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.bht-btn {
  appearance: none; border: 0; border-radius: 12px; padding: 14px 16px;
  font-size: 16px; font-weight: 700; cursor: pointer; width: 100%;
  background: #2563eb; color: #fff;
}
.bht-btn:hover { background: #1d4ed8; }
.bht-btn--ghost { background: #f0f0f0; color: #333; }
.bht-btn--ghost:hover { background: #e4e4e4; }
@keyframes bht-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes bht-slide { from { transform: translateY(16px); } to { transform: none; } }
@media (prefers-color-scheme: dark) {
  .bht-card { background: #1c1c1e; color: #f2f2f7; }
  .bht-close { background: #2c2c2e; color: #aaa; }
  .bht-note { background: #2c2c2e; color: #bbb; }
  .bht-step { border-top-color: #2c2c2e; }
  .bht-btn--ghost { background: #2c2c2e; color: #f2f2f7; }
}
`;

export function injectBaseStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = BASE_CSS;
  doc.head.appendChild(style);
}

export interface ModalHandle {
  root: HTMLElement;
  body: HTMLElement;
  close: () => void;
  setTitle: (title: string) => void;
}

export interface ModalOptions {
  title: string;
  zIndex?: number;
  onClose?: () => void;
  doc?: Document;
}

export function createModal(opts: ModalOptions): ModalHandle {
  const doc = opts.doc ?? document;
  injectBaseStyles(doc);

  const overlay = doc.createElement("div");
  overlay.className = "bht-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  if (opts.zIndex != null) overlay.style.setProperty("--bht-z", String(opts.zIndex));

  const card = doc.createElement("div");
  card.className = "bht-card";

  const header = doc.createElement("div");
  header.className = "bht-header";
  const titleEl = doc.createElement("h2");
  titleEl.className = "bht-title";
  titleEl.textContent = opts.title;
  const closeBtn = doc.createElement("button");
  closeBtn.className = "bht-close";
  closeBtn.setAttribute("aria-label", "閉じる");
  closeBtn.textContent = "×";
  header.append(titleEl, closeBtn);

  const body = doc.createElement("div");
  body.className = "bht-body";

  card.append(header, body);
  overlay.append(card);

  const close = () => {
    overlay.remove();
    doc.removeEventListener("keydown", onKey);
    opts.onClose?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  doc.addEventListener("keydown", onKey);
  doc.body.appendChild(overlay);

  return {
    root: overlay,
    body,
    close,
    setTitle: (t: string) => {
      titleEl.textContent = t;
    },
  };
}

export function renderSteps(steps: GuideStep[], doc: Document = document): HTMLElement {
  const ol = doc.createElement("ol");
  ol.className = "bht-steps";
  for (const step of steps) {
    const li = doc.createElement("li");
    li.className = "bht-step";
    li.append(doc.createTextNode(step.text));
    if (step.note) {
      const note = doc.createElement("span");
      note.className = "bht-step-note";
      note.textContent = step.note;
      li.append(note);
    }
    ol.append(li);
  }
  return ol;
}

export function createButton(
  label: string,
  opts: { variant?: "primary" | "ghost"; onClick?: () => void; doc?: Document } = {},
): HTMLButtonElement {
  const doc = opts.doc ?? document;
  const btn = doc.createElement("button");
  btn.className = "bht-btn" + (opts.variant === "ghost" ? " bht-btn--ghost" : "");
  btn.textContent = label;
  if (opts.onClick) btn.addEventListener("click", opts.onClick);
  return btn;
}

export function createParagraph(text: string, doc: Document = document): HTMLElement {
  const p = doc.createElement("p");
  p.style.margin = "0 0 8px";
  p.textContent = text;
  return p;
}

export function createNote(text: string, doc: Document = document): HTMLElement {
  const el = doc.createElement("div");
  el.className = "bht-note";
  el.textContent = text;
  return el;
}
