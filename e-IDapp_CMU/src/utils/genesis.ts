import { getGenesisUrl } from '../config/env';

// Utility to fetch and cache BCovrin test genesis transactions
// Called from CredoAgentService during agent initialization

let cachedGenesis: string | null = null

export async function getGenesisTransactions(): Promise<string> {
  if (cachedGenesis) return cachedGenesis

  const GENESIS_URL = getGenesisUrl();

  // Check if GENESIS_URL is defined
  if (!GENESIS_URL || typeof GENESIS_URL !== 'string' || GENESIS_URL.trim() === '') {
    console.warn('GENESIS_URL is not defined or empty. Using empty string as fallback. Genesis transactions will need to be fetched later.');
    return ''
  }

  try {
    console.log('Fetching genesis transactions from:', GENESIS_URL);
    const response = await fetch(GENESIS_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch genesis: ${response.status} ${response.statusText}`)
    }
    cachedGenesis = await response.text()
    console.log('Successfully fetched genesis transactions, length:', cachedGenesis.length);
    return cachedGenesis
  } catch (e: any) {
    const errorMessage = e?.message || String(e);
    console.warn('Could not fetch remote genesis, falling back to empty string', {
      error: errorMessage,
      url: GENESIS_URL,
      errorType: e?.name || 'Unknown',
    });
    // Return empty string so indy-vdr can still initialize (will error later if used)
    return ''
  }
}