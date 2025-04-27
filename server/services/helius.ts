// server/services/helius.ts
import axios from "axios";
import * as solWeb3 from '@solana/web3.js';

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
export async function fetchParsedTransactionHistory(walletAddress: string, maxTransactions = 100): Promise<any[]> {
  try {
    console.log(`🔍 Fetching parsed transaction history for wallet ${walletAddress}`);
    
    // Based on the API docs, we should not include the limit parameter directly in the URL
    // First try with the v0 API format
    const url = `${HELIUS_BASE_URL}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}`;
    
    try {
      const response = await axios.get(url);
      
      if (response.status === 200 && response.data && Array.isArray(response.data)) {
        console.log(`📊 Retrieved ${response.data.length} parsed transactions with v0 API`);
        return response.data.slice(0, maxTransactions); // Limit array size instead of API parameter
      }
    } catch (err) {
      console.log("v0 API format failed, trying v1 format...");
    }
    
    // Try with the v1 API format which might have different parameters
    const v1url = `https://api.helius.xyz/v1/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}`;
    const v1response = await axios.get(v1url);
    
    if (v1response.status === 200 && v1response.data && Array.isArray(v1response.data)) {
      console.log(`📊 Retrieved ${v1response.data.length} parsed transactions with v1 API`);
      return v1response.data.slice(0, maxTransactions);
    } else if (v1response.status === 200 && v1response.data && v1response.data.data) {
      // Some APIs wrap the result in a data property
      console.log(`📊 Retrieved ${v1response.data.data.length} parsed transactions with v1 API (data wrapper)`);
      return v1response.data.data.slice(0, maxTransactions);
    }
    
    console.error("❌ Helius parsed transactions fetch failed with both v0 and v1 formats");
    return [];
    
  } catch (error) {
    console.error("❌ Failed to fetch parsed transaction history:", error);
    
    // Fall back to using raw signatures if the parsed transaction endpoint fails
    try {
      console.log("Falling back to signatures + enrichment method");
      const signatures = await fetchSignatures(walletAddress);
      
      if (signatures.length > 0) {
        const enriched = await fetchEnrichedTransactions(signatures.slice(0, 50)); // Process up to 50 signatures
        return enriched;
      }
    } catch (fallbackError) {
      console.error("Fallback method also failed:", fallbackError);
    }
    
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
    // Try v0 API first
    try {
      const response = await axios.get(`${HELIUS_BASE_URL}/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`);
      
      if (response.status === 200 && response.data) {
        console.log(`💰 Fetched token balances successfully with v0 API`);
        return response.data;
      }
    } catch (e) {
      console.log("v0 balances API failed, trying v1...");
    }
    
    // Try v1 API format
    const v1response = await axios.get(`https://api.helius.xyz/v1/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`);
    
    if (v1response.status === 200 && v1response.data) {
      console.log(`💰 Fetched token balances successfully with v1 API`);
      return v1response.data;
    }
    
    // If we reach here, both API calls failed but didn't throw an exception
    console.error(`❌ Failed to fetch token balances: Both API versions returned non-200 status`);
    return { tokens: [], nativeBalance: 0 };
    
  } catch (error) {
    console.error("❌ Error fetching token balances:", error);
    
    // As a fallback, we can use Solana RPC directly to get the SOL balance at least
    try {
      const connection = new solWeb3.Connection('https://api.mainnet-beta.solana.com');
      const publicKey = new solWeb3.PublicKey(walletAddress);
      
      const balance = await connection.getBalance(publicKey);
      console.log(`💰 Fetched SOL balance using Solana RPC fallback: ${balance / 1e9} SOL`);
      return {
        tokens: [],
        nativeBalance: balance
      };
    } catch (fallbackError) {
      console.error("Fallback to Solana RPC also failed:", fallbackError);
      return { tokens: [], nativeBalance: 0 };
    }
  }
}
