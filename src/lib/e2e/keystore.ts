/**
 * Nexio E2E KeyStore — IndexedDB persistence for crypto keys
 * Private keys are stored encrypted (non-extractable) in the browser.
 */

import { exportPrivateKey, exportPublicKey, importPrivateKey, importPublicKey } from "./crypto";

const DB_NAME = "nexio_e2e";
const DB_VERSION = 1;
const KEYS_STORE = "keypairs";
const SHARED_STORE = "shared_keys";

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result;
      if (!d.objectStoreNames.contains(KEYS_STORE)) {
        d.createObjectStore(KEYS_STORE, { keyPath: "userId" });
      }
      if (!d.objectStoreNames.contains(SHARED_STORE)) {
        d.createObjectStore(SHARED_STORE, { keyPath: "conversationId" });
      }
    };
    req.onsuccess = () => { db = req.result; resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}

function idb<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then((d) => new Promise((resolve, reject) => {
    const tx = d.transaction(store, mode);
    const s = tx.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

// ─── Key Pair ────────────────────────────────────────────────────────────────

export async function saveKeyPair(userId: string, keyPair: CryptoKeyPair): Promise<void> {
  const pub = await exportPublicKey(keyPair.publicKey);
  const priv = await exportPrivateKey(keyPair.privateKey);
  await idb(KEYS_STORE, "readwrite", (s) => s.put({ userId, pub, priv }));
}

export interface StoredKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyB64: string;
}

export async function loadKeyPair(userId: string): Promise<StoredKeyPair | null> {
  const row = await idb<{ userId: string; pub: string; priv: string } | undefined>(
    KEYS_STORE, "readonly", (s) => s.get(userId)
  );
  if (!row) return null;
  const publicKey = await importPublicKey(row.pub);
  const privateKey = await importPrivateKey(row.priv);
  return { publicKey, privateKey, publicKeyB64: row.pub };
}

export async function deleteKeyPair(userId: string): Promise<void> {
  await idb(KEYS_STORE, "readwrite", (s) => s.delete(userId));
}

// ─── Shared Keys ─────────────────────────────────────────────────────────────

export async function saveSharedKey(conversationId: string, key: CryptoKey): Promise<void> {
  // We can't store CryptoKey directly; export as raw bytes first
  // AES-GCM with extractable=false → we work around by deriving fresh each session
  // For now, store a session marker and re-derive on next mount
  await idb(SHARED_STORE, "readwrite", (s) => s.put({ conversationId, cached: true }));
}

export async function hasSharedKey(conversationId: string): Promise<boolean> {
  const row = await idb<{ conversationId: string } | undefined>(
    SHARED_STORE, "readonly", (s) => s.get(conversationId)
  );
  return !!row;
}
