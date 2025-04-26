import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { mkdir } from 'fs/promises';

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "contractMapping.json");

// Enhanced coin mapping that includes price data and historical information
export let coinGeckoMapping: Record<string, {
  id: string;
  price: number;
  priceChange24h: number;
  lastUpdated: number;
  historical?: Array<{
    timestamp: number;
    price: number;
  }>;
}> = {}; 

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function loadCoinGeckoMapping() {
  console.log("📦 Attempting to load contract mapping from cache...");

  try {
    // Create cache directory if it doesn't exist
    await mkdir(CACHE_DIR, { recursive: true });
    
    const cacheStat = await fs.stat(CACHE_FILE).catch(() => null);

    if (cacheStat) {
      const cacheAgeMs = Date.now() - cacheStat.mtimeMs;
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      if (cacheAgeMs < ONE_DAY_MS) {
        const cachedData = await fs.readFile(CACHE_FILE, "utf-8");
        coinGeckoMapping = JSON.parse(cachedData);
        console.log(`✅ Loaded ${Object.keys(coinGeckoMapping).length} tokens from cache`);
        return;
      }
    }

    console.log("🌐 Cache missing or stale, downloading from CoinGecko...");

    let page = 1;
    let allTokens: any[] = [];
    let keepFetching = true;

    // Set up CoinGecko API request with API key if available
    const params = {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 250,
      page,
      price_change_percentage: "24h",
    };
    
    const headers = process.env.COINGECKO_API_KEY 
      ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } 
      : {};

    while (keepFetching) {
      try {
        const resp = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
          params,
          headers
        });

        if (resp.data.length === 0) {
          keepFetching = false;
          break;
        }

        allTokens.push(...resp.data);
        console.log(`📥 Downloaded page ${page} (${resp.data.length} tokens)`);

        page++;
        params.page = page;
        await sleep(500); // be nice to their API
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
        
        // If we hit a rate limit, stop fetching
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          console.warn("⚠️ Hit CoinGecko rate limit, stopping fetch");
          keepFetching = false;
        } else {
          // For other errors, wait longer and try again
          await sleep(2000);
        }
      }
    }

    coinGeckoMapping = {};

    // Process the tokens and build the detailed mapping
    for (const token of allTokens) {
      const platforms = token.platforms;
      if (platforms?.solana) {
        const mint = platforms.solana.toLowerCase();
        coinGeckoMapping[mint] = {
          id: token.id,
          price: token.current_price || 0,
          priceChange24h: token.price_change_percentage_24h || 0,
          lastUpdated: Date.now(),
        };
        
        // Try to fetch some historical data for important tokens
        if (token.market_cap_rank <= 300) {
          try {
            // Fetch 30 days of history for important tokens (in a background process to avoid blocking)
            setTimeout(async () => {
              try {
                await fetchHistoricalDataForToken(mint, token.id);
              } catch (err) {
                console.warn(`⚠️ Failed to fetch historical data for ${token.id}:`, err);
              }
            }, 0);
          } catch (err) {
            // Ignore errors in background fetch
          }
        }
      }
    }

    await fs.writeFile(CACHE_FILE, JSON.stringify(coinGeckoMapping, null, 2));
    console.log(`✅ Finished downloading and cached ${Object.keys(coinGeckoMapping).length} tokens with price data`);

  } catch (err) {
    console.error("❌ Failed to load CoinGecko mapping:", err);
  }
}

/**
 * Fetch historical price data for a token
 */
async function fetchHistoricalDataForToken(mint: string, geckoId: string) {
  try {
    const headers = process.env.COINGECKO_API_KEY 
      ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } 
      : {};
      
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      },
      headers
    });
    
    if (response.data?.prices && Array.isArray(response.data.prices)) {
      const historicalData = response.data.prices.map((item: [number, number]) => ({
        timestamp: item[0],
        price: item[1]
      }));
      
      // Add historical data to mapping
      if (coinGeckoMapping[mint]) {
        coinGeckoMapping[mint].historical = historicalData;
      }
      
      console.log(`✅ Added historical data for ${geckoId}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to fetch historical data for ${geckoId}:`, error);
  }
}

/**
 * Update current prices for tokens in the mapping
 */
export async function updateCurrentPrices() {
  const coinIds = Object.values(coinGeckoMapping).map(item => item.id).join(',');
  
  if (!coinIds) return;
  
  try {
    const headers = process.env.COINGECKO_API_KEY 
      ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } 
      : {};
      
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: coinIds,
        vs_currencies: 'usd',
        include_24hr_change: true
      },
      headers
    });
    
    if (response.data) {
      for (const [mint, data] of Object.entries(coinGeckoMapping)) {
        const geckoId = data.id;
        if (response.data[geckoId]) {
          coinGeckoMapping[mint].price = response.data[geckoId].usd || 0;
          coinGeckoMapping[mint].priceChange24h = response.data[geckoId].usd_24h_change || 0;
          coinGeckoMapping[mint].lastUpdated = Date.now();
        }
      }
      
      console.log(`✅ Updated prices for ${Object.keys(response.data).length} tokens`);
      
      // Update cache file with new prices
      await fs.writeFile(CACHE_FILE, JSON.stringify(coinGeckoMapping, null, 2));
    }
  } catch (error) {
    console.error("❌ Failed to update token prices:", error);
  }
}
