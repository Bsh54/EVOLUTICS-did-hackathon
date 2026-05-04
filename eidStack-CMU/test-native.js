// Test native library loading
console.log("Testing native Hyperledger libraries...");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Arch:", process.arch);
console.log("");

try {
  require("@hyperledger/aries-askar-nodejs");
  console.log("[OK] aries-askar-nodejs loaded");
} catch (e) {
  console.error("[FAIL] aries-askar-nodejs:", e.message);
}

try {
  require("@hyperledger/indy-vdr-nodejs");
  console.log("[OK] indy-vdr-nodejs loaded");
} catch (e) {
  console.error("[FAIL] indy-vdr-nodejs:", e.message);
}

try {
  require("@hyperledger/anoncreds-nodejs");
  console.log("[OK] anoncreds-nodejs loaded");
} catch (e) {
  console.error("[FAIL] anoncreds-nodejs:", e.message);
}

console.log("\nDone.");
