import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon to use websockets (needed for serverless)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("Setting up database connection pool");
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  try {
    // Initialize token whitelist with common tokens
    const whitelistTokens = [
      { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', isPopular: true },
      { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', isPopular: true },
      { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', isPopular: true },
      { symbol: 'USDT', name: 'Tether', coingeckoId: 'tether', isPopular: true },
      { symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', isPopular: true },
      { symbol: 'BNB', name: 'Binance Coin', coingeckoId: 'binancecoin', isPopular: true },
      { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple', isPopular: true },
      { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', isPopular: true },
      { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', isPopular: true },
      { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', isPopular: true },
      { symbol: 'DAI', name: 'Dai', coingeckoId: 'dai', isPopular: true },
      { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', isPopular: true },
      { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', isPopular: true },
      { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap', isPopular: true },
      { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', isPopular: true },
      { symbol: 'AAVE', name: 'Aave', coingeckoId: 'aave', isPopular: true },
      { symbol: 'OP', name: 'Optimism', coingeckoId: 'optimism', isPopular: true },
      { symbol: 'ARB', name: 'Arbitrum', coingeckoId: 'arbitrum', isPopular: true },
      { symbol: 'FTM', name: 'Fantom', coingeckoId: 'fantom', isPopular: false },
      { symbol: 'ATOM', name: 'Cosmos', coingeckoId: 'cosmos', isPopular: false },
      { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', isPopular: false },
      { symbol: 'RAMP', name: 'RAMP', coingeckoId: 'ramp', isPopular: false },
      { symbol: 'REEF', name: 'Reef Finance', coingeckoId: 'reef-finance', isPopular: false },
      { symbol: 'ALBT', name: 'AllianceBlock', coingeckoId: 'allianceblock', isPopular: false },
      { symbol: 'BONDLY', name: 'Bondly', coingeckoId: 'bondly', isPopular: false },
      { symbol: 'UFO', name: 'UFO Gaming', coingeckoId: 'ufo-gaming', isPopular: false },
      { symbol: 'TVK', name: 'Terra Virtua Kolect', coingeckoId: 'terra-virtua-kolect', isPopular: false },
      { symbol: 'NORD', name: 'Nord Finance', coingeckoId: 'nord-finance', isPopular: false },
      { symbol: 'ZEE', name: 'ZeroSwap', coingeckoId: 'zeroswap', isPopular: false },
      { symbol: 'PAID', name: 'PAID Network', coingeckoId: 'paid-network', isPopular: false },
    ];

    // Insert each token into the whitelist, ignore conflicts (already exists)
    for (const token of whitelistTokens) {
      try {
        // Use insert but ignore conflicts when the symbol already exists
        await db.insert(schema.tokenWhitelist)
          .values(token)
          .onConflictDoNothing({ target: schema.tokenWhitelist.symbol });
      } catch (error) {
        console.error(`Error inserting token ${token.symbol} into whitelist:`, error);
      }
    }
    
    console.log("Database initialization completed");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}