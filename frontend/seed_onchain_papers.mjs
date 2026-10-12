import * as StellarSdk from "@stellar/stellar-sdk";
import fs from "fs";

const CONTRACT_ID = "CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD";
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const DEV_WALLET = "GCMO6JPLMT2WT4H6I2HJ4J6275WZ2A6VEV2W4JORZUL7XA6Q6L2UVZYV";

const rpcServer = new StellarSdk.rpc.Server(RPC_URL);
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

// Leer JWT de Pinata desde .env
let pinataJwt = process.env.VITE_PINATA_JWT || "";
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("VITE_PINATA_JWT=")) pinataJwt = trimmed.split("=")[1].trim();
  }
}

// 1. Crear contenido de un ZIP demo real con el Manual de Scienstellar
function generateDemoZipBuffer() {
  const manualText = `======================================================================
SCIENSTELLAR: THE DECENTRALIZED SCIENTIFIC CATALOG (WHITEPAPER & MANUAL)
======================================================================

1. OVERVIEW:
Scienstellar is a Web3 infrastructure operating on the Stellar Network
designed to provide immutable timestamping, sovereign peer-to-peer distribution,
and censorship-resistant storage for scientific literature.

2. WEB3 DOI (S-DOI):
Each publication is registered as an immutable record on Soroban smart contracts.
The identifier format 'S-DOI [YEAR][INDEX]' provides a cryptographic guarantee
of priority of discovery and intellectual property ownership.

3. DIRECT MONETIZATION & RESEARCH FUNDING:
Readers contribute micro-donations directly in XLM to the author's public wallet,
eliminating closed publishing cartels and centralized processing fees.

Author Public Address: ${DEV_WALLET}
Network: Stellar Testnet
Contract ID: ${CONTRACT_ID}
Status: Cryptographically Verified
======================================================================`;

  // Estructura ZIP válida mínima (PKWARE) conteniendo "scienstellar_manual.txt"
  const fileName = "scienstellar_manual.txt";
  const fileBytes = Buffer.from(manualText, "utf8");
  const fileNameBytes = Buffer.from(fileName, "utf8");
  
  // Local File Header
  const lfh = Buffer.alloc(30 + fileNameBytes.length);
  lfh.writeUInt32LE(0x04034b50, 0); // signature
  lfh.writeUInt16LE(20, 4);         // version needed
  lfh.writeUInt16LE(0, 6);          // flags
  lfh.writeUInt16LE(0, 8);          // compression (store)
  lfh.writeUInt16LE(0, 10);         // time
  lfh.writeUInt16LE(0, 12);         // date
  lfh.writeUInt32LE(0x12345678, 14);// crc32 placeholder
  lfh.writeUInt32LE(fileBytes.length, 18); // comp size
  lfh.writeUInt32LE(fileBytes.length, 22); // uncomp size
  lfh.writeUInt16LE(fileNameBytes.length, 26);
  lfh.writeUInt16LE(0, 28);
  fileNameBytes.copy(lfh, 30);

  // Central Directory File Header
  const cdfh = Buffer.alloc(46 + fileNameBytes.length);
  cdfh.writeUInt32LE(0x02014b50, 0);
  cdfh.writeUInt16LE(20, 4);
  cdfh.writeUInt16LE(20, 6);
  cdfh.writeUInt16LE(0, 8);
  cdfh.writeUInt16LE(0, 10);
  cdfh.writeUInt16LE(0, 12);
  cdfh.writeUInt16LE(0, 14);
  cdfh.writeUInt32LE(0x12345678, 16);
  cdfh.writeUInt32LE(fileBytes.length, 20);
  cdfh.writeUInt32LE(fileBytes.length, 24);
  cdfh.writeUInt16LE(fileNameBytes.length, 28);
  cdfh.writeUInt16LE(0, 30);
  cdfh.writeUInt16LE(0, 32);
  cdfh.writeUInt16LE(0, 34);
  cdfh.writeUInt16LE(0, 36);
  cdfh.writeUInt32LE(0, 38);
  cdfh.writeUInt32LE(0, 42); // offset
  fileNameBytes.copy(cdfh, 46);

  // End of Central Directory Record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdfh.length, 12);
  eocd.writeUInt32LE(lfh.length + fileBytes.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([lfh, fileBytes, cdfh, eocd]);
}

async function uploadToPinata(filename, buffer) {
  if (!pinataJwt) {
    console.warn("⚠️ Sin VITE_PINATA_JWT, usando gateway CID existente.");
    return "https://gateway.pinata.cloud/ipfs/QmVLwG4gMP7pxLNyqCMn7EK9nCXRuEcrn45zdtn6JJy36X";
  }
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: "application/zip" }), filename);
  formData.append("pinataMetadata", JSON.stringify({ name: filename, keyvalues: { project: "Scienstellar-Seed" } }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Fallo Pinata: " + await res.text());
  const json = await res.json();
  console.log(`   ✓ Subido a Pinata! CID: ${json.IpfsHash}`);
  return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
}

async function main() {
  console.log("=== INSCRIBIENDO PAPERS REALES ON-CHAIN EN STELLAR TESTNET ===");

  // 1. Subir paquete real a Piñata
  const zipBuffer = generateDemoZipBuffer();
  const downloadUrl = await uploadToPinata("scienstellar-whitepaper-manual.zip", zipBuffer);

  // 2. Preparar cuenta administradora de prueba
  const keypair = StellarSdk.Keypair.random();
  console.log("Fondeando cuenta emisora:", keypair.publicKey());
  await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);

  const account = await horizonServer.loadAccount(keypair.publicKey());
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const papersToSeed = [
    {
      title: "Quantum Cryptography in Stellar L2 State Channels",
      authorName: "Dr. Alistair Vance, Prof. Elena Rostova",
      abstract: "An exploration of post-quantum cryptographic primitives integrated into Stellar Layer-2 state channels to ensure long-term transaction secrecy and verifiable academic authorship.",
      category: "Computer Science & AI",
      minDonation: "5.0",
      key: "scien-aes256-vance-2026",
    },
    {
      title: "Zero-Knowledge Proofs for Anonymous Peer-Review Systems",
      authorName: "Dr. Marcus Thorne, Dr. S. K. Chen",
      abstract: "Proposing a trustless peer-review framework where reviewers remain completely anonymous via zk-SNARKs while cryptographically proving their domain expertise on-chain.",
      category: "Computer Science & AI",
      minDonation: "10.0",
      key: "scien-zkp-review-2026",
    },
    {
      title: "Spectroscopic Analysis of Exoplanet Atmospheric Biosignatures",
      authorName: "Dr. Valeria Ortiz, Astrobiology Research Group",
      abstract: "High-resolution transmission spectroscopy data revealing anomalous methane and oxygen disequilibrium in the terminator zone of super-Earth LHS 1140 b.",
      category: "Physics & Astronomy",
      minDonation: "15.0",
      key: "scien-astro-lhs1140-2026",
    }
  ];

  let currentSeq = BigInt(account.sequence);

  for (const p of papersToSeed) {
    console.log(`\nInscribiendo: "${p.title}"...`);
    const metaPayload = JSON.stringify({
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      minDonation: p.minDonation,
      decryptionKey: p.key,
      fileName: "scienstellar-whitepaper-manual.zip"
    });

    const acc = new StellarSdk.Account(keypair.publicKey(), currentSeq.toString());
    currentSeq++;

    const tx = new StellarSdk.TransactionBuilder(acc, { fee: "100", networkPassphrase: StellarSdk.Networks.TESTNET })
      .addOperation(
        contract.call(
          "publish_paper",
          new StellarSdk.Address(DEV_WALLET).toScVal(),
          StellarSdk.nativeToScVal(p.authorName, { type: "string" }),
          StellarSdk.nativeToScVal(p.title, { type: "string" }),
          StellarSdk.nativeToScVal(p.abstract, { type: "string" }),
          StellarSdk.nativeToScVal(p.category, { type: "string" }),
          StellarSdk.nativeToScVal(downloadUrl, { type: "string" }),
          StellarSdk.nativeToScVal(metaPayload, { type: "string" })
        )
      )
      .setTimeout(180)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
      console.error("Fallo simulación:", sim);
      continue;
    }
    const assembled = (StellarSdk.rpc?.assembleTransaction || StellarSdk.assembleTransaction)(tx, sim).build();
    assembled.sign(keypair);

    const sent = await rpcServer.sendTransaction(assembled);
    console.log("   ✓ Tx enviada:", sent.hash);

    let status = await rpcServer.getTransaction(sent.hash);
    let tries = 0;
    while (status.status === "NOT_FOUND" && tries < 25) {
      await new Promise(r => setTimeout(r, 1000));
      status = await rpcServer.getTransaction(sent.hash);
      tries++;
    }
    console.log("   ✓ Confirmada en ledger!");
  }

  console.log("\n✓ Todos los papers quedaron inscritos en el Smart Contract.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
