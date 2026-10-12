import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

export const CONTRACT_ID = "CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD";
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

const rpcServer = new StellarSdk.rpc.Server(RPC_URL);
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

export async function fetchOnChainPapers() {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const networkPassphrase = StellarSdk.Networks.TESTNET;

    const account = await horizonServer.loadAccount("GCMO6JPLMT2WT4H6I2HJ4J6275WZ2A6VEV2W4JORZUL7XA6Q6L2UVZYV").catch(() => null);
    if (!account) return [];

    const countOp = contract.call("get_papers_count");
    const countTx = new StellarSdk.TransactionBuilder(account, { fee: "100", networkPassphrase })
      .addOperation(countOp)
      .setTimeout(30)
      .build();

    const countSim = await rpcServer.simulateTransaction(countTx);
    let totalPapers = 0;
    if (StellarSdk.rpc.Api.isSimulationSuccess(countSim)) {
      totalPapers = Number(StellarSdk.scValToNative(countSim.result.retval) || 0);
    }

    if (totalPapers <= 0) return [];

    const papers = [];
    for (let i = 1; i <= totalPapers; i++) {
      try {
        const getOp = contract.call("get_paper", StellarSdk.nativeToScVal(i, { type: "u32" }));
        const getTx = new StellarSdk.TransactionBuilder(account, { fee: "100", networkPassphrase })
          .addOperation(getOp)
          .setTimeout(30)
          .build();

        const getSim = await rpcServer.simulateTransaction(getTx);
        if (StellarSdk.rpc.Api.isSimulationSuccess(getSim)) {
          const item = StellarSdk.scValToNative(getSim.result.retval);
          if (item) {
            let meta = {};
            const rawHash = item.content_hash || item.metadata || "{}";
            try {
              meta = JSON.parse(rawHash);
            } catch {
              meta = { minDonation: "5", decryptionKey: "", hash: rawHash };
            }
            papers.push({
              id: String(i),
              sdoi: `S-DOI 2026${String(i).padStart(3, "0")}`,
              title: item.title || "Untitled Paper",
              authors: item.author_name || "Anonymous",
              abstract: item.abstract_text || "",
              category: item.category || "General Science",
              downloadUrl: item.magnet_link || item.download_url || "",
              minDonation: String(meta.minDonation || "5"),
              decryptionKey: meta.decryptionKey || "",
              sha256Hash: meta.hash || "",
              authorAddress: item.author ? item.author.toString() : "",
              isOnChain: true,
            });
          }
        }
      } catch (e) {
        console.warn(`Could not fetch paper #${i}:`, e);
      }
    }

    return papers;
  } catch (err) {
    console.error("Failed to fetch on-chain papers:", err);
    return [];
  }
}

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
    minDonation: String(minDonation || "5"),
    decryptionKey: decryptionKey || "",
  });

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE || "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "publish_paper",
        StellarSdk.nativeToScVal(authorName || "Anonymous", { type: "string" }),
        StellarSdk.nativeToScVal(title || "Untitled", { type: "string" }),
        StellarSdk.nativeToScVal(abstractText || "No abstract provided.", { type: "string" }),
        StellarSdk.nativeToScVal(category || "General", { type: "string" }),
        StellarSdk.nativeToScVal(downloadUrl || "", { type: "string" }),
        StellarSdk.nativeToScVal(metadataPayload, { type: "string" })
      )
    )
    .setTimeout(180)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed on Testnet: ${JSON.stringify(sim)}`);
  }

  const assemble = StellarSdk.rpc?.assembleTransaction || StellarSdk.assembleTransaction;
  const preparedTx = assemble(tx, sim).build();

  // Firma oficial limpia usando @stellar/freighter-api
  const signedResult = await signTransaction(preparedTx.toXDR(), {
    network: "TESTNET",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  });

  if (signedResult?.error) {
    throw new Error(signedResult.error);
  }

  const signedXdr = typeof signedResult === "string" ? signedResult : (signedResult?.signedTxXdr || signedResult);
  if (!signedXdr) {
    throw new Error("Transaction signature was declined in Freighter.");
  }

  const sendRes = await rpcServer.sendTransaction(
    StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET)
  );

  if (sendRes.status === "ERROR") {
    throw new Error(`Submission rejected: ${JSON.stringify(sendRes.errorResult)}`);
  }

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
