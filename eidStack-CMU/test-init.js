// Simulate exactly what setup-agent.sh step 3 does
const http = require("http");

const data = JSON.stringify({
  walletId: "cottonpay-issuer-wallet",
  walletKey: "cottonpay-secure-key-2024",
  endpoint: "http://localhost:3021",
  label: "CottonPay-Issuer",
  seed: "CottonPaySecretSeedPourUriel2024"
});

const options = {
  hostname: "localhost",
  port: 4000,
  path: "/credo-agent/initAgent",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length
  },
  timeout: 60000
};

console.log("Calling POST /credo-agent/initAgent ...");
console.log("Payload:", data);

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", body);
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
});

req.on("timeout", () => {
  console.error("Request timed out after 60s");
  req.destroy();
});

req.write(data);
req.end();
