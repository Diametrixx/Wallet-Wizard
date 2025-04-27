import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, unique, primaryKey, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Wallet-related schemas for data validation
export const walletSchema = z.object({
  address: z.string().min(1, "Wallet address is required"),
  chain: z.enum(["ethereum", "solana"]),
});

export type Wallet = z.infer<typeof walletSchema>;

// Token schema for portfolio assets
export const tokenSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().optional(),
  contractAddress: z.string().optional(),
  amount: z.number(),
  price: z.number(),
  value: z.number(),
  change24h: z.number().optional(),
  allTimeProfit: z.number().optional(),
  logoUrl: z.string().optional(),
});

export type Token = z.infer<typeof tokenSchema>;

// Transaction schema for history
export const transactionSchema = z.object({
  hash: z.string(),
  timestamp: z.number(),
  type: z.enum(["send", "receive", "swap", "stake", "unstake", "other"]),
  fromAddress: z.string(),
  toAddress: z.string().optional(),
  tokenSymbol: z.string(),
  amount: z.number(),
  value: z.number().optional(),
  platformName: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Portfolio schema for the entire wallet analysis
export const portfolioSchema = z.object({
  wallet: walletSchema,
  totalValue: z.number(),
  allTimeProfit: z.number(),
  performancePercentage: z.number(),
  // Performance category based on calculations
  performance: z.enum(["excellent", "good", "neutral", "bad", "terrible"]).optional(),
  tokens: z.array(tokenSchema),
  topWinners: z.array(tokenSchema),
  topLosers: z.array(tokenSchema),
  transactions: z.array(transactionSchema).optional(),
  allocationData: z.array(z.object({
    name: z.string(),
    value: z.number(),
    percentage: z.number(),
    color: z.string(),
  })),
  timeSeriesData: z.array(z.object({
    date: z.string(),
    value: z.number(),
  })),
  memeRank: z.string(),
  memeSummary: z.string(),
  memeImage: z.string(),
  tradingMetrics: z.object({
    diamondHandsFactor: z.number(),
    degenLevel: z.number(),
    paperHandsRisk: z.number(),
    strategy: z.string(),
    suggestion: z.string(),
  }),
});

export type Portfolio = z.infer<typeof portfolioSchema>;

// Database tables for caching

// Cache wallets to reduce API calls
export const walletCache = pgTable("wallet_cache", {
  address: text('address').notNull(),
  chain: text('chain').notNull(),
  lastAnalyzed: timestamp('last_analyzed').notNull().defaultNow(),
  portfolioData: jsonb('portfolio_data').notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.address, table.chain)
  }
});

export const insertWalletCacheSchema = createInsertSchema(walletCache);
export type InsertWalletCache = z.infer<typeof insertWalletCacheSchema>;
export type WalletCache = typeof walletCache.$inferSelect;

// Cache token prices to reduce API calls
export const tokenPrices = pgTable("token_prices", {
  symbol: text('symbol').notNull().primaryKey(),
  price: jsonb('price').notNull(), // Store full price object with 24h change
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

export const insertTokenPriceSchema = createInsertSchema(tokenPrices);
export type InsertTokenPrice = z.infer<typeof insertTokenPriceSchema>;
export type TokenPrice = typeof tokenPrices.$inferSelect;

// Token whitelist for known good tokens to prioritize price fetching
export const tokenWhitelist = pgTable("token_whitelist", {
  symbol: text('symbol').notNull().primaryKey(),
  name: text('name').notNull(),
  coingeckoId: text('coingecko_id').notNull(),
  isPopular: boolean('is_popular').notNull().default(false),
});

//from CHATGPT:
// Note: Imported already above, just using what's already imported

// Enriched transactions for a wallet (used for P&L + recent activity)
export const enrichedTransactions = pgTable("enriched_transactions", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  signature: text("signature").notNull(),
  tokenSymbol: text("token_symbol"),
  tokenMint: text("token_mint"),
  amount: real("amount"),
  direction: text("direction"), // "in" or "out"
  usdValue: real("usd_value"),
  timestamp: timestamp("timestamp").notNull(),
});

// Token holdings snapshot (used for current allocation + performance calc)
export const tokenHoldings = pgTable("token_holdings", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  tokenMint: text("token_mint").notNull(),
  quantity: real("quantity"),
  currentUsdPrice: real("current_usd_price"),
  totalUsdValue: real("total_usd_value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Historical token prices (used for portfolio value over time)
export const historicalTokenPrices = pgTable("historical_token_prices", {
  id: serial("id").primaryKey(),
  tokenMint: text("token_mint"),
  tokenSymbol: text("token_symbol"),
  timestamp: timestamp("timestamp"),
  usdPrice: real("usd_price"),
});
