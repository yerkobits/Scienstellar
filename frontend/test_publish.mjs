import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = "CAZKCBDXOFE5HUPULIPES6IJTJZYJG3GSIRWJEVP72LJ7MOPT42YJDWD";
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

const rpcServer = new StellarSdk.rpc.Server(RPC_URL);
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

async function runTest() {
  console.log("=== INICIANDO TEST DE PUBLICACIÓN EN SCIENSTELLAR (TESTNET) ===");

  // 1. Crear y fondear cuenta de prueba en Stellar Testnet
  const testKeypair = StellarSdk.Keypair.random();
  console.log("1. Generando cuenta de prueba...");
  console.log("   Public Key :", testKeypair.publicKey());

  console.log("   Fondeando con Friendbot...");
  const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${testKeypair.publicKey()}`);
  if (!friendbotRes.ok) {
    throw new Error("No se pudo fondear la cuenta con Friendbot.");
  }
  console.log("   ✓ Cuenta fondeada exitosamente con 10,000 XLM.");

  // 2. Cargar cuenta desde Horizon
  const account = await horizonServer.loadAccount(testKeypair.publicKey());
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // 3. Preparar metadata y parámetros
  const title = "ProsusMoney 2021: Blockchain para I+D";
  const authorName = "Prosus Corp";
  const abstractText = "Prosus Money es una blockchain para I+D fundada en Chile en 2015. Se destaca por la constante evolución y adaptación comunitaria.";
  const category = "Computer Science & AI";
  const downloadUrl = "https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

  const metadataPayload = JSON.stringify({
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    minDonation: "10.0",
    decryptionKey: "laCriptomonedaChilena_desdeAño2015",
  });

  console.log("\n2. Construyendo transacción para llamar a 'publish_paper'...");
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE || "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "publish_paper",
        new StellarSdk.Address(testKeypair.publicKey()).toScVal(),
        StellarSdk.nativeToScVal(title, { type: "string" }),
        StellarSdk.nativeToScVal(authorName, { type: "string" }),
        StellarSdk.nativeToScVal(abstractText, { type: "string" }),
        StellarSdk.nativeToScVal(category, { type: "string" }),
        StellarSdk.nativeToScVal(metadataPayload, { type: "string" }),
        StellarSdk.nativeToScVal(downloadUrl, { type: "string" })
      )
    )
    .setTimeout(180)
    .build();

  // 4. Simulación
  console.log("3. Simulando transacción en Soroban RPC...");
  const sim = await rpcServer.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
    console.error("   ❌ Falló la simulación:", JSON.stringify(sim, null, 2));
    throw new Error("Simulación fallida.");
  }
  console.log("   ✓ Simulación exitosa. Recursos y footprint calculados.");

  // 5. Ensamblado, firma y envío
  console.log("4. Firmando y enviando transacción on-chain...");
  const assemble = StellarSdk.rpc?.assembleTransaction || StellarSdk.assembleTransaction;
  const preparedTx = assemble(tx, sim).build();
  preparedTx.sign(testKeypair);

  const sendRes = await rpcServer.sendTransaction(preparedTx);
  if (sendRes.status === "ERROR") {
    console.error("   ❌ Error al enviar:", sendRes.errorResult);
    throw new Error("Transacción rechazada por la red.");
  }
  console.log("   ✓ Tx enviada. Hash:", sendRes.hash);

  // 6. Esperar confirmación
  console.log("5. Esperando confirmación en el ledger...");
  let statusRes = await rpcServer.getTransaction(sendRes.hash);
  let attempts = 0;
  while (statusRes.status === "NOT_FOUND" && attempts < 25) {
    await new Promise((r) => setTimeout(r, 1000));
    statusRes = await rpcServer.getTransaction(sendRes.hash);
    attempts++;
  }

  if (statusRes.status !== "SUCCESS") {
    throw new Error(`La transacción terminó con estado: ${statusRes.status}`);
  }
  console.log("   ✓ Transacción confirmada en Stellar Testnet!");

  // 7. Verificar lectura desde el contrato
  console.log("\n6. Verificando estado on-chain...");
  const countOp = contract.call("get_papers_count");
  const countTx = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(countOp)
    .setTimeout(30)
    .build();

  const countSim = await rpcServer.simulateTransaction(countTx);
  const total = Number(StellarSdk.scValToNative(countSim.result.retval) || 0);
  console.log(`   ✓ Total de papers registrados en el contrato: ${total}`);

  const getOp = contract.call("get_paper", StellarSdk.nativeToScVal(total, { type: "u32" }));
  const getTx = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(getOp)
    .setTimeout(30)
    .build();

  const getSim = await rpcServer.simulateTransaction(getTx);
  const paperData = StellarSdk.scValToNative(getSim.result.retval);
  console.log("\n=== DATOS DEL PAPER REGISTRADO (ON-CHAIN) ===");
  console.log("ID          :", total);
  console.log("Título      :", paperData.title);
  console.log("Autor       :", paperData.author_name);
  console.log("Categoría   :", paperData.category);
  console.log("URL/Magnet  :", paperData.magnet_link);
  console.log("=============================================");
}

runTest().catch((err) => {
  console.error("\n❌ Error en el test:", err.message);
  process.exit(1);
});
