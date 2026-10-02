import * as StellarSdk from "@stellar/stellar-sdk";
import * as Freighter from "@stellar/freighter-api";

export const CONTRACT_ID = "CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

const rpcServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
const HorizonServer = StellarSdk.Horizon ? StellarSdk.Horizon.Server : StellarSdk.Server;
const horizonServer = new HorizonServer(HORIZON_URL);

// Public dummy account for read-only simulations (no wallet required)
const DUMMY_ACCOUNT = new StellarSdk.Account(
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  "0"
);

function parsePaper(rawPaper) {
  const get = (k) => (rawPaper[k] !== undefined ? rawPaper[k] : rawPaper.get ? rawPaper.get(k) : undefined);

  const id = Number(get("id") || 0);
  const authorAddress = String(get("author_address") || "");
  const authors = String(get("author_name") || "");
  const title = String(get("title") || "");
  const abstractText = String(get("abstract_text") || "");
  const category = String(get("category") || "General Science");
  const totalDonations = get("total_donations") ? String(get("total_donations")) : "0";

  const rawVersions = get("versions") || [];
  const versions = Array.isArray(rawVersions) ? rawVersions : [];
  const latest = versions.length > 0 ? versions[versions.length - 1] : {};

  const getVer = (k) => (latest[k] !== undefined ? latest[k] : latest.get ? latest.get(k) : "");
  const downloadUrl = String(getVer("magnet_link") || "");
  const rawHash = String(getVer("content_hash") || "");

  let sha256Hash = rawHash;
  let minDonation = "5";
  let decryptionKey = "";

  if (rawHash && (rawHash.startsWith("{") || rawHash.startsWith("["))) {
    try {
      const meta = JSON.parse(rawHash);
      if (meta.hash) sha256Hash = meta.hash;
      if (meta.minDonation) minDonation = String(meta.minDonation);
      if (meta.decryptionKey) decryptionKey = meta.decryptionKey;
    } catch (e) {
      // not JSON format
    }
  }

  return {
    id: String(id),
    title,
    authors,
    abstract: abstractText,
    category,
    authorAddress,
    minDonation,
    downloadUrl,
    sha256Hash,
    decryptionKey,
    totalDonations,
    isOnChain: true,
  };
}

/**
 * Reads all published papers from the Soroban smart contract on Testnet
 */
export async function fetchOnChainPapers() {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const countTx = new StellarSdk.TransactionBuilder(DUMMY_ACCOUNT, {
      fee: "100",
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(contract.call("get_papers_count"))
      .setTimeout(30)
      .build();

    const simCount = await rpcServer.simulateTransaction(countTx);
    if (!StellarSdk.rpc.Api.isSimulationSuccess(simCount)) {
      console.warn("Could not simulate get_papers_count:", simCount);
      return [];
    }

    const count = Number(StellarSdk.scValToNative(simCount.result.retval));
    if (!count || count <= 0) {
      return [];
    }

    const papers = [];
    for (let i = count; i >= 1; i--) {
      try {
        const paperTx = new StellarSdk.TransactionBuilder(DUMMY_ACCOUNT, {
          fee: "100",
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(contract.call("get_paper", StellarSdk.nativeToScVal(i, { type: "u32" })))
          .setTimeout(30)
          .build();

        const simPaper = await rpcServer.simulateTransaction(paperTx);
        if (StellarSdk.rpc.Api.isSimulationSuccess(simPaper)) {
          const raw = StellarSdk.scValToNative(simPaper.result.retval);
          papers.push(parsePaper(raw));
        }
      } catch (err) {
        console.error(`Failed to load paper #${i} from contract:`, err);
      }
    }

    return papers;
  } catch (err) {
    console.error("fetchOnChainPapers error:", err);
    return [];
  }
}

/**
 * Invokes publish_paper on the Soroban smart contract with Freighter signature
 */
export async function publishPaperOnChain({
  authorAddress,
  authorName,
  title,
  abstractText,
  category,
  downloadUrl,
  sha256Hash,
  minDonation,
  decryptionKey,
}) {
  let account;
  try {
    account = await horizonServer.loadAccount(authorAddress);
  } catch (e) {
    throw new Error(
      "Your wallet account is not funded on Stellar Testnet. Fund it with Friendbot at https://laboratory.stellar.org/#account-creator?network=testnet"
    );
  }

  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const metadataPayload = JSON.stringify({
    hash: sha256Hash || "",
    minDonation: minDonation || "5",
    decryptionKey: decryptionKey || "",
  });

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE || "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "publish_paper",
        new StellarSdk.Address(authorAddress).toScVal(),
        StellarSdk.nativeToScVal(authorName, { type: "string" }),
        StellarSdk.nativeToScVal(title, { type: "string" }),
        StellarSdk.nativeToScVal(abstractText, { type: "string" }),
        StellarSdk.nativeToScVal(category, { type: "string" }),
        StellarSdk.nativeToScVal(downloadUrl, { type: "string" }),
        StellarSdk.nativeToScVal(metadataPayload, { type: "string" })
      )
    )
    .setTimeout(180)
    .build();

  // 1. Simulate on Soroban RPC
  const sim = await rpcServer.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed on Testnet: ${JSON.stringify(sim)}`);
  }

  // 2. Assemble transaction with footprint & resource fees
  const assemble = StellarSdk.rpc?.assembleTransaction || StellarSdk.assembleTransaction;
  const preparedTx = assemble(tx, sim).build();

  // 3. Request signature from Freighter
  const signFn = Freighter.signTransaction || Freighter.default?.signTransaction;
  const signedResult = await signFn(preparedTx.toXDR(), {
    network: "TESTNET",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });

  if (signedResult?.error) {
    throw new Error(signedResult.error);
  }

  const signedXdr = typeof signedResult === "string" ? signedResult : signedResult?.signedTxXdr || signedResult;
  if (!signedXdr) {
    throw new Error("Transaction signature was declined in Freighter.");
  }

  // 4. Submit to Soroban RPC
  const sendRes = await rpcServer.sendTransaction(
    StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET)
  );

  if (sendRes.status === "ERROR") {
    throw new Error(`Submission rejected: ${JSON.stringify(sendRes.errorResult)}`);
  }

  // 5. Poll for confirmation
  let statusRes = await rpcServer.getTransaction(sendRes.hash);
  let attempts = 0;
  while (statusRes.status === "NOT_FOUND" && attempts < 25) {
    await new Promise((r) => setTimeout(r, 1000));
    statusRes = await rpcServer.getTransaction(sendRes.hash);
    attempts++;
  }

  if (statusRes.status !== "SUCCESS") {
    throw new Error(`On-chain transaction ended with status: ${statusRes.status}`);
  }

  return {
    success: true,
    hash: sendRes.hash,
  };
}
