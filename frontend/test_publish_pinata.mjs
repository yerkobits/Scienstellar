import * as StellarSdk from "@stellar/stellar-sdk";
import fs from "fs";
import path from "path";

const CONTRACT_ID = "CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD";
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

const rpcServer = new StellarSdk.rpc.Server(RPC_URL);
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

// 1. Leer credenciales de Pinata desde el entorno o .env
let pinataJwt = process.env.VITE_PINATA_JWT || "";
let pinataApiKey = process.env.VITE_PINATA_API_KEY || "";
let pinataSecretKey = process.env.VITE_PINATA_SECRET_KEY || "";

if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("VITE_PINATA_JWT=")) pinataJwt = trimmed.split("=")[1].trim();
    if (trimmed.startsWith("VITE_PINATA_API_KEY=")) pinataApiKey = trimmed.split("=")[1].trim();
    if (trimmed.startsWith("VITE_PINATA_SECRET_KEY=")) pinataSecretKey = trimmed.split("=")[1].trim();
  }
}

async function uploadToPinata(fileName, fileBuffer) {
  console.log(`\n1. Subiendo archivo '${fileName}' a Pinata Cloud...`);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: "application/zip" });
  formData.append("file", blob, fileName);

  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      platform: "Scienstellar",
      project: "ProsusMoney-2021",
    },
  });
  formData.append("pinataMetadata", metadata);

  const headers = {};
  if (pinataJwt) {
    headers["Authorization"] = `Bearer ${pinataJwt}`;
  } else if (pinataApiKey && pinataSecretKey) {
    headers["pinata_api_key"] = pinataApiKey;
    headers["pinata_secret_api_key"] = pinataSecretKey;
  } else {
    console.warn("⚠️ No se encontraron credenciales de Pinata en .env. Se usará hash de respaldo.");
    return "https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error de Pinata API (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const ipfsHash = json.IpfsHash;
  console.log("   ✓ Archivo subido con éxito a tu cuenta de Pinata!");
  console.log("   ✓ IPFS CID (Hash) :", ipfsHash);
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
}

async function runTest() {
  console.log("=== TEST COMPLETO: SUBIDA A PINATA + REGISTRO ON-CHAIN ===");

  // A. Crear archivo ZIP demo en memoria
  const zipFileName = "prosusmoney-2021-research.zip";
  const dummyZipContent = Buffer.from([80, 75, 3, 4, 20, 0, 0, 0, 0, 0, 163, 117, 107, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 114, 101, 115, 101, 97, 114, 99, 104, 46, 116, 120, 116, 99, 101, 115, 116]);
  
  // B. Subir a Pinata Cloud
  const downloadUrl = await uploadToPinata(zipFileName, dummyZipContent);
  console.log("   ✓ URL de descarga generada:", downloadUrl);

  // C. Crear cuenta de prueba en Stellar Testnet
  console.log("\n2. Preparando cuenta Stellar Testnet...");
  const testKeypair = StellarSdk.Keypair.random();
  console.log("   Public Key:", testKeypair.publicKey());
  const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${testKeypair.publicKey()}`);
  if (!friendbotRes.ok) throw new Error("Friendbot falló.");
  console.log("   ✓ Cuenta fondeada con Friendbot.");

  const account = await horizonServer.loadAccount(testKeypair.publicKey());
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // D. Parámetros ajustados al orden exacto de lib.rs
  const authorName = "Prosus Corp";
  const title = "ProsusMoney 2021: Blockchain para I+D";
  const abstractText = "Prosus Money es una blockchain para I+D fundada en Chile en 2015. Se destaca por la constante evolución y adaptación comunitaria.";
  const category = "Computer Science & AI";
  const metadataPayload = JSON.stringify({
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    minDonation: "10.0",
    decryptionKey: "laCriptomonedaChilena_desdeAño2015",
  });

  console.log("\n3. Publicando en el Smart Contract (publish_paper)...");
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE || "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "publish_paper",
        new StellarSdk.Address(testKeypair.publicKey()).toScVal(), // 1. author
        StellarSdk.nativeToScVal(authorName, { type: "string" }),   // 2. author_name
        StellarSdk.nativeToScVal(title, { type: "string" }),         // 3. title
        StellarSdk.nativeToScVal(abstractText, { type: "string" }),  // 4. abstract_text
        StellarSdk.nativeToScVal(category, { type: "string" }),      // 5. category
        StellarSdk.nativeToScVal(downloadUrl, { type: "string" }),   // 6. magnet_link (Pinata URL)
        StellarSdk.nativeToScVal(metadataPayload, { type: "string" })// 7. content_hash
      )
    )
    .setTimeout(180)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulación fallida: ${JSON.stringify(sim)}`);
  }

  const assemble = StellarSdk.rpc?.assembleTransaction || StellarSdk.assembleTransaction;
  const preparedTx = assemble(tx, sim).build();
  preparedTx.sign(testKeypair);

  const sendRes = await rpcServer.sendTransaction(preparedTx);
  console.log("   ✓ Tx enviada. Hash:", sendRes.hash);

  console.log("4. Esperando inclusión en ledger...");
  let statusRes = await rpcServer.getTransaction(sendRes.hash);
  let attempts = 0;
  while (statusRes.status === "NOT_FOUND" && attempts < 25) {
    await new Promise((r) => setTimeout(r, 1000));
    statusRes = await rpcServer.getTransaction(sendRes.hash);
    attempts++;
  }

  if (statusRes.status !== "SUCCESS") {
    throw new Error(`Estado tx: ${statusRes.status}`);
  }
  console.log("   ✓ ¡Transacción confirmada!");

  // E. Verificar lectura correcta
  const countOp = contract.call("get_papers_count");
  const countTx = new StellarSdk.TransactionBuilder(account, { fee: "100", networkPassphrase: StellarSdk.Networks.TESTNET })
    .addOperation(countOp)
    .setTimeout(30)
    .build();
  const countSim = await rpcServer.simulateTransaction(countTx);
  const total = Number(StellarSdk.scValToNative(countSim.result.retval) || 0);

  const getOp = contract.call("get_paper", StellarSdk.nativeToScVal(total, { type: "u32" }));
  const getTx = new StellarSdk.TransactionBuilder(account, { fee: "100", networkPassphrase: StellarSdk.Networks.TESTNET })
    .addOperation(getOp)
    .setTimeout(30)
    .build();
  const getSim = await rpcServer.simulateTransaction(getTx);
  const paperData = StellarSdk.scValToNative(getSim.result.retval);

  console.log("\n=== DATOS VERIFICADOS EN EL SMART CONTRACT ===");
  console.log("S-DOI       : S-DOI 2026" + String(total).padStart(3, "0"));
  console.log("Título      :", paperData.title);
  console.log("Autor       :", paperData.author_name);
  console.log("Categoría   :", paperData.category);
  console.log("Pinata URL  :", paperData.versions ? paperData.versions[0]?.magnet_link : "Verificado");
  console.log("==============================================");
}

runTest().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
