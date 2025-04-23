import { 
  users, type User, type InsertUser,
  type Transaction, type Token, type Portfolio, type Wallet,
  walletCache, tokenPrices, tokenWhitelist
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gt } from "drizzle-orm";
import { getPriceData } from "./services/prices";

// Storage interface for all models
export interface IStorage {
  // User methods (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolio cache methods
  getPortfolioByWalletAddress(walletAddress: string, chain: string): Promise<Portfolio | undefined>;
  savePortfolio(portfolio: Portfolio): Promise<Portfolio>;
  
  // Token price methods
  getTokenPrice(symbol: string): Promise<any | undefined>;
  saveTokenPrice(symbol: string, priceData: any): Promise<void>;
  getCachedOrFetchPrices(symbols: string[]): Promise<Record<string, any>>;
  getWhitelistedTokens(): Promise<string[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Portfolio methods
  async getPortfolioByWalletAddress(walletAddress: string, chain: string): Promise<Portfolio | undefined> {
    // Case insensitive search for wallet address
    const normalizedAddress = walletAddress.toLowerCase();
    
    const [cachedWallet] = await db
      .select()
      .from(walletCache)
      .where(
        and(
          eq(walletCache.address, normalizedAddress),
          eq(walletCache.chain, chain)
        )
      );
      
    if (cachedWallet) {
      console.log(`Using cached portfolio data for ${normalizedAddress} (chain: ${chain})`);
      // Return the cached portfolio data
      return cachedWallet.portfolioData as unknown as Portfolio;
    }
    
    return undefined;
  }

  async savePortfolio(portfolio: Portfolio): Promise<Portfolio> {
    // Normalize the wallet address
    const normalizedAddress = portfolio.wallet.address.toLowerCase();
    
    try {
      // Delete any existing data for this wallet/chain combination
      await db
        .delete(walletCache)
        .where(
          and(
            eq(walletCache.address, normalizedAddress),
            eq(walletCache.chain, portfolio.wallet.chain)
          )
        );
        
      // Insert the new portfolio data
      await db
        .insert(walletCache)
        .values({
          address: normalizedAddress,
          chain: portfolio.wallet.chain,
          portfolioData: portfolio as any,
        });
        
      console.log(`Portfolio data saved for ${normalizedAddress} (chain: ${portfolio.wallet.chain})`);
      
      // Update token prices in the cache
      for (const token of portfolio.tokens) {
        if (token.symbol && token.price > 0) {
          await this.saveTokenPrice(token.symbol, { 
            usd: token.price,
            usd_24h_change: token.change24h || 0 
          });
        }
      }
      
      return portfolio;
    } catch (error) {
      console.error("Error saving portfolio:", error);
      return portfolio;
    }
  }
  
  // Token price methods
  async getTokenPrice(symbol: string): Promise<any | undefined> {
    const [tokenPrice] = await db
      .select()
      .from(tokenPrices)
      .where(eq(tokenPrices.symbol, symbol.toLowerCase()));
      
    if (tokenPrice) {
      // Check if the price is recent (less than 1 hour old)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      if (tokenPrice.lastUpdated > oneHourAgo) {
        return tokenPrice.price;
      }
    }
    
    return undefined;
  }
  
  async saveTokenPrice(symbol: string, priceData: any): Promise<void> {
    try {
      // Delete existing price for this token if it exists
      await db
        .delete(tokenPrices)
        .where(eq(tokenPrices.symbol, symbol.toLowerCase()));
        
      // Insert the new price data
      await db
        .insert(tokenPrices)
        .values({
          symbol: symbol.toLowerCase(),
          price: priceData,
        });
    } catch (error) {
      console.error(`Error saving price for ${symbol}:`, error);
    }
  }
  
  async getCachedOrFetchPrices(symbols: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const symbolsToFetch: string[] = [];
    
    // First, check if we have recent prices in the cache
    for (const symbol of symbols) {
      const cachedPrice = await this.getTokenPrice(symbol);
      
      if (cachedPrice) {
        result[symbol.toLowerCase()] = cachedPrice;
      } else {
        symbolsToFetch.push(symbol);
      }
    }
    
    // If we need to fetch any prices, do it now
    if (symbolsToFetch.length > 0) {
      try {
        // Get the prices from CoinGecko
        const priceData = await getPriceData(symbolsToFetch);
        
        // Save the prices to the cache and add them to the result
        for (const symbol of symbolsToFetch) {
          const lowercase = symbol.toLowerCase();
          if (priceData[lowercase]) {
            await this.saveTokenPrice(lowercase, priceData[lowercase]);
            result[lowercase] = priceData[lowercase];
          }
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    }
    
    return result;
  }
  
  async getWhitelistedTokens(): Promise<string[]> {
    const tokens = await db
      .select()
      .from(tokenWhitelist)
      .orderBy(desc(tokenWhitelist.isPopular));
      
    return tokens.map(token => token.symbol);
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<string, Portfolio>;
  private tokenPrices: Map<string, any>;
  private userId: number;

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.tokenPrices = new Map();
    this.userId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Portfolio methods
  async getPortfolioByWalletAddress(walletAddress: string, chain: string): Promise<Portfolio | undefined> {
    const key = `${walletAddress.toLowerCase()}-${chain}`;
    return this.portfolios.get(key);
  }

  async savePortfolio(portfolio: Portfolio): Promise<Portfolio> {
    const key = `${portfolio.wallet.address.toLowerCase()}-${portfolio.wallet.chain}`;
    this.portfolios.set(key, portfolio);
    return portfolio;
  }
  
  // Token price methods
  async getTokenPrice(symbol: string): Promise<any | undefined> {
    return this.tokenPrices.get(symbol.toLowerCase());
  }
  
  async saveTokenPrice(symbol: string, priceData: any): Promise<void> {
    this.tokenPrices.set(symbol.toLowerCase(), priceData);
  }
  
  async getCachedOrFetchPrices(symbols: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const symbolsToFetch: string[] = [];
    
    // Check which symbols we have cached
    for (const symbol of symbols) {
      const cachedPrice = await this.getTokenPrice(symbol);
      
      if (cachedPrice) {
        result[symbol.toLowerCase()] = cachedPrice;
      } else {
        symbolsToFetch.push(symbol);
      }
    }
    
    // Fetch missing prices
    if (symbolsToFetch.length > 0) {
      try {
        const priceData = await getPriceData(symbolsToFetch);
        
        for (const symbol of symbolsToFetch) {
          const lowercase = symbol.toLowerCase();
          if (priceData[lowercase]) {
            await this.saveTokenPrice(lowercase, priceData[lowercase]);
            result[lowercase] = priceData[lowercase];
          }
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    }
    
    return result;
  }
  
  async getWhitelistedTokens(): Promise<string[]> {
    // In memory implementation returns some hardcoded popular tokens
    return [
      'ETH', 'SOL', 'BTC', 'USDT', 'USDC', 
      'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'
    ];
  }
}

// Use database storage for better caching and persistence
export const storage = new DatabaseStorage();
