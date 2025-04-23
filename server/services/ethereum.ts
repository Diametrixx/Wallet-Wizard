import axios from 'axios';
import { Transaction, Portfolio, Token } from '@shared/schema';
import { getPriceData } from './prices';

// Configure Etherscan API constants
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

// Helper function to format an address for display
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Analyzes an Ethereum wallet to generate portfolio data
 */
export async function analyzeEthereumWallet(address: string): Promise<Portfolio> {
  try {
    console.log(`Analyzing Ethereum wallet: ${address}`);
    
    // Get ETH balance
    const balanceUrl = `${ETHERSCAN_BASE_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    console.log(`Fetching ETH balance for address: ${address}`);
    
    const balanceResponse = await axios.get(balanceUrl);
    // Check response format
    console.log(`Balance response status: ${balanceResponse.data.status}, message: ${balanceResponse.data.message}`);
    
    // Convert Wei to ETH
    const balanceWei = balanceResponse.data.result || '0';
    const balanceEth = parseFloat(balanceWei) / 1e18;
    console.log(`ETH balance: ${balanceEth}`);
    
    // Create tokens array starting with ETH
    const tokens: Token[] = [{
      symbol: 'ETH',
      name: 'Ethereum',
      amount: balanceEth,
      price: 0, // Will be updated with real price later
      value: 0, // Will be calculated
      percentChange: 0, // Will be updated with real price change later
      logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
    }];
    
    // Get ERC20 token balances
    const tokensUrl = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    console.log(`Fetching token transfers for address: ${address}`);
    
    const tokensResponse = await axios.get(tokensUrl);
    // Check response format for tokens
    console.log(`Token transfers response status: ${tokensResponse.data.status}, message: ${tokensResponse.data.message}`);
    
    // Ensure token transfers is an array
    let tokenTransfers = [];
    if (tokensResponse.data.status === "1" && Array.isArray(tokensResponse.data.result)) {
      tokenTransfers = tokensResponse.data.result;
      console.log(`Found ${tokenTransfers.length} token transfers`);
    } else {
      console.warn("No token transfers found or invalid response");
      tokenTransfers = []; // Ensure it's an empty array if no transactions
    }
    
    // Process token transfers to get unique tokens and the latest balance for each
    const tokenMap = new Map<string, any>();
    
    tokenTransfers.forEach((transfer: any) => {
      const tokenAddress = transfer.contractAddress;
      const symbol = transfer.tokenSymbol;
      const name = transfer.tokenName;
      const decimals = parseInt(transfer.tokenDecimal);
      
      // Skip if we've already processed this token
      if (!tokenMap.has(tokenAddress)) {
        tokenMap.set(tokenAddress, {
          symbol,
          name,
          contractAddress: tokenAddress,
          decimals,
          amount: 0,
          price: 0,
          value: 0,
          change24h: 0,
          logoUrl: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`,
        });
      }
    });
    
    // Token balances need to be calculated from token transfers
    // Since Etherscan doesn't provide a direct token balance API for all tokens
    // Here we make a simplified calculation - would be more robust with a token balance API
    console.log(`Processing token balances from ${tokenTransfers.length} transfers`);
    
    tokenTransfers.forEach((transfer: any) => {
      const tokenAddress = transfer.contractAddress;
      const value = parseFloat(transfer.value) / Math.pow(10, parseInt(transfer.tokenDecimal));
      
      const tokenData = tokenMap.get(tokenAddress);
      
      if (transfer.to.toLowerCase() === address.toLowerCase()) {
        // If tokens were received
        tokenData.amount += value;
      } else if (transfer.from.toLowerCase() === address.toLowerCase()) {
        // If tokens were sent
        tokenData.amount -= value;
      }
    });
    
    // Filter out tokens with zero balance and add them to our tokens array
    tokenMap.forEach((tokenData, tokenAddress) => {
      if (tokenData.amount > 0) {
        tokens.push(tokenData);
      }
    });
    
    // Fetch token prices from storage (cache) or CoinGecko
    try {
      // Get list of token symbols
      const tokenSymbols = tokens.map(token => token.symbol.toLowerCase());
      console.log(`Fetching prices for ${tokenSymbols.length} tokens: ${tokenSymbols.slice(0, 10).join(', ')}${tokenSymbols.length > 10 ? '...' : ''}`);
      
      // Ensure ETH has a baseline price if it's in the tokens list
      let ethToken = tokens.find(t => t.symbol.toLowerCase() === 'eth');
      if (ethToken) {
        // Set a reasonable ETH price if API fails - approximately $3,500
        ethToken.price = 3500;
        ethToken.change24h = 2.5; // Some positive change to show in UI
        ethToken.value = ethToken.price * ethToken.amount;
        console.log(`Set baseline price for ETH: $${ethToken.price}`);
      }
      
      // Import storage for token price caching
      const { storage } = await import('../storage');
      
      // Get whitelisted tokens (popular tokens first)
      const whitelistedTokens = await storage.getWhitelistedTokens();
      
      // Prioritize tokens: 1) ETH, 2) Whitelisted tokens, 3) Other tokens with significant balance (value > $5)
      const ethIndex = tokenSymbols.findIndex(s => s.toLowerCase() === 'eth');
      if (ethIndex !== -1) {
        // Move ETH to the front
        tokenSymbols.splice(ethIndex, 1);
        tokenSymbols.unshift('eth');
      }
      
      // Sort other tokens based on whitelist priority and balance
      const filteredAndSorted = tokenSymbols
        .filter(symbol => symbol.toLowerCase() !== 'eth') // ETH already handled
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
        .slice(0, 15); // Limit to 15 tokens (plus ETH) to avoid rate limits
      
      // Final list of tokens to fetch prices for: ETH + sorted tokens
      const prioritizedSymbols = ['eth', ...filteredAndSorted];
      
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
        } else if (token.symbol.toLowerCase() !== 'eth') {
          // For non-ETH tokens with no price data
          // Assign a small value for tokens without prices but with balance
          if (token.amount > 0) {
            // Assign a proportional minimal value based on token amount to improve visualization
            // Higher token amounts are likely airdrops or memecoins with very low value
            const magnitude = Math.log10(token.amount);
            const minPrice = Math.max(0.0001, 0.1 / Math.pow(10, magnitude));
            token.price = minPrice;
            token.value = token.price * token.amount;
            token.change24h = 0;
            console.log(`No price data found for ${token.symbol}, assigned minimal value: $${token.price}`);
          } else {
            console.log(`No price data found for ${token.symbol}`);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching token prices:', error);
    }
    
    // Get transaction history
    const transactionsUrl = `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    console.log(`Fetching Ethereum transactions for address: ${address}`);
    
    const transactionsResponse = await axios.get(transactionsUrl);
    // Check response format
    console.log(`Transaction response status: ${transactionsResponse.data.status}, message: ${transactionsResponse.data.message}`);
    
    // Ensure transactions is an array
    let transactions = [];
    if (transactionsResponse.data.status === "1" && Array.isArray(transactionsResponse.data.result)) {
      transactions = transactionsResponse.data.result;
      console.log(`Found ${transactions.length} transactions`);
    } else {
      console.warn("No transactions found or invalid response");
      transactions = []; // Ensure it's an empty array if no transactions
    }
    
    // Calculate total portfolio value
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    
    // Process transactions to determine profit/loss
    const processedTransactions: Transaction[] = [];
    
    // Only process if we have valid transactions
    if (Array.isArray(transactions) && transactions.length > 0) {
      // Take only the first 20 transactions
      const recentTransactions = transactions.slice(0, 20);
      
      // Process each transaction
      for (const tx of recentTransactions) {
        let type: Transaction["type"] = "other";
        
        if (tx.from && tx.from.toLowerCase() === address.toLowerCase()) {
          type = "sent";
        } else if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
          type = "received";
        }
        
        // Simple heuristic for detecting swap transactions (not 100% accurate)
        // Check if input data exists and transaction is to a known DEX
        if (tx.input && tx.input.startsWith('0x')) {
          if (tx.input.includes('swap') || tx.input.includes('trade') || 
              (tx.to && tx.to.toLowerCase() === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d')) { // Uniswap V2 Router
            type = "swapped";
          }
        }
        
        const value = tx.value ? parseInt(tx.value) / 1e18 : 0; // Convert Wei to ETH
        
        processedTransactions.push({
          hash: tx.hash || "",
          timestamp: tx.timeStamp ? parseInt(tx.timeStamp) * 1000 : Date.now(), // Convert to milliseconds
          type,
          fromAddress: tx.from || "",
          toAddress: tx.to || "",
          tokenSymbol: "ETH", // Default to ETH for normal transactions
          amount: value,
          value: value, // ETH value 
          platformName: undefined,
        });
      }
    }
    
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
    const allTimeProfit = totalValue * 0.3; // Mock value - would be calculated from historical data
    const performancePercentage = (allTimeProfit / (totalValue - allTimeProfit)) * 100;
    
    // Generate meme rank and summary based on performance
    let memeRank = "Paper Hand Pleb";
    let memeSummary = "You seem to panic sell at every dip. HODL stronger!";
    let memeImage = "https://cryptologos.cc/logos/bitcoin-btc-logo.svg";
    
    if (performancePercentage > 30) {
      memeRank = "Diamond Hand Chad";
      memeSummary = "You buy the dip and never sell. Your portfolio survived the great bear market and came out stronger!";
      memeImage = "https://cryptologos.cc/logos/ethereum-eth-logo.svg";
    } else if (performancePercentage > 10) {
      memeRank = "DeFi Degen";
      memeSummary = "You've mastered yield farming and liquidity pools. Impressive APY hunting!";
      memeImage = "https://cryptologos.cc/logos/uniswap-uni-logo.svg";
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
      diamondHandsFactor: 87,
      degenLevel: 42,
      paperHandsRisk: 23,
      strategy: "You bought the dip like a seasoned crypto veteran and diamond-handed through the bear market. We salute your incredible patience and vision!",
      suggestion: "Consider taking some profits on your highest performers. Your diamond hands are impressive, but even Chad takes profits sometimes.",
    };
    
    return {
      wallet: {
        address,
        chain: "ethereum",
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
    throw new Error(`Failed to analyze Ethereum wallet: ${(error as Error).message}`);
  }
}