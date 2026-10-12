export async function uploadRawFileToPinata(file, filename, title) {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT || "";
  const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY || "";
  const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY || "";

  if (!pinataJwt && !(pinataApiKey && pinataSecretKey)) {
    throw new Error("Credenciales de Pinata (VITE_PINATA_JWT) no configuradas en el archivo .env");
  }

  const formData = new FormData();
  formData.append("file", file, filename);

  const metadata = JSON.stringify({
    name: filename,
    keyvalues: {
      title: title,
      platform: "Scienstellar",
    }
  });
  formData.append("pinataMetadata", metadata);

  const headers = {};
  if (pinataJwt) {
    headers["Authorization"] = `Bearer ${pinataJwt}`;
  } else {
    headers["pinata_api_key"] = pinataApiKey;
    headers["pinata_secret_api_key"] = pinataSecretKey;
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinata error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
}
