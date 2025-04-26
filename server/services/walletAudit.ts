// server/services/walletAudit.ts

import axios from "axios";
import { db } from "../db";
import { enrichedTransactions } from "@shared/schema";
import { coinGeckoMapping } from "./coinGeckoMap";
import { fetchSignatures, getHeliusTokenMetadata } from "./helius";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function auditWallet(address: string) {
  console.log(`🔎 Auditing wallet: ${address}`);

  const allSignatures = await fetchSignatures(address);
  console.log(`📊 Total signatures fetched: ${allSignatures.length}`);

  const enriched: any[] = [];
  const CHUNK_SIZE = 100;

  for (let i = 0; i < allSignatures.length; i += CHUNK_SIZE) {
    const chunk = allSignatures.slice(i, i + CHUNK_SIZE);
    const response = await axios.post(`https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`, { transactions: chunk });
    if (response.status === 200) enriched.push(...response.data);
  }

  console.log(`✅ ${enriched.length} transactions enriched`);

  const deadTokens = new Set();
  const otherTokens = new Set();
  const failedPrices = new Set();

  const IGNORED_MINTS = new Set([
    "So11111111111111111111111111111111111111112", // SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  ]);

  for (const tx of enriched) {
    const timestamp = tx.timestamp * 1000;
    const transfers = tx.tokenTransfers || [];

    for (const transfer of transfers) {
      const { mint, amount, fromUserAccount, toUserAccount } = transfer;
      const symbol = transfer.tokenSymbol || "UNKNOWN";

      if (IGNORED_MINTS.has(mint)) continue;
      if (fromUserAccount !== address && toUserAccount !== address) continue;

      const direction = toUserAccount === address ? "in" : "out";
      let usdPrice = 0;
      let classification = "active";

      const cached = coinGeckoMapping[mint];
      if (cached?.price) {
        usdPrice = cached.price;
      } else {
        const metadata = await getHeliusTokenMetadata(mint);
        if (metadata) {
          if (metadata.marketCap < 80000 || metadata.holderCount < 20) {
            classification = "other";
          } else {
            classification = "dead";
          }
        } else {
          classification = "other";
        }
      }

      if (classification === "dead") deadTokens.add(mint);
      if (classification === "other") otherTokens.add(mint);

      const usdValue = usdPrice * Number(amount);

      await db.insert(enrichedTransactions).values({
        walletAddress: address,
        signature: tx.signature,
        tokenSymbol: symbol,
        tokenMint: mint,
        amount: Number(amount),
        direction,
        usdValue,
        timestamp: new Date(timestamp),
      });

      if (usdPrice === 0) failedPrices.add(mint);
    }
  }

  console.log(`\n💀 Dead tokens:`, [...deadTokens].join(", "));
  console.log(`🧰 Other tokens:`, [...otherTokens].join(", "));
  if (failedPrices.size > 0) {
    console.warn("🚦 Tokens with no price data:", [...failedPrices].join(", "));
  }
  console.log("✅ Wallet audit complete!");
}
