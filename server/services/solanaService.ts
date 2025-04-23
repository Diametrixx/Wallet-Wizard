import { z } from 'zod';

// Helius API base URL and key
const HELIUS_API_BASE = 'https://api.helius.xyz/v0';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';

// Validate token balance response
const tokenBalanceSchema = z.object({
  mint: z.string(),
  amount: z.string(),
  decimals: z.number(),
  tokenName: z.string().optional(),
  tokenSymbol: z.string().optional(),
});

export type TokenBalance = z.infer<typeof tokenBalanceSchema>;

// Transaction validation schema
const transactionSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  type: z.string(),
  fee: z.number(),
  source: z.string().optional(),
  destination: z.string().optional(),
  amount: z.number().optional(),
  mint: z.string().optional(),
  symbol: z.string().optional(),
});

export type SolanaTransaction = z.infer<typeof transactionSchema>;

// Solana service for getting Solana wallet data
export const SolanaService = {
  // Get token balances for a wallet
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      const url = `${HELIUS_API_BASE}/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return z.object({
        tokens: z.array(tokenBalanceSchema)
      }).parse(data).tokens;
    } catch (error) {
      console.error('Error fetching Solana token balances', error);
      return [];
    }
  },
  
  // Get transactions for a wallet
  async getTransactions(walletAddress: string): Promise<SolanaTransaction[]> {
    try {
      const url = `${HELIUS_API_BASE}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return z.array(transactionSchema).parse(data);
    } catch (error) {
      console.error('Error fetching Solana transactions', error);
      return [];
    }
  },
  
  // Get native SOL balance for a wallet
  async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const url = `${HELIUS_API_BASE}/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return z.object({
        nativeBalance: z.number()
      }).parse(data).nativeBalance;
    } catch (error) {
      console.error('Error fetching SOL balance', error);
      return 0;
    }
  }
};
