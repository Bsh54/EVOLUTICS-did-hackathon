// Test Askar wallet creation (the actual operation that causes bus error)
const { Store } = require("@hyperledger/aries-askar-nodejs");

async function main() {
  console.log("Testing Askar wallet creation...");
  console.log("CWD:", process.cwd());
  
  const walletPath = "sqlite://" + process.env.HOME + "/.test-askar-wallet/test.db";
  console.log("Wallet path:", walletPath);
  
  try {
    const store = await Store.provision({
      uri: walletPath,
      keyMethod: "raw",
      passKey: "test-key-123",
    });
    console.log("[OK] Wallet created successfully!");
    await store.close();
    console.log("[OK] Wallet closed.");
  } catch (e) {
    console.error("[FAIL]", e.message);
    console.error(e.stack);
  }
}

main().catch(console.error);
