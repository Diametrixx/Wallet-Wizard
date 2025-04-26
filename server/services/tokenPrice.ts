// server/services/tokenPrice.ts
import axios from "axios";
import { coinGeckoMapping } from "./coinGeckoMap";


export async function getTokenPrice(mint: string): Promise<number> {
  // First try Jupiter
  try {
    const jupResp = await axios.get(`https://price.jup.ag/v2/price?ids=${mint}`);
    const jupPrice = jupResp.data?.data?.[mint]?.price;
    if (jupPrice) {
      console.log(`💰 Price from Jupiter: $${jupPrice}`);
      return jupPrice;
    }
  } catch (err) {
    console.warn(`⚠️ Jupiter failed for ${mint}`);
  }

  // Then try DexScreener
  try {
    const dexResp = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const pairs = dexResp.data?.pairs;
    if (pairs && pairs.length > 0) {
      const price = parseFloat(pairs[0].priceUsd);
      if (!isNaN(price)) {
        console.log(`💰 Price from DexScreener: $${price}`);
        return price;
      }
    }
  } catch (err) {
    console.warn(`⚠️ DexScreener failed for ${mint}`);
  }

  // Finally fallback to CoinGecko
  try {
    const coingeckoId = coinGeckoMapping[mint.toLowerCase()];
    if (coingeckoId) {
      const geckoResp = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: coingeckoId,
            vs_currencies: "usd",
          },
        }
      );
      const price = geckoResp.data?.[coingeckoId]?.usd;
      if (price) {
        console.log(`💰 Price from CoinGecko: $${price} (${coingeckoId})`);
        return price;
      }
    } else {
      console.warn(`⚠️ No CoinGecko ID mapping for ${mint}`);
    }
  } catch (err) {
    console.warn(`⚠️ CoinGecko fallback failed for ${mint}`);
  }

  console.warn(`❌ Price not found for mint: ${mint}`);
  return 0;
}
