// Utilidad de cifrado simétrico AES-GCM 256-bit usando Web Crypto API nativo del navegador

async function getKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptZipFile(file, password) {
  const fileBuffer = await file.arrayBuffer();

  // Calcular checksum SHA-256 del archivo original
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Salt e IV aleatorios
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await getKey(password, salt);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBuffer
  );

  // Empaquetar: [16 bytes salt] + [12 bytes IV] + [contenido cifrado]
  const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

  const encryptedBlob = new Blob([combined], { type: "application/octet-stream" });
  return {
    encryptedFile: new File([encryptedBlob], file.name, { type: "application/octet-stream" }),
    sha256Hash: sha256Hex,
  };
}

export async function decryptZipBuffer(arrayBuffer, password) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 28) throw new Error("Paquete corrupto o incompleto.");

  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const data = bytes.slice(28);

  const key = await getKey(password, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  return new Blob([decryptedBuffer], { type: "application/zip" });
}
