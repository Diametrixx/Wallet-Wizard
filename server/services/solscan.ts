import axios from "axios";

const SOLSCAN_API_URL = "https://api.solscan.io/account";
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY;

export async function getSolscanTokenInfo(mintAddress: string) {
  try {
    const response = await axios.get(`${SOLSCAN_API_URL}/${mintAddress}`, {
      headers: {
        Authorization: `Bearer ${SOLSCAN_API_KEY}`,
      },
    });

    if (response.data?.data) {
      const tokenInfo = response.data.data;
      return {
        marketCap: tokenInfo?.marketCap || 0,
        holdersCount: tokenInfo?.holders || 0,
      };
    } else {
      console.warn(`⚠️ Solscan: No data for mint ${mintAddress}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Solscan request failed for ${mintAddress}:`, error);
    return null;
  }
}
