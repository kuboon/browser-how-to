/**
 * Android Chrome 系のみ実装。`related_applications` に `platform: "webapp"` を
 * 登録しておくと、このオリジンの PWA が既にインストール済みか判定できる。
 * 未実装ブラウザやエンゲージメント不足時は空配列を返すだけなので、
 * 「true なら確実にインストール済み」の補助シグナルとしてのみ使う。
 */
export async function hasInstalledRelatedApps(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const getApps = (
    navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    }
  ).getInstalledRelatedApps;
  if (typeof getApps !== "function") return false;
  try {
    const apps = await getApps.call(navigator);
    return Array.isArray(apps) && apps.length > 0;
  } catch {
    return false;
  }
}
