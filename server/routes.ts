// server/routes.ts

import type { Express } from "express";
import { createServer, type Server } from "http";
import { refreshCoinGeckoMappingEvery24Hours } from "./services/coinGeckoAutoRefresh";
import { auditWallet } from "./services/walletAudit";
import { analyzeWalletPerformance } from "./services/walletAnalyzer";
import { walletSchema, Portfolio } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await refreshCoinGeckoMappingEvery24Hours();

  // API endpoint to detect the chain type from an address
  app.post("/api/detect-chain", async (req, res) => {
    try {
      // Validate the request body
      const address = req.body.address;
      
      if (!address) {
        return res.status(400).json({ 
          message: "Address is required",
          chain: "unknown"
        });
      }
      
      // Detect the chain from the address format
      let chain = "unknown";
      
      // Ethereum address format: 0x followed by 40 hex characters
      if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
        chain = "ethereum";
      }
      // Solana address: base58 encoded, 32-44 characters, not starting with 0x
      else if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        chain = "solana";
      }
      
      return res.json({ chain });
    } catch (error) {
      console.error("Error detecting chain:", error);
      res.status(500).json({ 
        message: "An error occurred detecting the chain",
        chain: "unknown"
      });
    }
  });

  // API endpoint to analyze a wallet with improved performance tracking
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate the request body with possible forceRefresh parameter and time frame
      const { address, chain, forceRefresh, timeFrame } = req.body;
      const walletData = walletSchema.parse({ address, chain });
      
      // Get time frame from query parameter or request body
      const selectedTimeFrame = (req.query.timeFrame || timeFrame || "all") as "all" | "year" | "sixMonths" | "threeMonths";
      
      // Import storage to check cache
      const { storage } = await import("./storage");
      
      // If forceRefresh is true, clear the cache for this wallet
      if (forceRefresh) {
        console.log(`Force refresh requested for ${walletData.address}, clearing cache`);
        await storage.clearCacheForWallet(walletData.address, walletData.chain);
      } else {
        // Check for cached data first
        console.log(`Checking cache for wallet ${walletData.address} on ${walletData.chain} chain`);
        const cachedPortfolio = await storage.getPortfolioByWalletAddress(
          walletData.address,
          walletData.chain
        );
        
        // If we have cached data and not forcing refresh, use it
        if (cachedPortfolio) {
          console.log(`Found cached portfolio data for ${walletData.address}, using it`);
          
          // Update the selected time frame if specified
          if (selectedTimeFrame && selectedTimeFrame !== cachedPortfolio.selectedTimeFrame) {
            console.log(`Updating selected time frame to ${selectedTimeFrame}`);
            cachedPortfolio.selectedTimeFrame = selectedTimeFrame;
          }
          
          return res.json(cachedPortfolio);
        }
      }
      
      console.log(`No cached data found for ${walletData.address}, analyzing wallet with enhanced performance tracking`);
      
      // Call the appropriate service based on the chain
      let portfolioData: Portfolio;
      
      if (walletData.chain === "solana") {
        // Use our new enhanced wallet analyzer for Solana
        portfolioData = await analyzeWalletPerformance(walletData.address);
        
        // Set the selected time frame
        portfolioData.selectedTimeFrame = selectedTimeFrame;
      } else {
        throw new Error("Only Solana chain is currently supported with enhanced performance tracking");
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

  // API endpoint for the raw wallet audit (useful for troubleshooting and development)
  app.post("/api/audit-wallet", async (req, res) => {
    try {
      const result = await auditWallet(req.body.address);
      res.status(200).json(result);
    } catch (err) {
      console.error("\u274C Wallet audit failed:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
