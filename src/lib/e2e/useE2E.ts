"use client";
/**
 * useE2E — React hook for E2E encryption in a DM conversation.
 * Handles key loading, peer key fetching, shared key derivation.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  generateKeyPair, exportPublicKey, importPublicKey,
  deriveSharedKey, encryptMessage, decryptMessage,
  keyFingerprint, EncryptedPayload
} from "./crypto";
import { saveKeyPair, loadKeyPair } from "./keystore";

export interface E2EState {
  enabled: boolean;
  ready: boolean;
  myFingerprint: string | null;
  peerFingerprint: string | null;
  encrypt: (text: string) => Promise<string>;  // returns JSON string
  decrypt: (json: string) => Promise<string>;  // parses JSON, decrypts
  setup: () => Promise<void>;
}

export function useE2E(myUserId: string | null, peerUserId: string | null): E2EState {
  const sharedKeyRef = useRef<CryptoKey | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [peerFingerprint, setPeerFingerprint] = useState<string | null>(null);

  const setup = useCallback(async () => {
    if (!myUserId) return;
    try {
      // Generate key pair and publish
      const kp = await generateKeyPair();
      await saveKeyPair(myUserId, kp);
      const pub = await exportPublicKey(kp.publicKey);
      await fetch("/api/e2e/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pub }),
      });
      const fp = await keyFingerprint(pub);
      setMyFingerprint(fp);
    } catch (e) {
      console.error("E2E setup failed", e);
    }
  }, [myUserId]);

  useEffect(() => {
    if (!myUserId || !peerUserId) return;

    let cancelled = false;
    (async () => {
      try {
        // Load or check our local key pair
        const myKP = await loadKeyPair(myUserId);
        if (!myKP) return; // not set up yet

        const myFP = await keyFingerprint(myKP.publicKeyB64);
        if (!cancelled) setMyFingerprint(myFP);

        // Fetch peer's public key from server
        const res = await fetch(`/api/e2e/keys/${peerUserId}`);
        if (!res.ok) return; // peer hasn't set up E2E
        const { publicKey: peerPub } = await res.json();
        if (!peerPub) return;

        const peerFP = await keyFingerprint(peerPub);
        if (!cancelled) setPeerFingerprint(peerFP);

        // Derive shared AES key
        const peerKey = await importPublicKey(peerPub);
        const shared = await deriveSharedKey(myKP.privateKey, peerKey);
        sharedKeyRef.current = shared;

        if (!cancelled) {
          setEnabled(true);
          setReady(true);
        }
      } catch (e) {
        console.error("E2E init error", e);
      }
    })();
    return () => { cancelled = true; };
  }, [myUserId, peerUserId]);

  const encrypt = useCallback(async (text: string): Promise<string> => {
    if (!sharedKeyRef.current) throw new Error("E2E not ready");
    const payload = await encryptMessage(sharedKeyRef.current, text);
    return JSON.stringify(payload);
  }, []);

  const decrypt = useCallback(async (json: string): Promise<string> => {
    if (!sharedKeyRef.current) throw new Error("E2E not ready");
    const payload: EncryptedPayload = JSON.parse(json);
    return decryptMessage(sharedKeyRef.current, payload);
  }, []);

  return { enabled, ready, myFingerprint, peerFingerprint, encrypt, decrypt, setup };
}
