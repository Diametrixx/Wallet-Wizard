// server/services/helius.ts
import axios from "axios";

export async function fetchSignatures(walletAddress: string): Promise<string[]> {
  try {
    const signatures: string[] = [];
    let lastSignature: string | null = null;
    const limit = 1000;
    const baseUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${process.env.HELIUS_API_KEY}`;

    while (true) {
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

      lastSignature = transactions[transactions.length - 1].signature;

      if (fetchedSignatures.length < limit) {
        break;
      }
    }

    return signatures;
  } catch (err) {
    console.error("❌ Failed to fetch signatures:", err);
    return [];
  }
}



export async function getHeliusTokenMetadata(mintAddress: string) {
  try {
    const resp = await axios.get(`https://api.helius.xyz/v0/token-metadata?mint=${mintAddress}&api-key=${process.env.HELIUS_API_KEY}`);
    if (resp.status !== 200 || !resp.data) {
      console.warn(`⚠️ No metadata found for mint ${mintAddress}`);
      return null;
    }
    const { marketCap, holderCount } = resp.data;
    return { marketCap, holderCount };
  } catch (err) {
    console.error(`⚠️ Failed to fetch metadata for mint ${mintAddress}`, err);
    return null;
  }
}
