import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

type PriceData = {
  [symbol: string]: {
    usd: number;
    usd_24h_change?: number;
  };
};

/**
 * Gets current price data for a list of tokens
 * @param symbols Array of token symbols
 * @param days Number of days for historical data (default: 1)
 * @returns Price data for each token
 */
export async function getPriceData(symbols: string[], days = 1): Promise<PriceData> {
  try {
    // Convert symbols to coingecko IDs - in a real app we'd have a mapping table
    // but for this demo we'll just use the symbols as IDs
    const ids = symbols.join(",");
    
    // Call CoinGecko API
    const url = `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching price data:", error);
    
    // Return empty data with 0 values to prevent errors
    return symbols.reduce((acc, symbol) => {
      acc[symbol] = { usd: 0 };
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
    // Call CoinGecko API for market chart
    const url = `${COINGECKO_API_URL}/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`;
    const response = await axios.get(url);
    
    // Format the data
    return response.data.prices.map((pricePoint: [number, number]) => ({
      timestamp: pricePoint[0],
      price: pricePoint[1],
    }));
  } catch (error) {
    console.error("Error fetching price history:", error);
    return [];
  }
}
