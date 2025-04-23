import { z } from 'zod';
import { apiRequest } from '../helpers';

// Etherscan API base URL and key
const ETHERSCAN_API_BASE = 'https://api.etherscan.io/api';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

// Validate token transaction response
const tokenTxSchema = z.object({
  blockNumber: z.string(),
  timeStamp: z.string(),
  hash: z.string(),
  from: z.string(),
  to: z.string(),
  value: z.string(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenDecimal: z.string(),
  contractAddress: z.string(),
});

export type TokenTransaction = z.infer<typeof tokenTxSchema>;

// Validate eth transaction response
const ethTxSchema = z.object({
  blockNumber: z.string(),
  timeStamp: z.string(),
  hash: z.string(),
  from: z.string(),
  to: z.string(),
  value: z.string(),
  gas: z.string(),
  gasPrice: z.string(),
});

export type EthTransaction = z.infer<typeof ethTxSchema>;

// Etherscan service for getting Ethereum wallet data
export const EthService = {
  // Get ERC20 token transactions for a wallet
  async getTokenTransactions(walletAddress: string): Promise<TokenTransaction[]> {
    try {
      const url = `${ETHERSCAN_API_BASE}?module=account&action=tokentx&address=${walletAddress}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      return z.array(tokenTxSchema).parse(data.result);
    } catch (error) {
      console.error('Error fetching token transactions', error);
      return [];
    }
  },
  
  // Get ETH transactions for a wallet
  async getEthTransactions(walletAddress: string): Promise<EthTransaction[]> {
    try {
      const url = `${ETHERSCAN_API_BASE}?module=account&action=txlist&address=${walletAddress}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      return z.array(ethTxSchema).parse(data.result);
    } catch (error) {
      console.error('Error fetching ETH transactions', error);
      return [];
    }
  },
  
  // Get token balances for a wallet
  async getTokenBalances(walletAddress: string): Promise<any[]> {
    try {
      const url = `${ETHERSCAN_API_BASE}?module=account&action=tokenbalance&address=${walletAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      return data.result;
    } catch (error) {
      console.error('Error fetching token balances', error);
      return [];
    }
  },
  
  // Get ETH balance for a wallet
  async getEthBalance(walletAddress: string): Promise<string> {
    try {
      const url = `${ETHERSCAN_API_BASE}?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      return data.result;
    } catch (error) {
      console.error('Error fetching ETH balance', error);
      return '0';
    }
  }
};
