import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Constants for Solana connections
 */
export const SOLANA_MAINNET = 'https://api.mainnet-beta.solana.com';
export const SOLANA_DEVNET = 'https://api.devnet.solana.com';

/**
 * Returns whether Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  // @ts-ignore
  const phantom = window.phantom?.solana;
  return !!phantom;
}

/**
 * Returns the Phantom wallet object
 */
export function getPhantomWallet() {
  // @ts-ignore
  return window.phantom?.solana;
}

/**
 * Connect to Phantom wallet
 */
export async function connectPhantom() {
  try {
    const phantom = getPhantomWallet();
    if (!phantom) {
      throw new Error('Phantom wallet not found');
    }
    
    // Try to connect and get wallet address
    const response = await phantom.connect();
    return response.publicKey.toString();
  } catch (error) {
    console.error('Error connecting to Phantom wallet:', error);
    throw error;
  }
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantom() {
  try {
    const phantom = getPhantomWallet();
    if (phantom) {
      await phantom.disconnect();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error disconnecting from Phantom wallet:', error);
    return false;
  }
}

/**
 * Get SOL balance from a Solana wallet address
 */
export async function getSolBalance(address: string): Promise<number> {
  try {
    const connection = new Connection(SOLANA_MAINNET);
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    throw error;
  }
}

/**
 * Get real-time token balances using Phantom wallet
 */
export async function getPhantomTokenBalances() {
  try {
    const phantom = getPhantomWallet();
    if (!phantom) {
      throw new Error('Phantom wallet not found');
    }
    
    // This won't work in practice without more integration
    // Phantom doesn't expose a direct API for this
    // We would need to use wallet adapter libraries for full integration
    
    // This is a placeholder for the concept
    const publicKey = phantom.publicKey?.toString();
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // In a real implementation, we would use SPL token program
    // to fetch all token accounts for the connected wallet
    return {
      address: publicKey,
      tokens: [] // This would contain actual token data
    };
  } catch (error) {
    console.error('Error getting token balances from Phantom:', error);
    throw error;
  }
}