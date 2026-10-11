/**
 * Uploads password-protected binary ZIP to external IPFS via Pinata
 */
export async function uploadToIPFS(fileBlob, fileName = "archive.zip") {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;

  if (!pinataJwt || pinataJwt.includes("TU_JWT")) {
    throw new Error(
      "Platform Pinata JWT is not configured in VPS .env. Please configure VITE_PINATA_JWT."
    );
  }

  const formData = new FormData();
  formData.append("file", fileBlob, fileName);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt.trim()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`IPFS upload failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const cid = data.IpfsHash;

  // Add filename query param so gateways force download as actual .zip file
  return {
    cid,
    url: `https://gateway.pinata.cloud/ipfs/${cid}?filename=${encodeURIComponent(fileName)}`,
  };
}
