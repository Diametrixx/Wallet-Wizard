import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
