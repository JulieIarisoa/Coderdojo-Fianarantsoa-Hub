"use client";

export type MessagePublicKey = JsonWebKey;

interface StoredIdentity {
  userId: string;
  publicKey: MessagePublicKey;
  privateKey: CryptoKey;
}

interface StoredIdentityRecord {
  userId: string;
  identities: StoredIdentity[];
}

const DATABASE_NAME = "coderdojo-message-keys";
const DATABASE_VERSION = 1;
const STORE_NAME = "identities";

function assertBrowserCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Le chiffrement des messages nécessite un navigateur compatible.");
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openKeyDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("Le stockage sécurisé des clés n'est pas disponible.");
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isStoredIdentityRecord(value: unknown): value is StoredIdentityRecord {
  return Boolean(value && typeof value === "object" && "identities" in value && Array.isArray((value as { identities?: unknown }).identities));
}

async function loadIdentities(userId: string): Promise<StoredIdentity[]> {
  const database = await openKeyDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const stored = await requestResult<StoredIdentity | StoredIdentityRecord | undefined>(
    transaction.objectStore(STORE_NAME).get(userId)
  );
  database.close();
  if (!stored) return [];
  if (isStoredIdentityRecord(stored)) {
    return stored.identities;
  }
  return [stored];
}

async function saveIdentity(identity: StoredIdentity) {
  const database = await openKeyDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const existing = await requestResult<StoredIdentity | StoredIdentityRecord | undefined>(
    store.get(identity.userId)
  );
  const identities =
    isStoredIdentityRecord(existing)
      ? existing.identities
      : existing
        ? [existing]
        : [];

  const withoutDuplicate = identities.filter(
    (candidate) =>
      candidate.publicKey.x !== identity.publicKey.x ||
      candidate.publicKey.y !== identity.publicKey.y
  );
  await requestResult(
    store.put({
      userId: identity.userId,
      identities: [identity, ...withoutDuplicate],
    } satisfies StoredIdentityRecord)
  );
  database.close();
}

export async function getOrCreateMessageIdentity(userId: string): Promise<StoredIdentity> {
  assertBrowserCrypto();

  const existing = await loadIdentities(userId);
  if (existing[0]) return existing[0];

  const generated = (await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  )) as CryptoKeyPair;

  const publicKey = await window.crypto.subtle.exportKey("jwk", generated.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", generated.privateKey);
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );

  const identity = { userId, publicKey, privateKey };
  await saveIdentity(identity);
  return identity;
}

/** Return all locally available identities, newest first. */
export async function getMessageIdentities(userId: string): Promise<StoredIdentity[]> {
  assertBrowserCrypto();
  const identities = await loadIdentities(userId);
  if (identities.length > 0) return identities;
  return [await getOrCreateMessageIdentity(userId)];
}

function encodeBase64(value: ArrayBuffer | ArrayBufferView): string {
  const bytes =
    value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : new Uint8Array(value.buffer as ArrayBuffer, value.byteOffset, value.byteLength);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function decodeBase64(value: string): ArrayBuffer {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

async function deriveMessageKey(privateKey: CryptoKey, publicKeyJwk: MessagePublicKey) {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(
  plaintext: string,
  senderPrivateKey: CryptoKey,
  recipientPublicKey: MessagePublicKey
) {
  assertBrowserCrypto();
  const messageKey = await deriveMessageKey(senderPrivateKey, recipientPublicKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    messageKey,
    new TextEncoder().encode(plaintext)
  );

  return {
    ciphertext: encodeBase64(ciphertext),
    iv: encodeBase64(iv),
  };
}

export async function decryptMessage(
  ciphertext: string,
  iv: string,
  recipientPrivateKey: CryptoKey,
  senderPublicKey: MessagePublicKey
) {
  assertBrowserCrypto();
  const messageKey = await deriveMessageKey(recipientPrivateKey, senderPublicKey);
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(iv) },
    messageKey,
    decodeBase64(ciphertext)
  );

  return new TextDecoder().decode(plaintext);
}
