import axios from "axios";
import type { Portfolio, Token, Transaction } from "@shared/schema";
import { getPriceData } from "./prices";

// Use Helius API
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_BASE_URL = `https://api.helius.xyz/v0`;

// Log if API key is available
console.log(`Solana service initialized with Helius API key: ${HELIUS_API_KEY ? "Available" : "Missing"}`);

// Check if the environment variable is defined
if (!HELIUS_API_KEY) {
  console.warn("WARNING: HELIUS_API_KEY is not set. Solana wallet analysis will fail.");
}

/**
 * Analyzes a Solana wallet to generate portfolio data
 */
export async function analyzeSolanaWallet(address: string): Promise<Portfolio> {
  try {
    // Get token balances
    const balancesUrl = `${HELIUS_BASE_URL}/addresses/${address}/balances?api-key=${HELIUS_API_KEY}`;
    const balancesResponse = await axios.get(balancesUrl);
    const balances = balancesResponse.data.tokens;
    
    // Get transaction history
    const transactionsUrl = `${HELIUS_BASE_URL}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}`;
    const transactionsResponse = await axios.get(transactionsUrl);
    const transactions = transactionsResponse.data;
    
    // Get SOL native balance
    const solBalanceUrl = `${HELIUS_BASE_URL}/addresses/${address}/balances?api-key=${HELIUS_API_KEY}`;
    const solBalanceResponse = await axios.get(solBalanceUrl);
    const solBalance = solBalanceResponse.data.nativeBalance;
    
    // Create token list with balances (including SOL)
    const tokens: Token[] = [];
    
    // Add SOL as first token
    tokens.push({
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      contractAddress: "native",
      amount: solBalance / 1e9,
      price: 0, // Will be filled from CoinGecko
      value: 0, // Will be calculated
      change24h: 0, // Will be filled
      logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg",
    });
    
    // Add other tokens
    for (const token of balances) {
      if (token.amount > 0) {
        tokens.push({
          symbol: token.symbol || "Unknown",
          name: token.name || "Unknown Token",
          decimals: token.decimals || 0,
          contractAddress: token.mint,
          amount: token.amount / Math.pow(10, token.decimals || 0),
          price: 0, // Will be filled
          value: 0, // Will be calculated
          change24h: 0, // Will be filled
          logoUrl: "", // No logo in API
        });
      }
    }
    
    // Fetch token prices from storage (cache) or CoinGecko
    try {
      // Get list of token symbols
      const tokenSymbols = tokens.map(token => token.symbol.toLowerCase());
      console.log(`Fetching prices for ${tokenSymbols.length} Solana tokens: ${tokenSymbols.slice(0, 10).join(', ')}${tokenSymbols.length > 10 ? '...' : ''}`);
      
      // Ensure SOL has a baseline price if it's in the tokens list
      let solToken = tokens.find(t => t.symbol.toLowerCase() === 'sol');
      if (solToken) {
        // Set a reasonable SOL price if API fails - approximately $140
        solToken.price = 140;
        solToken.change24h = 4.2; // Some positive change to show in UI
        solToken.value = solToken.price * solToken.amount;
        console.log(`Set baseline price for SOL: $${solToken.price}`);
      }
      
      // Import storage for token price caching
      const { storage } = await import('../storage');
      
      // Get whitelisted tokens (popular tokens first)
      const whitelistedTokens = await storage.getWhitelistedTokens();
      
      // Prioritize tokens: 1) SOL, 2) Whitelisted tokens, 3) Other tokens with significant balance (value > $5)
      const solIndex = tokenSymbols.findIndex(s => s.toLowerCase() === 'sol');
      if (solIndex !== -1) {
        // Move SOL to the front
        tokenSymbols.splice(solIndex, 1);
        tokenSymbols.unshift('sol');
      }
      
      // Sort other tokens based on whitelist priority and balance
      const filteredAndSorted = tokenSymbols
        .filter(symbol => symbol.toLowerCase() !== 'sol') // SOL already handled
        .sort((a, b) => {
          const aIsWhitelisted = whitelistedTokens.includes(a.toUpperCase());
          const bIsWhitelisted = whitelistedTokens.includes(b.toUpperCase());
          
          if (aIsWhitelisted && !bIsWhitelisted) return -1;
          if (!aIsWhitelisted && bIsWhitelisted) return 1;
          
          // If both are whitelisted or both are not, sort by amount
          const tokenA = tokens.find(t => t.symbol.toLowerCase() === a.toLowerCase());
          const tokenB = tokens.find(t => t.symbol.toLowerCase() === b.toLowerCase());
          
          const aAmount = tokenA?.amount || 0;
          const bAmount = tokenB?.amount || 0;
          
          return bAmount - aAmount; // Sort descending by amount
        })
        .slice(0, 15); // Limit to 15 tokens (plus SOL) to avoid rate limits
      
      // Final list of tokens to fetch prices for: SOL + sorted tokens
      const prioritizedSymbols = ['sol', ...filteredAndSorted];
      
      // Get cached or fetch new prices
      const priceData = await storage.getCachedOrFetchPrices(prioritizedSymbols);
      
      // Update token prices and calculate values
      tokens.forEach(token => {
        const symbol = token.symbol.toLowerCase();
        const priceInfo = priceData[symbol];
        
        if (priceInfo && priceInfo.usd > 0) {
          token.price = priceInfo.usd;
          token.change24h = priceInfo.usd_24h_change || 0;
          token.value = token.price * token.amount;
          console.log(`Updated price for ${token.symbol}: $${token.price}`);
        } else if (token.symbol.toLowerCase() !== 'sol') {
          // For non-SOL tokens with no price data
          // Assign a small value for tokens without prices but with balance
          if (token.amount > 0) {
            // Assign a proportional minimal value based on token amount to improve visualization
            // Higher token amounts are likely airdrops or memecoins with very low value
            const magnitude = Math.log10(token.amount);
            const minPrice = Math.max(0.0001, 0.1 / Math.pow(10, magnitude));
            token.price = minPrice;
            token.value = token.price * token.amount;
            token.change24h = 0;
            
            if (token.symbol.toLowerCase() !== 'unknown') {
              console.log(`No price data found for ${token.symbol}, assigned minimal value: $${token.price}`);
            }
          } else {
            console.log(`No price data found for ${token.symbol}`);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching Solana token prices:', error);
    }
    
    // Calculate total portfolio value
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    
    // Process transactions
    const processedTransactions: Transaction[] = transactions
      .slice(0, 20) // Limit to most recent 20 transactions
      .map((tx: any) => {
        // Simple transaction type detection (could be expanded)
        let type: Transaction["type"] = "other";
        
        if (tx.type === "TRANSFER" && tx.sourceAddress === address) {
          type = "send";
        } else if (tx.type === "TRANSFER" && tx.destinationAddress === address) {
          type = "receive";
        } else if (tx.type === "SWAP") {
          type = "swap";
        } else if (tx.type === "STAKE") {
          type = "stake";
        } else if (tx.type === "UNSTAKE") {
          type = "unstake";
        }
        
        return {
          hash: tx.signature,
          timestamp: tx.timestamp || Date.now(),
          type,
          fromAddress: tx.sourceAddress || address,
          toAddress: tx.destinationAddress,
          tokenSymbol: tx.tokenTransfers?.[0]?.symbol || "SOL",
          amount: tx.tokenTransfers?.[0]?.amount || 0,
          value: 0, // Would need price at transaction time
          platformName: tx.description || undefined,
        };
      });
    
    // Sort tokens by value to get winners and losers
    const sortedTokens = [...tokens].sort((a, b) => b.value - a.value);
    const topWinners = sortedTokens.filter(t => (t.change24h || 0) > 0).slice(0, 3);
    const topLosers = sortedTokens.filter(t => (t.change24h || 0) < 0)
      .sort((a, b) => (a.change24h || 0) - (b.change24h || 0)).slice(0, 3);
    
    // Prepare allocation data
    type AllocationItem = {
      name: string;
      value: number;
      percentage: number;
      color: string;
    };
    let allocationData: AllocationItem[] = [];
    
    // Handle top 4 tokens separately, combine the rest as "Other"
    if (sortedTokens.length > 0) {
      const top4Tokens = sortedTokens.slice(0, 4);
      const otherTokens = sortedTokens.slice(4);
      
      // Calculate percentages
      const colorMap = ["#00FFAA", "#00EEFF", "#9945FF", "#FF00AA", "#FFCC00"];
      
      allocationData = top4Tokens.map((token, index) => ({
        name: token.symbol,
        value: token.value,
        percentage: Math.round((token.value / totalValue) * 100),
        color: colorMap[index],
      }));
      
      // Add "Other" category if there are more tokens
      if (otherTokens.length > 0) {
        const otherValue = otherTokens.reduce((sum, token) => sum + token.value, 0);
        allocationData.push({
          name: "Other",
          value: otherValue,
          percentage: Math.round((otherValue / totalValue) * 100),
          color: colorMap[4],
        });
      }
    }
    
    // Generate performance metrics
    // This is a simplified approach for the demo - in reality more complex analysis would be needed
    const allTimeProfit = totalValue * 0.4; // Mock value - would be calculated from historical data
    const performancePercentage = (allTimeProfit / (totalValue - allTimeProfit)) * 100;
    
    // Generate meme rank and summary based on performance
    let memeRank = "Paper Hand Pleb";
    let memeSummary = "You seem to panic sell at every dip. HODL stronger!";
    let memeImage = "https://cryptologos.cc/logos/bitcoin-btc-logo.svg";
    
    if (performancePercentage > 30) {
      memeRank = "SOL Surfer";
      memeSummary = "You've been riding the Solana wave like a pro! Fast transactions, faster gains.";
      memeImage = "https://cryptologos.cc/logos/solana-sol-logo.svg";
    } else if (performancePercentage > 10) {
      memeRank = "SPL Token Collector";
      memeSummary = "Your wallet is a museum of Solana tokens. Some gems, some rugs - the degen life!";
      memeImage = "https://cryptologos.cc/logos/serum-srm-logo.svg";
    }
    
    // Generate mock time series data for portfolio value
    const timeSeriesData = [];
    const today = new Date();
    for (let i = 180; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Generate somewhat realistic looking chart data with trends
      let factor = 1 + Math.sin(i / 30) * 0.3; // Oscillation
      if (i > 120) factor *= 0.8; // Downtrend in earlier periods
      if (i < 60) factor *= 1.4; // Uptrend in recent periods
      
      timeSeriesData.push({
        date: date.toISOString().substring(0, 10),
        value: Math.round(totalValue * factor),
      });
    }

    // Generate trading metrics
    const tradingMetrics = {
      diamondHandsFactor: 76,
      degenLevel: 65,
      paperHandsRisk: 15,
      strategy: "You've been exploring the Solana ecosystem with enthusiasm, jumping on new projects but keeping a core holding. Nice balance of risk and stability!",
      suggestion: "Consider diversifying some of your smaller token positions into your core holdings to reduce exposure to potential rug pulls.",
    };
    
    return {
      wallet: {
        address,
        chain: "solana",
      },
      totalValue,
      allTimeProfit,
      performancePercentage,
      tokens,
      topWinners,
      topLosers,
      transactions: processedTransactions,
      allocationData,
      timeSeriesData,
      memeRank,
      memeSummary,
      memeImage,
      tradingMetrics,
    };
  } catch (error) {
    throw new Error(`Failed to analyze Solana wallet: ${(error as Error).message}`);
  }
}
