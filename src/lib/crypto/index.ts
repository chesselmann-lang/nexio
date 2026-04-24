/**
 * Nexio E2E Encryption — TweetNaCl based
 *
 * Jede Nachricht wird mit dem Public Key des Empfängers verschlüsselt.
 * Nur der Empfänger (mit Private Key) kann entschlüsseln.
 * Der Server sieht ausschließlich Ciphertext.
 */
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from "tweetnacl-util";

const PRIVATE_KEY_STORAGE = "nexio_private_key";
const PUBLIC_KEY_STORAGE  = "nexio_public_key";

// ── Key Management ──────────────────────────────────────────────────────────

/** Generiert ein neues Schlüsselpaar und speichert es lokal */
export function generateKeyPair(): nacl.BoxKeyPair {
  const pair = nacl.box.keyPair();
  localStorage.setItem(PRIVATE_KEY_STORAGE, encodeBase64(pair.secretKey));
  localStorage.setItem(PUBLIC_KEY_STORAGE,  encodeBase64(pair.publicKey));
  return pair;
}

/** Gibt den gespeicherten Private Key zurück oder generiert einen neuen */
export function getOrCreateKeyPair(): nacl.BoxKeyPair {
  const storedPrivate = localStorage.getItem(PRIVATE_KEY_STORAGE);
  const storedPublic  = localStorage.getItem(PUBLIC_KEY_STORAGE);
  if (storedPrivate && storedPublic) {
    return {
      secretKey: decodeBase64(storedPrivate),
      publicKey: decodeBase64(storedPublic),
    };
  }
  return generateKeyPair();
}

/** Public Key als Base64-String (zum Speichern in Supabase) */
export function getPublicKeyB64(): string {
  const pair = getOrCreateKeyPair();
  return encodeBase64(pair.publicKey);
}

// ── Encryption ───────────────────────────────────────────────────────────────

/**
 * Verschlüsselt eine Nachricht für einen Empfänger.
 * @returns Base64-kodierter Ciphertext (Nonce + encrypted message)
 */
export function encryptMessage(
  plaintext: string,
  recipientPublicKeyB64: string
): string {
  const { secretKey } = getOrCreateKeyPair();
  const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = encodeUTF8(plaintext);

  const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, secretKey);

  // Nonce + Ciphertext zusammenpacken
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);

  return encodeBase64(combined);
}

/**
 * Entschlüsselt eine Nachricht vom Sender.
 * @returns Klartext oder null bei Fehler
 */
export function decryptMessage(
  ciphertextB64: string,
  senderPublicKeyB64: string
): string | null {
  try {
    const { secretKey } = getOrCreateKeyPair();
    const senderPublicKey = decodeBase64(senderPublicKeyB64);
    const combined = decodeBase64(ciphertextB64);

    const nonce     = combined.slice(0, nacl.box.nonceLength);
    const ciphertext = combined.slice(nacl.box.nonceLength);

    const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, secretKey);
    if (!decrypted) return null;

    return decodeUTF8(decrypted);
  } catch {
    return null;
  }
}

/**
 * Symmetrische Verschlüsselung für Gruppen-Chats
 * (shared secret, für alle Mitglieder)
 */
export function encryptSymmetric(plaintext: string, keyB64: string): string {
  const key = decodeBase64(keyB64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = encodeUTF8(plaintext);
  const encrypted = nacl.secretbox(message, nonce, key);
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  return encodeBase64(combined);
}

export function decryptSymmetric(ciphertextB64: string, keyB64: string): string | null {
  try {
    const key = decodeBase64(keyB64);
    const combined = decodeBase64(ciphertextB64);
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const ciphertext = combined.slice(nacl.secretbox.nonceLength);
    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
    if (!decrypted) return null;
    return decodeUTF8(decrypted);
  } catch {
    return null;
  }
}

/** Generiert einen zufälligen Gruppen-Schlüssel */
export function generateGroupKey(): string {
  return encodeBase64(nacl.randomBytes(nacl.secretbox.keyLength));
}
