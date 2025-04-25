import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { walletSchema, type Portfolio } from "@shared/schema";
import { z } from "zod";
import { analyzeEthereumWallet } from "./services/ethereum";
import { analyzeSolanaWallet } from "./services/solana";
import { getPriceData } from "./services/prices";
import axios from "axios"; // Import axios for making HTTP requests
import { db } from "./db"; // ✅ connects you to the database
import {
  enrichedTransactions,
  tokenHoldings,
  tokenPrices,
} from "@shared/schema"; // ✅ your table definitions
import { historicalTokenPrices } from "@shared/schema"; // Import the historicalTokenPrices table

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  try {
    const { initializeDatabase } = await import("./db");
    await initializeDatabase();
    console.log("Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
  }

  // API endpoint to analyze a wallet

  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate the request body with possible forceRefresh parameter
      const { address, chain, forceRefresh } = req.body;
      const walletData = walletSchema.parse({ address, chain });

      // Import storage to check cache
      const { storage } = await import("./storage");

      // If forceRefresh is true, clear the cache for this wallet
      if (forceRefresh) {
        console.log(
          `Force refresh requested for ${walletData.address}, clearing cache`,
        );
        await storage.clearCacheForWallet(walletData.address, walletData.chain);
      } else {
        // Check for cached data first
        console.log(
          `Checking cache for wallet ${walletData.address} on ${walletData.chain} chain`,
        );
        const cachedPortfolio = await storage.getPortfolioByWalletAddress(
          walletData.address,
          walletData.chain,
        );

        // If we have cached data and not forcing refresh, use it
        if (cachedPortfolio) {
          console.log(
            `Found cached portfolio data for ${walletData.address}, using it`,
          );
          return res.json(cachedPortfolio);
        }
      }

      console.log(
        `No cached data found for ${walletData.address}, analyzing wallet`,
      );

      // Call the appropriate service based on the chain
      let portfolioData: Portfolio;

      if (walletData.chain === "ethereum") {
        portfolioData = await analyzeEthereumWallet(walletData.address);
      } else if (walletData.chain === "solana") {
        portfolioData = await analyzeSolanaWallet(walletData.address);
      } else {
        throw new Error("Unsupported blockchain");
      }

      // Save the portfolio data to cache
      await storage.savePortfolio(portfolioData);

      res.json(portfolioData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid wallet data", errors: error.errors });
      } else {
        console.error("Error analyzing wallet:", error);
        res
          .status(500)
          .json({
            message:
              (error as Error).message ||
              "An error occurred analyzing the wallet",
          });
      }
    }
  });

  //NEW SHIT FROM CHATGPT------------------------------------------------------
  app.post("/api/audit-wallet", async (req, res) => {
    const parsed = z
      .object({
        address: z.string().min(32, "Invalid wallet address"),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const walletAddress = parsed.data.address;
    console.log(`\ud83d\udd0d Auditing wallet: ${walletAddress}`);

    try {
      const allSignatures: string[] = [];
      let before: string | null = null;
      let done = false;

      while (!done && allSignatures.length < 1000) {
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [
            walletAddress,
            { limit: 1000, ...(before ? { before } : {}) },
          ],
        };

        const resp = await axios.post(
          `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
          payload,
        );

        // ✋ Check for errors before doing anything else
        if (resp.data.error) {
          console.error(`❌ Helius RPC Error:`, resp.data.error.message);
          break; // 💥 Exit early if there is an error
        }

        const result = resp.data.result;

        console.log(`🧾 Fetched ${result.length} signatures`);


        
        console.log(`\ud83d\udfbe Fetched ${result.length} signatures`);

        if (!result || result.length === 0) break;

        const sigs = result.map((tx: any) => tx.signature);
        allSignatures.push(...sigs);
        before = result[result.length - 1].signature;

        if (sigs.length < 1000) done = true;
      }

      console.log(`\ud83d\udfbe Total signatures fetched: ${allSignatures.length}`);

      const IGNORED_MINTS = new Set([
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      ]);

      const failedPrices = new Set();

      const enriched: any[] = [];
      const CHUNK_SIZE = 100;

      for (let i = 0; i < allSignatures.length; i += CHUNK_SIZE) {
        const chunk = allSignatures.slice(i, i + CHUNK_SIZE);
        const response = await axios.post(
          `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`,
          { transactions: chunk },
        );

        if (response.status !== 200) {
          console.error(`\u274c Failed enriching chunk ${i / CHUNK_SIZE + 1}:`, response.statusText);
          continue;
        }

        enriched.push(...response.data);
        console.log(`\u2705 Enriched ${chunk.length} txs`);
      }

      for (const tx of enriched) {
        const timestamp = tx.timestamp * 1000;
        const transfers = tx.tokenTransfers || [];

        for (const transfer of transfers) {
          const { mint, amount, fromUserAccount, toUserAccount } = transfer;
          const symbol = transfer.tokenSymbol || "UNKNOWN";

          if (IGNORED_MINTS.has(mint)) {
            continue;
          }

          if (
            fromUserAccount !== walletAddress &&
            toUserAccount !== walletAddress
          ) continue;

          const direction = toUserAccount === walletAddress ? "in" : "out";
          let usdPrice = 0;

          try {
            const priceResp = await axios.get(
              `https://price.jup.ag/v4/price?ids=${mint}`
            );
            usdPrice = priceResp.data?.data?.[mint]?.price || 0;
          } catch (err) {
            console.warn(`\u26a0\ufe0f Jupiter failed for ${mint}`);
          }

          if (usdPrice === 0) {
            try {
              const geckoResp = await axios.get(
                `https://api.coingecko.com/api/v3/simple/token_price/solana`,
                {
                  params: {
                    contract_addresses: mint,
                    vs_currencies: "usd",
                    x_cg_pro_api_key: process.env.COINGECKO_API_KEY,
                  }
                }
              );
              usdPrice = geckoResp.data?.[mint.toLowerCase()]?.usd || 0;
              if (usdPrice === 0) {
                failedPrices.add(mint); // ✅ collect for final report
              }

              if (usdPrice) {
                console.log(`\ud83d\udcb0 Fallback price from CoinGecko for ${mint}: $${usdPrice}`);
              }
            } catch (err) {
              console.warn(`\u26a0\ufe0f CoinGecko also failed for ${mint}`);
            }
          }

          if (usdPrice === 0) {
            failedPrices.add(mint);
          }

          const usdValue = usdPrice * Number(amount);

          await db.insert(enrichedTransactions).values({
            walletAddress,
            signature: tx.signature,
            tokenSymbol: symbol,
            tokenMint: mint,
            amount: Number(amount),
            direction,
            usdValue,
            timestamp: new Date(timestamp),
          });
          // ✅ Optional: skip logging every time a price fails
          if (failedPrices.has(mint)) {
            console.warn(`⚠️ Price missing for token mint: ${mint}`);
          }

        }
      }

      if (failedPrices.size > 0) {
        console.warn("\ud83d\udeaf Tokens with no price data:", [...failedPrices].join(", "));
      }

      console.log("\u2705 All transactions enriched and saved.");
      res.status(200).json({
        message: "Wallet audit complete",
        count: allSignatures.length,
      });
    } catch (err) {
      console.error("\u274c Wallet audit failed:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  const httpServer = createServer(app);

  return httpServer;
}
