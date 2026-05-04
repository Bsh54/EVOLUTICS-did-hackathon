const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:4000/issuance/offer', {
      credentialDefinitionId: "did:indy:bcovrin:test:VSv3eb9T7C2DT9fVsbv5Kn/anoncreds/v0/CLAIM_DEF/3157221/cotton-sale-receipt-v1",
      attributes: [
        {name: "farmer_npi", value: "test"},
        {name: "sale_date", value: "2026-04-23"},
        {name: "sale_time", value: "10:00"},
        {name: "cotton_weight_kg", value: "100"},
        {name: "unit_price_fcfa", value: "200"},
        {name: "total_amount_fcfa", value: "20000"},
        {name: "payment_reference", value: "ref"},
        {name: "payment_status", value: "paid"},
        {name: "payment_method", value: "momo"},
        {name: "transaction_id", value: "txn"},
        {name: "collection_point", value: "loc"}
      ]
    });
    console.log("SUCCESS:", response.data);
  } catch (error) {
    console.error("ERROR:");
    if (error.response) {
      console.error(error.response.status);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}
test();
