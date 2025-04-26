// server/services/tokenPriceTracker.ts
import axios from "axios";
import { db } from "../db";
import { historicalTokenPrices } from "@shared/schema";
import { and, eq, gte, lte } from "drizzle-orm";

// Sources for token price data
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";
const COINGECKO_API = "https://api.coingecko.com/api/v3";
const JUPITER_PRICE_API = "https://price.jup.ag/v4/price";

/**
 * Get current price for a token from primary sources
 * Prioritizes Jupiter API for Solana tokens
 */
export async function getCurrentTokenPrice(mintAddress: string): Promise<{
  price: number;
  change24h?: number;
  lastUpdated: number;
}> {
  try {
    // First try Jupiter for real-time Solana token prices
    const jupiterResponse = await axios.get(`${JUPITER_PRICE_API}?ids=${mintAddress}`);
    
    if (jupiterResponse.status === 200 && jupiterResponse.data?.data?.[mintAddress]?.price) {
      return {
        price: jupiterResponse.data.data[mintAddress].price,
        lastUpdated: Date.now()
      };
    }
  } catch (error) {
    console.warn(`⚠️ Jupiter price lookup failed for ${mintAddress}`, error);
  }
  
  try {
    // Fall back to CoinGecko if Jupiter fails
    // We need to have a mapping from mint address to CoinGecko ID
    const mappingResult = await db.query.tokenPrices.findFirst({
      where: eq(historicalTokenPrices.tokenMint, mintAddress)
    });
    
    if (mappingResult?.coingeckoId) {
      const geckoUrl = `${COINGECKO_API}/coins/${mappingResult.coingeckoId}`;
      const geckoParams = {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      };
      
      const response = await axios.get(geckoUrl, { 
        params: geckoParams,
        headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {}
      });
      
      if (response.status === 200 && response.data) {
        const price = response.data.market_data?.current_price?.usd || 0;
        const change24h = response.data.market_data?.price_change_percentage_24h || 0;
        
        return {
          price,
          change24h,
          lastUpdated: Date.now()
        };
      }
    }
  } catch (error) {
    console.warn(`⚠️ CoinGecko price lookup failed for ${mintAddress}`, error);
  }
  
  // Return zero if all lookups fail
  return {
    price: 0,
    lastUpdated: Date.now()
  };
}

/**
 * Get historical price for a token at a specific timestamp
 */
export async function getHistoricalTokenPrice(
  mintAddress: string, 
  timestamp: number
): Promise<number> {
  try {
    // Try to fetch from our database first
    const historicalPrice = await db.query.historicalTokenPrices.findFirst({
      where: and(
        eq(historicalTokenPrices.tokenMint, mintAddress),
        // Look for prices within a 24-hour window of the timestamp
        gte(historicalTokenPrices.timestamp, new Date(timestamp - 12 * 60 * 60 * 1000)),
        lte(historicalTokenPrices.timestamp, new Date(timestamp + 12 * 60 * 60 * 1000))
      ),
      orderBy: (historicalPrices, { asc }) => [
        // Get the closest timestamp
        asc(
          sql`ABS(EXTRACT(EPOCH FROM ${historicalPrices.timestamp}) * 1000 - ${timestamp})`
        )
      ]
    });
    
    if (historicalPrice) {
      return historicalPrice.price;
    }
    
    // If not in our database, try CoinGecko historical data
    // We need to have a mapping from mint address to CoinGecko ID
    const mappingResult = await db.query.tokenPrices.findFirst({
      where: eq(historicalTokenPrices.tokenMint, mintAddress)
    });
    
    if (mappingResult?.coingeckoId) {
      // Convert timestamp to date string (YYYY-MM-DD)
      const date = new Date(timestamp);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const geckoUrl = `${COINGECKO_API}/coins/${mappingResult.coingeckoId}/history`;
      const response = await axios.get(geckoUrl, { 
        params: { date: dateStr },
        headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {}
      });
      
      if (response.status === 200 && response.data) {
        const price = response.data.market_data?.current_price?.usd || 0;
        
        // Store this price in our database for future reference
        if (price > 0) {
          await db.insert(historicalTokenPrices).values({
            tokenMint: mintAddress,
            coingeckoId: mappingResult.coingeckoId,
            price,
            timestamp: new Date(timestamp),
            source: 'coingecko'
          });
        }
        
        return price;
      }
    }
  } catch (error) {
    console.warn(`⚠️ Failed to get historical price for ${mintAddress} at ${new Date(timestamp).toISOString()}`, error);
  }
  
  // Return 0 if all lookups fail
  return 0;
}

/**
 * Store a batch of current prices for future historical reference
 */
export async function storeCurrentPrices(
  mintPrices: Record<string, number>
): Promise<void> {
  const now = new Date();
  const values = [];
  
  for (const [mint, price] of Object.entries(mintPrices)) {
    if (price > 0) {
      values.push({
        tokenMint: mint,
        price,
        timestamp: now,
        source: 'jupiter'
      });
    }
  }
  
  if (values.length > 0) {
    try {
      await db.insert(historicalTokenPrices).values(values);
      console.log(`✅ Stored ${values.length} current prices for historical reference`);
    } catch (error) {
      console.error("❌ Failed to store current prices:", error);
    }
  }
}

/**
 * Get price history for a token over a time period
 */
export async function getTokenPriceHistory(
  mintAddress: string,
  days: number = 30
): Promise<Array<{ timestamp: number, price: number }>> {
  try {
    // First check if we have CoinGecko ID for this token
    const mappingResult = await db.query.tokenPrices.findFirst({
      where: eq(historicalTokenPrices.tokenMint, mintAddress)
    });
    
    if (mappingResult?.coingeckoId) {
      const geckoUrl = `${COINGECKO_API}/coins/${mappingResult.coingeckoId}/market_chart`;
      const response = await axios.get(geckoUrl, { 
        params: { 
          vs_currency: 'usd', 
          days: days 
        },
        headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {}
      });
      
      if (response.status === 200 && response.data?.prices) {
        // Format is [[timestamp, price], [timestamp, price], ...]
        return response.data.prices.map((item: [number, number]) => ({
          timestamp: item[0],
          price: item[1]
        }));
      }
    }
    
    // If CoinGecko doesn't have data, check our database
    const startTimestamp = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const historicalPrices = await db.query.historicalTokenPrices.findMany({
      where: and(
        eq(historicalTokenPrices.tokenMint, mintAddress),
        gte(historicalTokenPrices.timestamp, startTimestamp)
      ),
      orderBy: (prices, { asc }) => [asc(prices.timestamp)]
    });
    
    if (historicalPrices.length > 0) {
      return historicalPrices.map(record => ({
        timestamp: record.timestamp.getTime(),
        price: record.price
      }));
    }
  } catch (error) {
    console.error(`❌ Failed to get price history for ${mintAddress}:`, error);
  }
  
  // Return empty array if no data found
  return [];
}

// Utility to fix SQL template literal
function sql(strings: TemplateStringsArray, ...values: any[]) {
  return { strings, values };
}