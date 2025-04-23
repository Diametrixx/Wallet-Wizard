/**
 * Detect blockchain from address format
 */
export function detectChain(address: string): "ethereum" | "solana" | null {
  if (!address) return null;
  
  // Ethereum address format: 0x followed by 40 hex characters
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return "ethereum";
  }
  
  // Solana address: base58 encoded, 32-44 characters, not starting with 0x
  if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    return "solana";
  }
  
  return null;
}

/**
 * Check if an address is valid
 */
export function isValidAddress(address: string): boolean {
  return !!detectChain(address);
}

/**
 * Format currency values
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a blockchain address to a shorter version
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length < 10) return address;
  
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}

/**
 * Get icon info for a transaction type without JSX
 */
export function getTransactionTypeInfo(type: string): { 
  iconName: string;
  bgColor: string;
  color: string;
} {
  switch (type) {
    case "send":
      return {
        iconName: "arrow-up",
        bgColor: "bg-cyber-pink/20",
        color: "text-cyber-pink"
      };
    case "receive":
      return {
        iconName: "arrow-down",
        bgColor: "bg-cyber-green/20",
        color: "text-cyber-green"
      };
    case "swap":
      return {
        iconName: "refresh-cw",
        bgColor: "bg-cyber-blue/20",
        color: "text-cyber-blue"
      };
    default:
      return {
        iconName: "refresh-cw",
        bgColor: "bg-gray-400/20",
        color: "text-gray-400"
      };
  }
}
