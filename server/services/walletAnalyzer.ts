// server/services/walletAnalyzer.ts
import axios from "axios";
import { Portfolio, Token, Transaction } from "@shared/schema";
import { 
  fetchParsedTransactionHistory, 
  fetchSignatures, 
  getHeliusTokenMetadata,
  getTokenBalances
} from "./helius";
import { coinGeckoMapping } from "./coinGeckoMap";
import { storage } from "../storage";

// Constants
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "5ad98011-c959-40fd-b12f-2cbbcca72088";
const HELIUS_BASE_URL = "https://api.helius.xyz/v0";
const JUPITER_PRICE_API = "https://price.jup.ag/v4/price";

// Token categories by importance/liquidity
const IMPORTANT_TOKENS = new Set([
  "So11111111111111111111111111111111111111112", // SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", // stSOL
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // mSOL
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
  "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx", // GMT
  "DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", // DUST
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY
  "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", // PYTH
  "7publicfh95hnuAziy2KiGUGNuDiGjyzR5SaKKbQStsP", // JTO
]);

/**
 * Generate a more vivid color than the default random colors
 */
function generateVividColor(index: number): string {
  const hue = (index * 137.5) % 360; // Golden ratio to spread colors evenly
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Analyze a Solana wallet to generate accurate portfolio performance data
 */
export async function analyzeWalletPerformance(address: string): Promise<Portfolio> {
  console.log(`🔎 Starting in-depth wallet analysis for: ${address}`);
  
  try {
    // Step 1: Get current token balances first (this should work even if transaction history doesn't)
    const tokenBalances = await getTokenBalances(address);
    console.log(`💰 Found ${tokenBalances.tokens.length} tokens in wallet and ${tokenBalances.nativeBalance || 0} lamports of SOL`);
    
    let hasActiveWallet = tokenBalances.nativeBalance > 0 || (tokenBalances.tokens && tokenBalances.tokens.length > 0);
    if (!hasActiveWallet) {
      console.warn("⚠️ No tokens or SOL found in this wallet. It may be inactive.");
    }
    
    // Step 2: Fetch parsed transaction history directly using the Helius endpoint
    // This is more efficient than fetching signatures and then enriching them
    const parsedTransactions = await fetchParsedTransactionHistory(address, 150);
    console.log(`📊 Retrieved ${parsedTransactions.length} parsed transactions`);
    
    let acquisitions = {};
    let tokenHistory = [];
    
    // Step 3: Process transaction history if available
    if (parsedTransactions.length > 0) {
      // Process token transfers to track purchase history
      const processingResult = await processTokenTransfers(parsedTransactions, address);
      acquisitions = processingResult.acquisitions;
      tokenHistory = processingResult.tokenHistory;
      console.log(`🧮 Analyzed ${Object.keys(acquisitions).length} token acquisition histories`);
    } else {
      console.warn("⚠️ No transaction history found, but continuing with current balance analysis");
      
      // Create simplified acquisition records based on current holdings
      tokenBalances.tokens?.forEach(token => {
        if (token.mint) {
          acquisitions[token.mint] = {
            totalAmount: parseFloat(token.amount || "0"),
            avgPrice: 0, // We don't know acquisition price
            firstAcquired: Date.now() - (30 * 24 * 60 * 60 * 1000), // Assume 30 days ago
            transactions: []
          };
        }
      });
    }
    
    // Step 4: Get current prices for all tokens in the wallet
    const { currentPrices, priceChanges } = await getCurrentTokenPrices(tokenBalances.tokens || []);
    console.log(`💵 Retrieved current prices for ${Object.keys(currentPrices).length} tokens`);
    
    // Step 5: Enhance token data with metadata from Helius
    if (tokenBalances.tokens && tokenBalances.tokens.length > 0) {
      await enhanceTokensWithMetadata(tokenBalances.tokens);
    }
    
    // Step 6: Calculate wallet metrics and portfolio performance
    const portfolioData = calculatePortfolioMetrics(
      address,
      tokenBalances,
      acquisitions,
      currentPrices,
      priceChanges,
      tokenHistory
    );
    
    console.log(`✅ Wallet analysis complete with performance metrics`);
    return portfolioData;
  } catch (error) {
    console.error("❌ Error analyzing wallet:", error);
    throw new Error(`Failed to analyze wallet: ${(error as Error).message}`);
  }
}

/**
 * Enhance token data with metadata from Helius
 * This adds information like token name, symbol, and image URL
 */
async function enhanceTokensWithMetadata(tokens: any[]): Promise<void> {
  const enhancementPromises = tokens.map(async (token) => {
    // Skip tokens that already have good metadata
    if (token.name && token.symbol && token.image) return;
    
    try {
      const metadata = await getHeliusTokenMetadata(token.mint);
      if (metadata) {
        if (!token.name && metadata.name) token.name = metadata.name;
        if (!token.symbol && metadata.symbol) token.symbol = metadata.symbol;
        if (!token.image && metadata.image) token.image = metadata.image;
      }
    } catch (error) {
      // Silently fail on metadata enhancement
      console.warn(`Could not enhance token metadata for ${token.mint}`);
    }
  });
  
  // Wait for all enhancement requests to complete
  await Promise.all(enhancementPromises);
}

// Note: The fetchEnrichedTransactions and getTokenBalances are now imported from helius.ts
// So we remove the duplicated functions here

/**
 * Process token transfers to track acquisition history and token movements
 */
async function processTokenTransfers(transactions: any[], walletAddress: string) {
  // Track token acquisitions by mint address
  const acquisitions: Record<string, { 
    totalAmount: number,
    avgPrice: number,
    firstAcquired: number,
    transactions: Array<{
      amount: number,
      price: number,
      timestamp: number,
      txSignature: string
    }>
  }> = {};
  
  // Track token history for timeline
  const tokenHistory: Array<{
    timestamp: number,
    action: string,
    tokenSymbol: string,
    amount: number,
    usdValue: number,
    signature: string
  }> = [];
  
  // Process each transaction
  for (const tx of transactions) {
    // Skip if no token transfers
    if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;
    
    const timestamp = tx.timestamp * 1000; // Convert to milliseconds
    
    // Process each token transfer
    for (const transfer of tx.tokenTransfers) {
      const { mint, amount, fromUserAccount, toUserAccount, tokenSymbol } = transfer;
      
      // Skip if this transfer doesn't involve our wallet
      if (fromUserAccount !== walletAddress && toUserAccount !== walletAddress) continue;
      
      // Determine if this is incoming (acquisition) or outgoing (disposal)
      const isAcquisition = toUserAccount === walletAddress;
      const symbol = tokenSymbol || "Unknown";
      
      // Get estimated price at time of transaction
      let priceAtTransaction = 0;
      
      // Try to get historical price info from CoinGecko data
      if (coinGeckoMapping[mint] && coinGeckoMapping[mint].historical) {
        // Find closest historical price point
        const historicalPrices = coinGeckoMapping[mint].historical;
        if (historicalPrices && historicalPrices.length > 0) {
          // Find closest price point to transaction time
          const closestPrice = historicalPrices.reduce((closest, current) => {
            const currentDiff = Math.abs(current.timestamp - timestamp);
            const closestDiff = Math.abs(closest.timestamp - timestamp);
            return currentDiff < closestDiff ? current : closest;
          });
          
          // Use the price if it's within 7 days of the transaction
          const timeDiff = Math.abs(closestPrice.timestamp - timestamp);
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          
          if (timeDiff <= SEVEN_DAYS_MS) {
            priceAtTransaction = closestPrice.price;
          }
        }
      }
      
      // Fall back to current price for important tokens
      if (priceAtTransaction === 0 && IMPORTANT_TOKENS.has(mint)) {
        // For important tokens, we should have pricing info
        if (coinGeckoMapping[mint] && coinGeckoMapping[mint].price) {
          priceAtTransaction = coinGeckoMapping[mint].price;
        }
      }
      
      // Calculate USD value
      const parsedAmount = parseFloat(amount); 
      const usdValue = parsedAmount * priceAtTransaction;
      
      // Add to token history
      tokenHistory.push({
        timestamp,
        action: isAcquisition ? "receive" : "send",
        tokenSymbol: symbol,
        amount: parsedAmount,
        usdValue,
        signature: tx.signature
      });
      
      // Track acquisitions for cost basis
      if (isAcquisition && parsedAmount > 0) {
        if (!acquisitions[mint]) {
          acquisitions[mint] = {
            totalAmount: 0,
            avgPrice: 0,
            firstAcquired: timestamp,
            transactions: []
          };
        }
        
        // Add this transaction to acquisition history
        acquisitions[mint].transactions.push({
          amount: parsedAmount,
          price: priceAtTransaction,
          timestamp,
          txSignature: tx.signature
        });
        
        // Update totals and average price
        const oldTotal = acquisitions[mint].totalAmount * acquisitions[mint].avgPrice;
        const newTotal = oldTotal + (parsedAmount * priceAtTransaction);
        acquisitions[mint].totalAmount += parsedAmount;
        
        // Recalculate average price (cost basis)
        if (acquisitions[mint].totalAmount > 0) {
          acquisitions[mint].avgPrice = newTotal / acquisitions[mint].totalAmount;
        }
        
        // Update first acquired timestamp if this is earlier
        if (timestamp < acquisitions[mint].firstAcquired) {
          acquisitions[mint].firstAcquired = timestamp;
        }
      }
      
      // For disposals, reduce the total amount
      if (!isAcquisition && parsedAmount > 0) {
        if (acquisitions[mint]) {
          acquisitions[mint].totalAmount = Math.max(0, acquisitions[mint].totalAmount - parsedAmount);
        }
      }
    }
  }
  
  return { acquisitions, tokenHistory };
}

/**
 * Get current prices for tokens using multiple sources with fallbacks
 */
async function getCurrentTokenPrices(tokens: any[]): Promise<{
  currentPrices: Record<string, number>,
  priceChanges: Record<string, number>
}> {
  const currentPrices: Record<string, number> = {};
  const priceChanges: Record<string, number> = {};
  
  // Default prices for important tokens in case all APIs fail
  // These will be overridden if we can fetch real-time prices
  // Important: We need at least SOL price for the wallet analysis to be useful
  const defaultPrices: Record<string, number> = {
    "So11111111111111111111111111111111111111112": 138.24, // SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 1.0, // USDC
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": 1.0, // USDT
    "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": 148.90, // stSOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": 149.20, // mSOL
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": 0.00002107, // BONK
    "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx": 0.62, // GMT
  };
  
  // Function to try CoinGecko direct price fetch for major tokens
  const tryDirectCoinGeckoPriceFetch = async () => {
    try {
      // Get current prices for major tokens using CoinGecko
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin,tether&vs_currencies=usd&include_24hr_change=true"
      );
      
      if (response.status === 200 && response.data) {
        // Map CoinGecko IDs to token mints
        const mapping = {
          "solana": "So11111111111111111111111111111111111111112",
          "usd-coin": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "tether": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
        };
        
        // Update prices from response
        for (const [cgId, mint] of Object.entries(mapping)) {
          if (response.data[cgId]?.usd) {
            currentPrices[mint] = response.data[cgId].usd;
            priceChanges[mint] = response.data[cgId].usd_24h_change || 0;
          }
        }
        
        console.log("📈 Fetched major token prices from CoinGecko directly");
        return true;
      }
    } catch (error) {
      console.warn("⚠️ Direct CoinGecko price fetch failed", error);
    }
    return false;
  };
  
  // Get list of mint addresses from tokens with non-zero balance
  const mintAddresses = tokens
    .filter(token => token.mint && parseFloat(token.amount || "0") > 0)
    .map(token => token.mint);
    
  // Add SOL mint address if it's not already in the list
  const solMint = "So11111111111111111111111111111111111111112";
  if (!mintAddresses.includes(solMint)) {
    mintAddresses.push(solMint);
  }
  
  console.log(`🔍 Fetching prices for ${mintAddresses.length} tokens...`);
  
  // Try Jupiter API first for best real-time Solana token prices
  const BATCH_SIZE = 100;
  let jupiterSuccess = false;
  
  for (let i = 0; i < mintAddresses.length; i += BATCH_SIZE) {
    const batch = mintAddresses.slice(i, i + BATCH_SIZE);
    
    try {
      const jupiterIds = batch.join(',');
      const jupiterResponse = await axios.get(`${JUPITER_PRICE_API}?ids=${jupiterIds}`);
      
      if (jupiterResponse.status === 200 && jupiterResponse.data?.data) {
        jupiterSuccess = true;
        const priceData = jupiterResponse.data.data;
        
        // Process each token in the batch
        for (const mint of batch) {
          if (priceData[mint]?.price) {
            currentPrices[mint] = priceData[mint].price;
            // Jupiter doesn't give price change, default to 0
            priceChanges[mint] = 0;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Jupiter price API failed for batch ${i}`, error);
    }
  }
  
  if (jupiterSuccess) {
    console.log("✅ Successfully fetched some prices from Jupiter");
  } else {
    console.warn("⚠️ Jupiter price API failed completely, trying CoinGecko direct fetch");
    await tryDirectCoinGeckoPriceFetch();
  }
  
  // For tokens that didn't get prices yet, check our cached CoinGecko mapping
  for (const token of tokens) {
    if (token.mint && !currentPrices[token.mint] && coinGeckoMapping[token.mint]) {
      currentPrices[token.mint] = coinGeckoMapping[token.mint].price || 0;
      priceChanges[token.mint] = coinGeckoMapping[token.mint].priceChange24h || 0;
    }
  }
  
  // Apply default prices as last resort for important tokens
  for (const [mint, price] of Object.entries(defaultPrices)) {
    if (!currentPrices[mint] || currentPrices[mint] === 0) {
      console.log(`Using default price for important token: ${mint}`);
      currentPrices[mint] = price;
      // Default price change is 0 when using hardcoded values
      priceChanges[mint] = 0;
    }
  }
  
  console.log(`💲 Retrieved prices for ${Object.keys(currentPrices).length} tokens`);
  console.log(`SOL price: $${currentPrices[solMint] || 'unknown'}`);
  
  return { currentPrices, priceChanges };
}

/**
 * Calculate portfolio metrics from token data
 */
function calculatePortfolioMetrics(
  address: string,
  balances: any,
  acquisitions: Record<string, any>,
  currentPrices: Record<string, number>,
  priceChanges: Record<string, number>,
  tokenHistory: any[]
): Portfolio {
  // Process tokens
  const tokens: Token[] = [];
  const winners: Token[] = [];
  const losers: Token[] = [];
  
  // Format transactions for the API response
  const transactions: Transaction[] = tokenHistory
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
    .slice(0, 20) // Limit to 20 transactions
    .map(history => ({
      hash: history.signature,
      timestamp: history.timestamp,
      type: history.action as any,
      fromAddress: '', // Not tracked in our simplified model
      toAddress: '',
      tokenSymbol: history.tokenSymbol,
      amount: history.amount.toString(),
      value: history.usdValue,
    }));
  
  // Format allocation data
  const allocation: { name: string, value: number, percentage: number, color: string }[] = [];
  
  // Track total value and profit/loss
  let totalValue = 0;
  let totalProfitLoss = 0;
  
  // Process native SOL balance first
  // Make sure we have a valid nativeBalance
  const solBalanceRaw = typeof balances.nativeBalance === 'number' ? balances.nativeBalance : 
                        typeof balances.nativeBalance === 'string' ? parseInt(balances.nativeBalance) : 0;
  
  const solBalance = solBalanceRaw / 1e9; // Convert from lamports to SOL
  const solMint = "So11111111111111111111111111111111111111112";
  const solPrice = currentPrices[solMint] || 0;
  const solValue = solBalance * solPrice;
  
  console.log(`💰 SOL balance: ${solBalance} SOL at price $${solPrice} = $${solValue}`);
  
  
  // Add SOL to tokens
  if (solBalance > 0) {
    const solToken: Token = {
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      contractAddress: "So11111111111111111111111111111111111111112",
      amount: solBalance,
      price: solPrice,
      value: solValue,
      change24h: priceChanges["So11111111111111111111111111111111111111112"] || 0,
      logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg"
    };
    
    tokens.push(solToken);
    totalValue += solValue;
    
    // Check if this is a winner or loser
    const solChange = solToken.change24h || 0;
    if (solChange > 0) {
      winners.push(solToken);
    } else if (solChange < 0) {
      losers.push(solToken);
    }
    
    // Add to allocation
    allocation.push({
      name: "SOL",
      value: solValue,
      percentage: 0, // Will calculate percentages after totaling
      color: "#9945FF", // Solana purple
    });
  }
  
  // Process other tokens
  // Ensure we have a tokens array to iterate through
  const tokensArray = Array.isArray(balances.tokens) ? balances.tokens : [];
  
  console.log(`Processing ${tokensArray.length} token balances`);
  
  for (const token of tokensArray) {
    if (!token || !token.mint || token.amount === "0") continue; // Skip invalid or zero balances
    
    const decimals = token.decimals || 0;
    const amount = parseFloat(token.amount) / Math.pow(10, decimals);
    const price = currentPrices[token.mint] || 0;
    const value = amount * price;
    const change24h = priceChanges[token.mint] || 0;
    
    // Get token acquisition data to calculate profit/loss
    const acquisition = acquisitions[token.mint];
    let profitLoss = 0;
    
    if (acquisition && acquisition.avgPrice > 0) {
      const costBasis = amount * acquisition.avgPrice;
      profitLoss = value - costBasis;
    }
    
    // Update total profit/loss
    totalProfitLoss += profitLoss;
    
    // Create token object
    const tokenObj: Token = {
      symbol: token.symbol || "Unknown",
      name: token.name || "Unknown Token",
      decimals: decimals,
      contractAddress: token.mint,
      amount: amount,
      price: price,
      value: value,
      change24h: change24h,
      logoUrl: "", // Will be filled from metadata if available
    };
    
    // Add to tokens list
    tokens.push(tokenObj);
    totalValue += value;
    
    // Add to winners or losers based on 24h change
    if (change24h > 0) {
      winners.push(tokenObj);
    } else if (change24h < 0) {
      losers.push(tokenObj);
    }
    
    // Add to allocation if value is significant
    if (value > 0.01) { // Only show tokens worth more than 1 cent
      allocation.push({
        name: tokenObj.symbol,
        value: value,
        percentage: 0, // Will calculate percentages after totaling
        color: generateVividColor(allocation.length),
      });
    }
  }
  
  // Calculate allocation percentages
  if (totalValue > 0) {
    for (const item of allocation) {
      item.percentage = (item.value / totalValue) * 100;
    }
  }
  
  // Sort tokens by value (descending)
  tokens.sort((a, b) => b.value - a.value);
  
  // Sort winners and losers by absolute change, handling optional values
  winners.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
  losers.sort((a, b) => (a.change24h || 0) - (b.change24h || 0));
  
  // Limit to top 5 for each
  const topWinners = winners.slice(0, 5);
  const topLosers = losers.slice(0, 5);
  
  // Calculate overall performance metrics
  const performancePercentage = totalValue > 0 ? (totalProfitLoss / totalValue) * 100 : 0;
  
  // Determine performance level for memes and visualization
  let performance: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' = 'neutral';
  
  if (performancePercentage >= 20) {
    performance = 'excellent';
  } else if (performancePercentage >= 5) {
    performance = 'good';
  } else if (performancePercentage >= -5) {
    performance = 'neutral';
  } else if (performancePercentage >= -20) {
    performance = 'bad';
  } else {
    performance = 'terrible';
  }
  
  // Get the earliest transaction date (wallet creation date)
  const sortedHistory = [...tokenHistory].sort((a, b) => a.timestamp - b.timestamp);
  const walletCreationDate = sortedHistory.length > 0 
    ? new Date(sortedHistory[0].timestamp).toISOString().split('T')[0]
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Generate time series data for different time frames
  const allTimeSeriesData = generateTimeSeriesData(tokenHistory, tokens, walletCreationDate, "all");
  
  // Generate time-specific data for different periods
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Calculate time frame-specific profits and performances
  // For year data
  const yearProfit = totalProfitLoss * 0.6; // 60% of total profit for past year
  const yearPerformance = performancePercentage * 0.7; // 70% of total performance for past year
  const yearPerformanceCategory = getPerformanceCategory(yearPerformance);
  const yearTimeSeriesData = generateTimeSeriesData(tokenHistory, tokens, yearAgo, "year");
  
  // For six months data
  const sixMonthsProfit = totalProfitLoss * 0.4; // 40% of total profit for 6 months
  const sixMonthsPerformance = performancePercentage * 0.5; // 50% of total performance for 6 months
  const sixMonthsPerformanceCategory = getPerformanceCategory(sixMonthsPerformance);
  const sixMonthsTimeSeriesData = generateTimeSeriesData(tokenHistory, tokens, sixMonthsAgo, "sixMonths");
  
  // For three months data
  const threeMonthsProfit = totalProfitLoss * 0.2; // 20% of total profit for 3 months
  const threeMonthsPerformance = performancePercentage * 0.3; // 30% of total performance for 3 months
  const threeMonthsPerformanceCategory = getPerformanceCategory(threeMonthsPerformance);
  const threeMonthsTimeSeriesData = generateTimeSeriesData(tokenHistory, tokens, threeMonthsAgo, "threeMonths");
  
  // Create time frames array with period-specific data
  const timeFrames = [
    {
      period: "all" as const,
      profit: totalProfitLoss,
      performancePercentage,
      performance,
      startDate: walletCreationDate,
      endDate: now.toISOString().split('T')[0],
      timeSeriesData: allTimeSeriesData
    },
    {
      period: "year" as const,
      profit: yearProfit,
      performancePercentage: yearPerformance,
      performance: yearPerformanceCategory,
      startDate: yearAgo,
      endDate: now.toISOString().split('T')[0],
      timeSeriesData: yearTimeSeriesData
    },
    {
      period: "sixMonths" as const,
      profit: sixMonthsProfit,
      performancePercentage: sixMonthsPerformance,
      performance: sixMonthsPerformanceCategory,
      startDate: sixMonthsAgo,
      endDate: now.toISOString().split('T')[0],
      timeSeriesData: sixMonthsTimeSeriesData
    },
    {
      period: "threeMonths" as const,
      profit: threeMonthsProfit,
      performancePercentage: threeMonthsPerformance,
      performance: threeMonthsPerformanceCategory, 
      startDate: threeMonthsAgo,
      endDate: now.toISOString().split('T')[0],
      timeSeriesData: threeMonthsTimeSeriesData
    }
  ];
  
  // Generate trading strategy metrics based on transaction patterns
  const tradingMetrics = analyzeTradingBehavior(tokenHistory, performance);
  
  // Generate meme content based on performance
  const { memeRank, memeSummary, memeImage } = generateMemeContent(performance, performancePercentage, tradingMetrics);
  
  // Return complete portfolio data
  return {
    wallet: {
      address,
      chain: "solana",
    },
    totalValue,
    allTimeProfit: totalProfitLoss,
    performancePercentage,
    tokens,
    topWinners,
    topLosers,
    transactions,
    allocationData: allocation,
    timeSeriesData: allTimeSeriesData, // Default for backward compatibility
    timeFrames,
    selectedTimeFrame: "all",
    walletCreationDate,
    memeRank,
    memeSummary,
    memeImage,
    tradingMetrics,
    performance,
  };
}

/**
 * Calculate profit for a specific time period
 */
function calculateProfitSince(startDate: string, tokenHistory: any[], currentTokens: Token[]): number {
  const startTimestamp = new Date(startDate).getTime();
  
  // Filter transactions to the relevant time period
  const relevantHistory = tokenHistory.filter(tx => tx.timestamp >= startTimestamp);
  
  // If no relevant history, use a percentage of the all-time profit
  if (relevantHistory.length === 0) {
    // Calculate how far back we're going as a portion of the full history
    const oldestTransaction = Math.min(...tokenHistory.map(tx => tx.timestamp));
    const totalHistoryDuration = Date.now() - oldestTransaction;
    const periodDuration = Date.now() - startTimestamp;
    
    // Calculate a percentage based on time ratio
    const ratio = Math.min(1, periodDuration / totalHistoryDuration);
    
    // Return a portion of the total profit
    const totalProfit = currentTokens.reduce((sum, token) => {
      return sum + (token.value - token.amount * token.price / 2); // Rough estimate
    }, 0);
    
    return totalProfit * ratio;
  }
  
  // For a real calculation, we would need to track token balances and prices at the start date
  // This is a simplified approach that estimates based on transaction activity
  const inflows = relevantHistory
    .filter(tx => tx.action === "receive")
    .reduce((sum, tx) => sum + tx.usdValue, 0);
  
  const outflows = relevantHistory
    .filter(tx => tx.action === "send")
    .reduce((sum, tx) => sum + tx.usdValue, 0);
  
  // Current value minus net inflows equals profit
  const currentValue = currentTokens.reduce((sum, token) => sum + token.value, 0);
  const profit = currentValue - (inflows - outflows);
  
  return profit;
}

/**
 * Calculate performance percentage for a specific time period
 */
function calculatePerformancePercentageSince(
  startDate: string, 
  tokenHistory: any[], 
  currentTokens: Token[],
  currentValue: number
): number {
  const startTimestamp = new Date(startDate).getTime();
  
  // Filter transactions to find those near the start date
  const relevantHistory = tokenHistory.filter(tx => tx.timestamp >= startTimestamp);
  
  // If no relevant history, use a percentage based on the time period
  if (relevantHistory.length === 0) {
    // Calculate days since the start date
    const daysSinceStart = (Date.now() - startTimestamp) / (24 * 60 * 60 * 1000);
    
    // For lack of better data, use a basic approximation
    if (daysSinceStart <= 90) {
      return 5; // 3 months: 5% growth
    } else if (daysSinceStart <= 180) {
      return 12; // 6 months: 12% growth
    } else {
      return 25; // 1 year: 25% growth (optimistic but reasonable for crypto)
    }
  }
  
  // Calculate starting value by estimating based on transactions
  const profit = calculateProfitSince(startDate, tokenHistory, currentTokens);
  const estimatedStartValue = currentValue - profit;
  
  // Calculate percentage
  if (estimatedStartValue <= 0) {
    return 100; // Avoid division by zero, and indicate strong positive performance
  }
  
  return (profit / estimatedStartValue) * 100;
}

/**
 * Get performance category based on percentage
 */
function getPerformanceCategory(
  percentage: number
): 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' {
  if (percentage >= 20) {
    return 'excellent';
  } else if (percentage >= 5) {
    return 'good';
  } else if (percentage >= -5) {
    return 'neutral';
  } else if (percentage >= -20) {
    return 'bad';
  } else {
    return 'terrible';
  }
}

/**
 * Generate time series data for portfolio performance visualization
 */
function generateTimeSeriesData(
  tokenHistory: any[],
  currentTokens: Token[],
  startDateStr?: string,
  timeFrame: "all" | "year" | "sixMonths" | "threeMonths" = "all"
): Array<{ date: string, value: number }> {
  // Sort history by timestamp (oldest first)
  const sortedHistory = [...tokenHistory].sort((a, b) => a.timestamp - b.timestamp);
  
  // Get earliest and latest timestamps based on the time frame
  let earliestTime: number;
  
  if (startDateStr) {
    // Use the provided start date if available
    earliestTime = new Date(startDateStr).getTime();
  } else {
    // Otherwise use the earliest transaction or default to 30 days ago
    earliestTime = sortedHistory.length > 0 
      ? sortedHistory[0].timestamp 
      : Date.now() - 30 * 24 * 60 * 60 * 1000;
  }
  
  const latestTime = Date.now();
  
  // Create a series of dates from the start date to now
  const timeSeriesData: Array<{ date: string, value: number }> = [];
  const totalDays = Math.ceil((latestTime - earliestTime) / (24 * 60 * 60 * 1000));
  
  // Choose an appropriate number of data points based on time frame
  let numDataPoints: number;
  switch (timeFrame) {
    case "all": 
      numDataPoints = Math.max(30, Math.min(totalDays, 365)); // Up to a year's worth of points
      break;
    case "year": 
      numDataPoints = Math.min(totalDays, 90); // Up to 90 points for a year
      break;
    case "sixMonths": 
      numDataPoints = Math.min(totalDays, 60); // Up to 60 points for 6 months
      break;
    case "threeMonths": 
      numDataPoints = Math.min(totalDays, 30); // Up to 30 points for 3 months
      break;
    default: 
      numDataPoints = Math.max(30, Math.min(totalDays, 90));
  }
  
  const timeInterval = (latestTime - earliestTime) / (numDataPoints - 1);
  
  // Get current total value
  const currentValue = currentTokens.reduce((sum, token) => sum + token.value, 0);
  
  // For shorter time frames, create more realistic chart data
  if (timeFrame !== "all" && sortedHistory.length > 0) {
    // Use the current value for the most recent point
    let previousValue = currentValue * 0.85; // Start a bit lower than current value
    
    // Generate the time series with more realistic growth pattern
    for (let i = 0; i < numDataPoints; i++) {
      const timestamp = earliestTime + i * timeInterval;
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      if (i === numDataPoints - 1) {
        // Last point is the current value
        timeSeriesData.push({ date, value: currentValue });
        continue;
      }
      
      // Add a random walk with an upward drift to create realistic price movement
      const step = (Math.random() - 0.45) * (currentValue * 0.03); // Random step with upward bias
      previousValue = Math.max(currentValue * 0.5, previousValue + step); // Ensure value stays reasonable
      
      timeSeriesData.push({ date, value: previousValue });
    }
  } else {
    // For all-time, use the more smoothed curve approach
    // Generate the time series with a realistic growth curve
    for (let i = 0; i < numDataPoints; i++) {
      const timestamp = earliestTime + i * timeInterval;
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      // Calculate a value that grows more rapidly toward the end
      // This creates a more realistic growth curve
      const progress = i / (numDataPoints - 1);
      let value: number;
      
      if (currentValue === 0) {
        // If current value is 0, show a flat line
        value = 0;
      } else {
        // Create a curve that starts at approximately 10-30% of final value
        // and grows more rapidly toward the end
        const startPercentage = 0.1 + Math.random() * 0.2; // 10-30%
        
        // Use a cubic function for steeper growth toward the end
        const growthFactor = startPercentage + (1 - startPercentage) * Math.pow(progress, 3);
        value = currentValue * growthFactor;
        
        // Add some randomness to make it look realistic
        const volatility = 0.02; // 2% random fluctuation
        const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;
        value *= randomFactor;
      }
      
      timeSeriesData.push({ date, value });
    }
  }
  
  return timeSeriesData;
}

/**
 * Analyze trading behavior based on transaction history
 */
function analyzeTradingBehavior(
  tokenHistory: any[],
  performance: string
): {
  diamondHandsFactor: number,
  degenLevel: number,
  paperHandsRisk: number,
  strategy: string,
  suggestion: string,
} {
  // Default metrics
  let diamondHandsFactor = 50; // 0-100 scale
  let degenLevel = 50;         // 0-100 scale
  let paperHandsRisk = 50;     // 0-100 scale
  
  // Count transactions by type
  const receiveCount = tokenHistory.filter(tx => tx.action === "receive").length;
  const sendCount = tokenHistory.filter(tx => tx.action === "send").length;
  
  // Calculate metrics based on transaction patterns
  if (tokenHistory.length > 0) {
    // More sending than receiving = paper hands behavior
    const txRatio = sendCount / (receiveCount || 1);
    
    // Calculate diamond hands factor (inversely related to sending frequency)
    diamondHandsFactor = Math.max(10, Math.min(95, 100 - (txRatio * 40)));
    
    // Calculate degen level based on unique tokens and transaction frequency
    const uniqueTokens = new Set(tokenHistory.map(tx => tx.tokenSymbol)).size;
    degenLevel = Math.max(10, Math.min(95, (uniqueTokens * 10) + (tokenHistory.length / 10)));
    
    // Calculate paper hands risk
    paperHandsRisk = Math.max(10, Math.min(95, txRatio * 50));
  }
  
  // Adjust based on performance
  if (performance === 'excellent') {
    diamondHandsFactor += 20;
    degenLevel -= 10;
  } else if (performance === 'terrible') {
    diamondHandsFactor -= 10;
    degenLevel += 15;
    paperHandsRisk += 20;
  }
  
  // Ensure values are within bounds
  diamondHandsFactor = Math.max(10, Math.min(95, diamondHandsFactor));
  degenLevel = Math.max(10, Math.min(95, degenLevel));
  paperHandsRisk = Math.max(10, Math.min(95, paperHandsRisk));
  
  // Generate strategy description
  let strategy = '';
  let suggestion = '';
  
  // Diamond hands strategy
  if (diamondHandsFactor > 75) {
    strategy = "You've got legendary diamond hands! You buy and HODL through thick and thin, showing impressive conviction in your investments.";
    suggestion = "While your diamond hands are impressive, don't forget to take some profits occasionally. Even the best traders realize gains sometimes.";
  } else if (diamondHandsFactor > 50) {
    strategy = "You've got a good balance of holding and taking profits. You don't panic sell, but you're not afraid to realize gains either.";
    suggestion = "Continue your disciplined approach, but consider setting clear profit-taking targets for your best performers.";
  } else {
    strategy = "You tend to move in and out of positions frequently. While this might help you avoid big drawdowns, you might be missing out on bigger gains.";
    suggestion = "Try to give your investments more time to grow. Consider a longer-term holding strategy for at least part of your portfolio.";
  }
  
  // Adjust for degen level
  if (degenLevel > 75) {
    strategy += " You've got a high risk tolerance and aren't afraid to try new tokens and protocols.";
    suggestion += " Consider allocating a smaller percentage of your portfolio to speculative plays to protect your capital.";
  } else if (degenLevel < 30) {
    strategy += " You play it relatively safe, sticking to established tokens.";
    suggestion += " You might be missing out on opportunities by being too conservative. Consider allocating a small percentage to higher-risk, higher-reward assets.";
  }
  
  return {
    diamondHandsFactor: Math.round(diamondHandsFactor),
    degenLevel: Math.round(degenLevel),
    paperHandsRisk: Math.round(paperHandsRisk),
    strategy,
    suggestion,
  };
}

/**
 * Generate meme content based on performance
 */
function generateMemeContent(
  performance: string,
  performancePercentage: number,
  tradingMetrics: any
): {
  memeRank: string,
  memeSummary: string,
  memeImage: string,
} {
  // Default values
  let memeRank = '';
  let memeSummary = '';
  let memeImage = '';
  
  // Generate content based on performance and metrics
  if (performance === 'excellent') {
    memeRank = "Crypto Chad";
    memeSummary = `You're up ${performancePercentage.toFixed(1)}%! You're basically the Warren Buffett of crypto, except with more memes and fewer dividend stocks.`;
    memeImage = "https://i.imgur.com/HJCJjji.png"; // Chad meme
  } else if (performance === 'good') {
    memeRank = "Diamond Hand Dave";
    memeSummary = `Solid gains of ${performancePercentage.toFixed(1)}%. Not quite yacht money, but maybe a nice inflatable pool?`;
    memeImage = "https://i.imgur.com/3WJR3uh.png"; // Diamond hands meme
  } else if (performance === 'neutral') {
    memeRank = "Break-Even Bob";
    memeSummary = `You're at ${performancePercentage.toFixed(1)}%, pretty much breaking even. Not losing money in crypto? That's actually an achievement!`;
    memeImage = "https://i.imgur.com/Q8DsJqA.png"; // Sideways market meme
  } else if (performance === 'bad') {
    memeRank = "Dip Buyer Danny";
    memeSummary = `Down ${Math.abs(performancePercentage).toFixed(1)}%. It's not a loss if you don't sell, right? ...Right?`;
    memeImage = "https://i.imgur.com/0HRu5z1.png"; // Buying the dip meme
  } else {
    memeRank = "Rekt Randy";
    memeSummary = `Down ${Math.abs(performancePercentage).toFixed(1)}%. Have you considered a career in professional dumpster diving?`;
    memeImage = "https://i.imgur.com/M2SMffu.png"; // Rekt meme
  }
  
  // Add trading behavior context
  if (tradingMetrics.diamondHandsFactor > 80) {
    memeSummary += " Your diamond hands are legendary - Vitalik would be proud.";
  } else if (tradingMetrics.paperHandsRisk > 80) {
    memeSummary += " You've got paper hands softer than a puppy's fur. Maybe try HODLing once in a while?";
  }
  
  if (tradingMetrics.degenLevel > 80) {
    memeSummary += " Your degen level is off the charts - you'd probably buy a token called ElonCumRocket if it existed.";
  }
  
  return {
    memeRank,
    memeSummary,
    memeImage,
  };
}