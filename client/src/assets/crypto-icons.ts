export interface CryptoIcon {
  name: string;
  symbol: string;
  src: string;
}

export const cryptoIcons: CryptoIcon[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    src: "https://i.imgur.com/2GodGVB.png"
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    src: "https://i.imgur.com/VSo7TrH.png"
  },
  {
    name: "Solana",
    symbol: "SOL",
    src: "https://i.imgur.com/xh3cJxb.png"
  },
  {
    name: "Arbitrum",
    symbol: "ARB",
    src: "https://i.imgur.com/Fty9qeq.png"
  },
  {
    name: "Dogecoin",
    symbol: "DOGE",
    src: "https://i.imgur.com/H7Hdbks.png"
  },
  {
    name: "Shiba Inu",
    symbol: "SHIB",
    src: "https://i.imgur.com/UqZe4Rr.png"
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    src: "https://i.imgur.com/8YFhwRy.png"
  },
  {
    name: "Tether",
    symbol: "USDT",
    src: "https://i.imgur.com/MXW4D3c.png"
  },
  {
    name: "Chainlink",
    symbol: "LINK",
    src: "https://i.imgur.com/3GxWZWv.png"
  },
  {
    name: "PEPE",
    symbol: "PEPE",
    src: "https://i.imgur.com/Hl1aPJB.png"
  }
];

// Fallback to use when a token doesn't have an icon
export const defaultTokenIcon = "https://i.imgur.com/cBIUDdD.png";

export function getTokenIconBySymbol(symbol: string): string {
  const icon = cryptoIcons.find(icon => 
    icon.symbol.toLowerCase() === symbol.toLowerCase()
  );
  return icon ? icon.src : defaultTokenIcon;
}
