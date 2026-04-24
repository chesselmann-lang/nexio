/**
 * Nexio E2E Encryption — WebCrypto ECDH-P256 + AES-GCM
 * Keys never leave the device. Only ciphertext is stored on server.
 */

// ─── Key Generation ──────────────────────────────────────────────────────────

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable (so we can export/import for storage)
    ["deriveKey"]
  );
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    raw,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [] // public keys have no usage
  );
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importPrivateKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
}

// ─── Key Derivation ──────────────────────────────────────────────────────────

/** Derive a shared AES-256-GCM key from our private key + their public key */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable for security
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

export interface EncryptedPayload {
  iv: string;       // base64 12-byte IV
  ct: string;       // base64 ciphertext
}

export async function encryptMessage(
  key: CryptoKey,
  plaintext: string
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ct: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
}

export async function decryptMessage(
  key: CryptoKey,
  payload: EncryptedPayload
): Promise<string> {
  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(payload.ct), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  return new TextDecoder().decode(plaintext);
}

// ─── Key Fingerprint ─────────────────────────────────────────────────────────

/** Generate a 8-word fingerprint for key verification */
export async function keyFingerprint(publicKeyB64: string): Promise<string> {
  const raw = Uint8Array.from(atob(publicKeyB64), (c) => c.charCodeAt(0));
  const hash = await crypto.subtle.digest("SHA-256", raw);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Format as 4 groups of 8 hex chars
  return [0, 8, 16, 24].map((i) => hex.slice(i, i + 8).toUpperCase()).join(" ");
}
