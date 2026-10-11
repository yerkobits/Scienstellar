import CryptoJS from "crypto-js";
import { configure, ZipReader, ZipWriter, BlobReader, BlobWriter } from "@zip.js/zip.js";

// Disable web workers to ensure direct in-memory execution in Vite
configure({ useWebWorkers: false });

export async function computeFileSHA256(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
        const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
        resolve(hash);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates a clean 24-character extraction password (no prefix)
 */
export function generateDecryptionKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let key = "";
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Takes the uploaded ZIP file, repacks all its contents into a standard
 * password-protected ZIP archive (ZipCrypto standard, compatible with all OS).
 */
export async function createPasswordProtectedZip(uploadedZipFile, password) {
  const sha256Hash = await computeFileSHA256(uploadedZipFile);
  let protectedZipBlob;

  try {
    const zipReader = new ZipReader(new BlobReader(uploadedZipFile));
    const entries = await zipReader.getEntries();

    const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

    for (const entry of entries) {
      if (entry.directory) {
        await zipWriter.add(entry.filename, undefined, { directory: true });
      } else {
        const entryDataBlob = await entry.getData(new BlobWriter());
        await zipWriter.add(entry.filename, new BlobReader(entryDataBlob), {
          password: password,
          zipCrypto: true, // Universal standard, identical to 'zip -e' in Linux Terminal
        });
      }
    }

    await zipReader.close();
    protectedZipBlob = await zipWriter.close();
  } catch (err) {
    console.warn("Could not extract entries, wrapping archive with password:", err);
    // Fallback: package the entire ZIP inside a protected ZIP envelope
    const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
    await zipWriter.add(uploadedZipFile.name, new BlobReader(uploadedZipFile), {
      password: password,
      zipCrypto: true,
    });
    protectedZipBlob = await zipWriter.close();
  }

  return {
    zipBlob: protectedZipBlob,
    sha256Hash,
    fileName: uploadedZipFile.name.toLowerCase().endsWith(".zip")
      ? uploadedZipFile.name
      : `${uploadedZipFile.name}.zip`,
  };
}
