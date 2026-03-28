/**
 * Sales Service
 * Logique métier pour les ventes de coton et l'émission de credentials
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SalesService {
  constructor() {
    this.eidstackUrl = process.env.EIDSTACK_URL || 'http://localhost:4000';
    this.salesDbPath = path.resolve(__dirname, '../../data/sales.json');

    // Créer le dossier data s'il n'existe pas
    const dataDir = path.dirname(this.salesDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialiser le fichier sales.json s'il n'existe pas
    if (!fs.existsSync(this.salesDbPath)) {
      fs.writeFileSync(this.salesDbPath, JSON.stringify({ sales: [] }, null, 2));
    }
  }

  /**
   * Créer une vente et émettre un credential
   */
  async createSaleAndIssueCredential(saleData) {
    try {
      // 1. Calculer le montant total
      const total_amount_fcfa = saleData.weight_kg * saleData.unit_price_fcfa;

      // 2. Générer un ID de transaction unique
      const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 3. Simuler le paiement Mobile Money
      const payment_reference = `MOMO-${Date.now()}`;
      const payment_status = 'completed';
      const payment_method = 'Mobile Money';

      console.log('💰 Simulating Mobile Money payment...');
      console.log(`   Amount: ${total_amount_fcfa} FCFA`);
      console.log(`   Reference: ${payment_reference}`);

      // 4. Créer l'objet vente complet
      const sale = {
        id: transaction_id,
        farmer_npi: saleData.farmer_npi,
        farmer_name: saleData.farmer_name,
        farmer_phone: saleData.farmer_phone,
        sale_date: new Date().toISOString().split('T')[0],
        sale_time: new Date().toISOString().split('T')[1].split('.')[0],
        weight_kg: saleData.weight_kg,
        unit_price_fcfa: saleData.unit_price_fcfa,
        total_amount_fcfa: total_amount_fcfa,
        payment_reference: payment_reference,
        payment_status: payment_status,
        payment_method: payment_method,
        transaction_id: transaction_id,
        collection_point: saleData.collection_point,
        created_at: new Date().toISOString()
      };

      // 5. Sauvegarder la vente en base de données (JSON pour l'instant)
      this.saveSale(sale);

      console.log('✅ Sale saved to database');

      // 6. Récupérer le credentialDefinitionId pour CottonSaleReceiptCredential
      const credDefId = await this.getCottonSaleCredDefId();

      console.log('🪪 Issuing CottonSaleReceiptCredential...');
      console.log(`   CredDefId: ${credDefId}`);

      // 7. Préparer les attributs du credential
      const credentialAttributes = [
        { name: 'farmer_npi', value: sale.farmer_npi },
        { name: 'sale_date', value: sale.sale_date },
        { name: 'sale_time', value: sale.sale_time },
        { name: 'cotton_weight_kg', value: sale.weight_kg.toString() },
        { name: 'unit_price_fcfa', value: sale.unit_price_fcfa.toString() },
        { name: 'total_amount_fcfa', value: sale.total_amount_fcfa.toString() },
        { name: 'payment_reference', value: sale.payment_reference },
        { name: 'payment_status', value: sale.payment_status },
        { name: 'payment_method', value: sale.payment_method },
        { name: 'transaction_id', value: sale.transaction_id },
        { name: 'collection_point', value: sale.collection_point }
      ];

      // 8. Appeler eidStack-CMU pour émettre le credential
      const credentialOffer = await this.issueCredential(credDefId, credentialAttributes);

      console.log('✅ Credential offer created');

      // 9. Mettre à jour la vente avec les infos du credential
      sale.credential_exchange_id = credentialOffer.credentialExchangeId;
      sale.credential_state = credentialOffer.state;
      this.updateSale(sale);

      // 10. Retourner le résultat complet
      return {
        sale: sale,
        credential: {
          invitationUrl: credentialOffer.invitationUrl,
          shortUrl: credentialOffer.shortUrl,
          qrCode: credentialOffer.invitationQr,
          credentialExchangeId: credentialOffer.credentialExchangeId,
          state: credentialOffer.state
        }
      };

    } catch (error) {
      console.error('❌ Error in createSaleAndIssueCredential:', error);
      throw error;
    }
  }

  /**
   * Récupérer le credentialDefinitionId pour CottonSaleReceiptCredential
   */
  async getCottonSaleCredDefId() {
    try {
      // Récupérer toutes les credential definitions
      const response = await axios.get(`${this.eidstackUrl}/issuance/credential-definitions?page=1&limit=100`);

      if (!response.data.success) {
        throw new Error('Failed to fetch credential definitions');
      }

      // Chercher la credential definition pour CottonSaleReceiptCredential
      const credDefs = response.data.data.items;
      const cottonSaleCredDef = credDefs.find(cd =>
        cd.schema && cd.schema.name === 'CottonSaleReceiptCredential'
      );

      if (!cottonSaleCredDef) {
        throw new Error('CottonSaleReceiptCredential definition not found. Please run setup-agent.sh first.');
      }

      return cottonSaleCredDef.cred_def_id;

    } catch (error) {
      console.error('❌ Error fetching credential definition:', error.message);
      throw new Error('Failed to get CottonSaleReceiptCredential definition');
    }
  }

  /**
   * Émettre un credential via eidStack-CMU
   */
  async issueCredential(credentialDefinitionId, attributes) {
    try {
      const response = await axios.post(`${this.eidstackUrl}/issuance/offer`, {
        credentialDefinitionId: credentialDefinitionId,
        attributes: attributes
      });

      if (!response.data.success) {
        throw new Error('Failed to issue credential');
      }

      return response.data.data;

    } catch (error) {
      console.error('❌ Error issuing credential:', error.response?.data || error.message);
      throw new Error('Failed to issue credential via eidStack-CMU');
    }
  }

  /**
   * Vérifier l'état d'un credential
   */
  async getCredentialStatus(credentialExchangeId) {
    try {
      const response = await axios.get(
        `${this.eidstackUrl}/issuance/offerStatus?credentialExchangeId=${credentialExchangeId}`
      );

      return response.data;

    } catch (error) {
      console.error('❌ Error getting credential status:', error.message);
      throw new Error('Failed to get credential status');
    }
  }

  /**
   * Sauvegarder une vente dans le fichier JSON
   */
  saveSale(sale) {
    try {
      const data = JSON.parse(fs.readFileSync(this.salesDbPath, 'utf8'));
      data.sales.push(sale);
      fs.writeFileSync(this.salesDbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving sale:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une vente existante
   */
  updateSale(updatedSale) {
    try {
      const data = JSON.parse(fs.readFileSync(this.salesDbPath, 'utf8'));
      const index = data.sales.findIndex(s => s.id === updatedSale.id);

      if (index !== -1) {
        data.sales[index] = updatedSale;
        fs.writeFileSync(this.salesDbPath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('❌ Error updating sale:', error);
      throw error;
    }
  }
}

module.exports = new SalesService();
