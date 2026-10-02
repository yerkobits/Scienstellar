import * as Freighter from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

const HorizonServer = StellarSdk.Horizon ? StellarSdk.Horizon.Server : StellarSdk.Server;
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new HorizonServer(HORIZON_URL);

/**
 * Checks whether Freighter extension is installed and available
 */
export async function isFreighterAvailable() {
  try {
    const fn = Freighter.isConnected || Freighter.default?.isConnected;
    if (!fn) return false;
    const res = await fn();
    if (typeof res === "boolean") return res;
    if (res && typeof res.isConnected === "boolean") return res.isConnected;
    return false;
  } catch (err) {
    console.error("Error checking Freighter availability:", err);
    return false;
  }
}

/**
 * Connects to Freighter and retrieves user public key
 */
export async function connectFreighterWallet() {
  const available = await isFreighterAvailable();
  if (!available) {
    throw new Error(
      "Freighter wallet extension was not detected. Please install Freighter from https://www.freighter.app/ and reload this page."
    );
  }

  const reqFn = Freighter.requestAccess || Freighter.default?.requestAccess;
  const getAddrFn = Freighter.getAddress || Freighter.default?.getAddress;

  let pubKey = "";
  if (reqFn) {
    const access = await reqFn();
    if (typeof access === "string") {
      pubKey = access;
    } else if (access && access.address) {
      pubKey = access.address;
    } else if (access && access.error) {
      throw new Error(access.error);
    }
  }

  if (!pubKey && getAddrFn) {
    const addr = await getAddrFn();
    pubKey = typeof addr === "string" ? addr : addr?.address;
  }

  if (!pubKey) {
    throw new Error("Could not retrieve public key. Please unlock Freighter and authorize the connection.");
  }

  return pubKey;
}

/**
 * Donates minimum XLM to the author on Stellar Testnet and validates the transaction
 */
export async function donateAndUnlock({ donorAddress, authorAddress, amountXlm, paperId }) {
  try {
    // 1. Verify if donor account exists and has funds on Testnet
    let account;
    try {
      account = await server.loadAccount(donorAddress);
    } catch (accountErr) {
      if (accountErr.response && accountErr.response.status === 404) {
        throw new Error(
          "Your wallet is not funded on Stellar Testnet yet. Fund it with free lumens using Friendbot at: https://laboratory.stellar.org/#account-creator?network=testnet"
        );
      }
      throw accountErr;
    }

    const TransactionBuilder = StellarSdk.TransactionBuilder;
    const Operation = StellarSdk.Operation;
    const Asset = StellarSdk.Asset;
    const Networks = StellarSdk.Networks;
    const Memo = StellarSdk.Memo;
    const BASE_FEE = StellarSdk.BASE_FEE || "100";

    // Stellar Memo text limit is 28 bytes
    const memoText = `Scien:${(paperId || "paper").slice(0, 20)}`;

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: authorAddress,
          asset: Asset.native(),
          amount: parseFloat(amountXlm).toFixed(7),
        })
      )
      .addMemo(Memo.text(memoText))
      .setTimeout(180)
      .build();

    const txXdr = tx.toXDR();
    const signFn = Freighter.signTransaction || Freighter.default?.signTransaction;
    if (!signFn) {
      throw new Error("Freighter signing function is not available.");
    }

    const signResult = await signFn(txXdr, {
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    if (signResult && signResult.error) {
      throw new Error(signResult.error);
    }

    const signedXdr = typeof signResult === "string" ? signResult : signResult?.signedTxXdr || signResult;

    if (!signedXdr) {
      throw new Error("Transaction signature was canceled or declined in Freighter.");
    }

    const transactionToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(transactionToSubmit);

    return {
      success: true,
      hash: result.hash,
    };
  } catch (error) {
    console.error("Donation execution failed:", error);
    if (error.response?.data?.extras?.result_codes) {
      const codes = JSON.stringify(error.response.data.extras.result_codes);
      throw new Error(`Transaction rejected by network: ${codes}`);
    }
    throw error;
  }
}
