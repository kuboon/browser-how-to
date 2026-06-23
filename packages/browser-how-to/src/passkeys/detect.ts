import type { PasskeyCapabilities } from "./types.js";

/** getClientCapabilities() が返すオブジェクトの形（必要分のみ）。 */
interface ClientCapabilities {
  conditionalCreate?: boolean;
  conditionalGet?: boolean;
  hybridTransport?: boolean;
  passkeyPlatformAuthenticator?: boolean;
  userVerifyingPlatformAuthenticator?: boolean;
  relatedOrigins?: boolean;
  [key: string]: boolean | undefined;
}

interface PublicKeyCredentialStatic {
  getClientCapabilities?: () => Promise<ClientCapabilities>;
  isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
  isConditionalMediationAvailable?: () => Promise<boolean>;
}

function getPublicKeyCredential(): PublicKeyCredentialStatic | undefined {
  const g = globalThis as { PublicKeyCredential?: PublicKeyCredentialStatic };
  return g.PublicKeyCredential;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * パスキー（WebAuthn）の対応状況を検出する。
 * 可能なら getClientCapabilities()（Safari 17.4+ / Chrome 133+ / Firefox 135+）を使い、
 * 使えない環境では isUVPAA() / isConditionalMediationAvailable() にフォールバックする。
 */
export async function detectPasskeyCapabilities(): Promise<PasskeyCapabilities> {
  const PKC = getPublicKeyCredential();
  if (!PKC) {
    return {
      webauthnSupported: false,
      platformAuthenticatorAvailable: false,
      conditionalMediationAvailable: false,
      crossDeviceSupported: false,
      relatedOriginsSupported: false,
      usedClientCapabilities: false,
    };
  }

  let caps: ClientCapabilities | null = null;
  if (typeof PKC.getClientCapabilities === "function") {
    caps = await safe(() => PKC.getClientCapabilities!(), null);
  }

  if (caps) {
    return {
      webauthnSupported: true,
      platformAuthenticatorAvailable: caps.userVerifyingPlatformAuthenticator ?? false,
      conditionalMediationAvailable: caps.conditionalGet ?? false,
      // hybridTransport が無くても passkeyPlatformAuthenticator があればクロスデバイス可能。
      crossDeviceSupported:
        caps.hybridTransport ?? caps.passkeyPlatformAuthenticator ?? true,
      relatedOriginsSupported: caps.relatedOrigins ?? false,
      usedClientCapabilities: true,
    };
  }

  // フォールバック（getClientCapabilities 非対応ブラウザ）。
  const platform =
    typeof PKC.isUserVerifyingPlatformAuthenticatorAvailable === "function"
      ? await safe(() => PKC.isUserVerifyingPlatformAuthenticatorAvailable!(), false)
      : false;
  const conditional =
    typeof PKC.isConditionalMediationAvailable === "function"
      ? await safe(() => PKC.isConditionalMediationAvailable!(), false)
      : false;

  return {
    webauthnSupported: true,
    platformAuthenticatorAvailable: platform,
    conditionalMediationAvailable: conditional,
    // 現代の WebAuthn 対応ブラウザはおおむねクロスデバイス（QR）に対応しているため true と推定。
    crossDeviceSupported: true,
    relatedOriginsSupported: false,
    usedClientCapabilities: false,
  };
}
