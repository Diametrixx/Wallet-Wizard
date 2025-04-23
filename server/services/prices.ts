import axios from "axios";

// Use CoinGecko Pro API with key
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";
const COINGECKO_API_URL = "https://pro-api.coingecko.com/api/v3";

// Log if API key is available
console.log(`Price service initialized with CoinGecko API key: ${COINGECKO_API_KEY ? "Available" : "Missing"}`);

// Check if the environment variable is defined
if (!COINGECKO_API_KEY) {
  console.warn("WARNING: COINGECKO_API_KEY is not set. Price data will not be available.");
}

// Common token symbol to CoinGecko ID mapping
const TOKEN_ID_MAP: Record<string, string> = {
  // Ethereum ecosystem
  'eth': 'ethereum',
  'weth': 'weth',
  'usdt': 'tether',
  'usdc': 'usd-coin',
  'dai': 'dai',
  'link': 'chainlink',
  'uni': 'uniswap',
  'aave': 'aave',
  'matic': 'matic-network',
  'shib': 'shiba-inu',
  'comp': 'compound-governance-token',
  'mkr': 'maker',
  'snx': 'synthetix-network-token',
  
  // Solana ecosystem
  'sol': 'solana',
  'ray': 'raydium',
  'srm': 'serum',
  'ftt': 'ftx-token',
  'orca': 'orca',
  'mngo': 'mango-markets',
  'atlas': 'star-atlas',
  'polis': 'star-atlas-dao',
  'samo': 'samoyedcoin',
  'bonk': 'bonk',
  'msol': 'marinade-staked-sol',
};

type PriceData = {
  [symbol: string]: {
    usd: number;
    usd_24h_change?: number;
  };
};

/**
 * Maps a token symbol to CoinGecko ID
 */
function mapSymbolToId(symbol: string): string {
  const lowerSymbol = symbol.toLowerCase();
  return TOKEN_ID_MAP[lowerSymbol] || lowerSymbol;
}

/**
 * Gets current price data for a list of tokens
 * @param symbols Array of token symbols
 * @param days Number of days for historical data (default: 1)
 * @returns Price data for each token
 */
export async function getPriceData(symbols: string[], days = 1): Promise<PriceData> {
  try {
    // Filter out unknown tokens and limit to known tokens only
    const filteredSymbols = symbols.filter(symbol => 
      symbol.toLowerCase() !== "unknown" && 
      TOKEN_ID_MAP[symbol.toLowerCase()] !== undefined
    );
    
    // If no valid symbols, return empty result
    if (filteredSymbols.length === 0) {
      console.log("No recognized token symbols to fetch prices for");
      return symbols.reduce((acc, symbol) => {
        acc[symbol.toLowerCase()] = { usd: 0 };
        return acc;
      }, {} as PriceData);
    }
    
    // Limit to 10 tokens maximum to avoid API limits
    const limitedSymbols = filteredSymbols.slice(0, 10);
    
    // Map symbols to CoinGecko IDs
    const mappedIds = limitedSymbols.map(mapSymbolToId);
    const ids = mappedIds.join(",");
    
    console.log(`Fetching price data for tokens: ${limitedSymbols.join(', ')}`);
    
    // Call CoinGecko API with API key
    const url = `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${COINGECKO_API_KEY}`;
    console.log(`CoinGecko API URL: ${url.split('&x_cg_pro_api_key=')[0]}...`); // Log URL without API key
    
    const response = await axios.get(url);
    
    // Map the response back to the original symbols
    const result: PriceData = {};
    
    // First, initialize all symbols with default values
    symbols.forEach(symbol => {
      result[symbol.toLowerCase()] = { usd: 0 };
    });
    
    // Then update the ones that we have data for
    limitedSymbols.forEach((symbol, index) => {
      const id = mappedIds[index];
      if (response.data[id]) {
        result[symbol.toLowerCase()] = response.data[id];
        console.log(`Price data for ${symbol}: $${response.data[id].usd}`);
      }
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching price data:", error);
    
    // Return empty data with 0 values to prevent errors
    return symbols.reduce((acc, symbol) => {
      acc[symbol.toLowerCase()] = { usd: 0 };
      return acc;
    }, {} as PriceData);
  }
}

/**
 * Gets historical price data for a token
 * @param symbol Token symbol
 * @param days Number of days of history
 * @returns Historical price data
 */
export async function getPriceHistory(symbol: string, days = 30) {
  try {
    // Map symbol to CoinGecko ID
    const coinId = mapSymbolToId(symbol);
    
    console.log(`Fetching price history for token: ${symbol} (CoinGecko ID: ${coinId})`);
    
    // Call CoinGecko API for market chart with API key
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&x_cg_pro_api_key=${COINGECKO_API_KEY}`;
    console.log(`CoinGecko API URL: ${url.split('&x_cg_pro_api_key=')[0]}...`); // Log URL without API key
    
    const response = await axios.get(url);
    
    // Format the data
    return response.data.prices.map((pricePoint: [number, number]) => ({
      timestamp: pricePoint[0],
      price: pricePoint[1],
    }));
  } catch (error) {
    console.error(`Error fetching price history for ${symbol}:`, error);
    
    // Return mock data for UI testing if needed
    return [];
  }
}
