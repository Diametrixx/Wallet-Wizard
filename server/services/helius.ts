// server/services/helius.ts
import axios from "axios";

// Use the provided Helius API key
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "5ad98011-c959-40fd-b12f-2cbbcca72088";
const HELIUS_BASE_URL = "https://api.helius.xyz/v0";

/**
 * Fetch transaction signatures for a wallet address
 */
export async function fetchSignatures(walletAddress: string): Promise<string[]> {
  try {
    const signatures: string[] = [];
    let lastSignature: string | null = null;
    const limit = 1000;
    const baseUrl = `${HELIUS_BASE_URL}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;

    console.log(`🔍 Fetching transaction signatures for wallet ${walletAddress}`);
    
    // Fetch up to 3 pages of signatures (oldest transactions are less important)
    let pageCount = 0;
    const maxPages = 3;

    while (pageCount < maxPages) {
      let url = baseUrl;
      if (lastSignature) {
        url += `&before=${lastSignature}`;
      }

      const response = await axios.get(url);
      if (response.status !== 200 || !response.data) {
        console.error("❌ Helius transaction fetch failed:", response.statusText);
        break;
      }

      const transactions = response.data;
      if (!transactions || transactions.length === 0) {
        console.log("No more transactions available.");
        break;
      }

      const fetchedSignatures = transactions.map((tx: any) => tx.signature).filter(Boolean);
      signatures.push(...fetchedSignatures);
      
      console.log(`📝 Fetched ${fetchedSignatures.length} signatures (page ${pageCount + 1})`);

      lastSignature = transactions[transactions.length - 1].signature;
      pageCount++;

      if (fetchedSignatures.length < limit) {
        // Reached the end of available transactions
        break;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return signatures;
  } catch (err) {
    console.error("❌ Failed to fetch signatures:", err);
    return [];
  }
}

/**
 * Fetch enriched transaction data for a list of signatures
 */
export async function fetchEnrichedTransactions(signatures: string[]): Promise<any[]> {
  const enriched: any[] = [];
  const CHUNK_SIZE = 100; // Helius API limit
  
  for (let i = 0; i < signatures.length; i += CHUNK_SIZE) {
    try {
      const chunk = signatures.slice(i, i + CHUNK_SIZE);
      console.log(`📤 Fetching enriched data for transactions ${i+1}-${i+chunk.length}`);
      
      const response = await axios.post(
        `${HELIUS_BASE_URL}/transactions?api-key=${HELIUS_API_KEY}`,
        { transactions: chunk }
      );
      
      if (response.status === 200 && response.data) {
        enriched.push(...response.data);
      } else {
        console.warn(`⚠️ Failed to fetch data for chunk starting at ${i}`);
      }
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error fetching transaction data for chunk:`, error);
    }
  }
  
  return enriched;
}

/**
 * Fetch parsed transaction history for a wallet address directly
 * Uses the endpoint specified in your message
 */
export async function fetchParsedTransactionHistory(walletAddress: string, limit = 100): Promise<any[]> {
  try {
    console.log(`🔍 Fetching parsed transaction history for wallet ${walletAddress}`);
    
    const url = `${HELIUS_BASE_URL}/addresses/${walletAddress}/transactions/?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    const response = await axios.get(url);
    
    if (response.status !== 200 || !response.data) {
      console.error("❌ Helius parsed transactions fetch failed:", response.statusText);
      return [];
    }
    
    console.log(`📊 Retrieved ${response.data.length} parsed transactions`);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch parsed transaction history:", error);
    return [];
  }
}

/**
 * Get token metadata including market cap and holder count
 */
export async function getHeliusTokenMetadata(mintAddress: string) {
  try {
    const resp = await axios.get(`${HELIUS_BASE_URL}/token-metadata?mint=${mintAddress}&api-key=${HELIUS_API_KEY}`);
    if (resp.status !== 200 || !resp.data) {
      console.warn(`⚠️ No metadata found for mint ${mintAddress}`);
      return null;
    }
    
    const { marketCap, holderCount, name, symbol, image } = resp.data;
    return { marketCap, holderCount, name, symbol, image };
  } catch (err) {
    console.error(`⚠️ Failed to fetch metadata for mint ${mintAddress}`, err);
    return null;
  }
}

/**
 * Get all token balances for a wallet
 */
export async function getTokenBalances(walletAddress: string) {
  try {
    const response = await axios.get(`${HELIUS_BASE_URL}/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`);
    
    if (response.status !== 200) {
      console.error(`❌ Failed to fetch token balances: ${response.statusText}`);
      return { tokens: [], nativeBalance: 0 };
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching token balances:", error);
    return { tokens: [], nativeBalance: 0 };
  }
}
