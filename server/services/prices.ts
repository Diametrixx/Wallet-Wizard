import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

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
    // Map symbols to CoinGecko IDs
    const mappedIds = symbols.map(mapSymbolToId);
    const ids = mappedIds.join(",");
    
    console.log(`Fetching price data for tokens: ${symbols.join(', ')}`);
    
    // Call CoinGecko API
    const url = `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    console.log(`CoinGecko API URL: ${url}`);
    
    const response = await axios.get(url);
    
    // Map the response back to the original symbols
    const result: PriceData = {};
    symbols.forEach((symbol, index) => {
      const id = mappedIds[index];
      if (response.data[id]) {
        result[symbol.toLowerCase()] = response.data[id];
      } else {
        // If no price data, provide default values
        result[symbol.toLowerCase()] = { usd: 0 };
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
    
    // Call CoinGecko API for market chart
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    console.log(`CoinGecko API URL: ${url}`);
    
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
