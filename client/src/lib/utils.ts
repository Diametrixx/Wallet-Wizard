import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function detectChain(address: string): 'ethereum' | 'solana' | null {
  if (!address) return null;
  
  // Ethereum addresses start with 0x and are 42 characters long
  if (address.startsWith('0x') && address.length === 42) {
    return 'ethereum';
  }
  
  // Solana addresses are 44 characters long base58 strings
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }
  
  return null;
}

export function getChainColor(chain: 'ethereum' | 'solana' | null): string {
  if (chain === 'ethereum') return 'cyber-green';
  if (chain === 'solana') return 'cyber-purple';
  return 'white';
}

export function getRandomItemFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function calculatePerformanceLevel(percentChange: number): 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible' {
  if (percentChange >= 50) return 'excellent';
  if (percentChange >= 10) return 'good';
  if (percentChange >= -10) return 'neutral';
  if (percentChange >= -50) return 'bad';
  return 'terrible';
}
