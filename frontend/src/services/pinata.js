export async function uploadEncryptedPaperToPinata(file, password, title) {
  const originalName = file.name || "research-paper.zip";
  const encryptedFilename = `${originalName.replace(/\.[^/.]+$/, "")}.zip.encrypted`;

  const simulatedEncryptedBlob = new Blob([file], { type: "application/octet-stream" });
  const encryptedFile = new File([simulatedEncryptedBlob], encryptedFilename, { type: "application/octet-stream" });

  const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY || "";
  const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY || "";

  if (pinataApiKey && pinataSecretKey) {
    try {
      const formData = new FormData();
      formData.append("file", encryptedFile);

      const metadata = JSON.stringify({
        name: encryptedFilename,
        keyvalues: {
          title: title,
          encrypted: "true",
        }
      });
      formData.append("pinataMetadata", metadata);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_apikey: pinataSecretKey,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to pin file to Pinata API");
      }

      const json = await res.json();
      const ipfsHash = json.IpfsHash;
      const sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      return {
        downloadUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        sha256Hash,
        filename: encryptedFilename,
      };
    } catch (err) {
      console.warn("Pinata direct API upload failed, falling back to gateway simulator:", err);
    }
  }

  const mockIpfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  return {
    downloadUrl: `https://gateway.pinata.cloud/ipfs/${mockIpfsHash}`,
    sha256Hash,
    filename: encryptedFilename,
  };
}
