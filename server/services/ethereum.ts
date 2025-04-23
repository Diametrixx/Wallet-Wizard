import axios from "axios";
import type { Portfolio, Token, Transaction } from "@shared/schema";
import { getPriceData } from "./prices";

// Use Covalent API (free tier)
const COVALENT_API_KEY = process.env.COVALENT_API_KEY || "";
const COVALENT_BASE_URL = "https://api.covalenthq.com/v1";

/**
 * Analyzes an Ethereum wallet to generate portfolio data
 */
export async function analyzeEthereumWallet(address: string): Promise<Portfolio> {
  try {
    // Get token balances and basic data
    const balancesUrl = `${COVALENT_BASE_URL}/1/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`;
    const balancesResponse = await axios.get(balancesUrl);
    const balances = balancesResponse.data.data.items;
    
    // Get transaction history
    const transactionsUrl = `${COVALENT_BASE_URL}/1/address/${address}/transactions_v2/?key=${COVALENT_API_KEY}`;
    const transactionsResponse = await axios.get(transactionsUrl);
    const transactions = transactionsResponse.data.data.items;
    
    // Create token list with balances
    const tokens: Token[] = await Promise.all(
      balances
        .filter((item: any) => parseFloat(item.balance) > 0)
        .map(async (item: any) => {
          // Get token price and data
          return {
            symbol: item.contract_ticker_symbol,
            name: item.contract_name,
            decimals: item.contract_decimals,
            contractAddress: item.contract_address,
            amount: parseFloat(item.balance) / (10 ** item.contract_decimals),
            price: parseFloat(item.quote_rate) || 0,
            value: parseFloat(item.quote) || 0,
            change24h: parseFloat(item.quote_rate_24h) || 0,
            logoUrl: item.logo_url,
          };
        })
    );
    
    // Calculate total portfolio value
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    
    // Process transactions to determine profit/loss
    const processedTransactions: Transaction[] = transactions
      .slice(0, 20) // Limit to most recent 20 transactions
      .map((tx: any) => {
        let type: Transaction["type"] = "other";
        
        if (tx.from_address.toLowerCase() === address.toLowerCase()) {
          type = "send";
        } else if (tx.to_address.toLowerCase() === address.toLowerCase()) {
          type = "receive";
        }
        
        // Check if it's a swap by examining log events (simplified)
        if (tx.log_events?.some((event: any) => 
            event.decoded?.name === "Swap" || 
            event.sender_name?.includes("Uniswap") || 
            event.sender_name?.includes("Sushi"))) {
          type = "swap";
        }
        
        return {
          hash: tx.tx_hash,
          timestamp: new Date(tx.block_signed_at).getTime(),
          type,
          fromAddress: tx.from_address,
          toAddress: tx.to_address,
          tokenSymbol: "", // Would need more processing to determine actual token
          amount: 0, // Would need more processing
          value: parseFloat(tx.value_quote) || 0,
          platformName: tx.log_events?.[0]?.sender_name || undefined,
        };
      });
    
    // Sort tokens by value to get winners and losers
    const sortedTokens = [...tokens].sort((a, b) => b.value - a.value);
    const topWinners = sortedTokens.filter(t => t.change24h > 0).slice(0, 3);
    const topLosers = sortedTokens.filter(t => t.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 3);
    
    // Prepare allocation data
    let allocationData = [];
    
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
