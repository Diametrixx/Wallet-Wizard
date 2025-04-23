import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { walletSchema, type Portfolio } from "@shared/schema";
import { z } from "zod";
import { analyzeEthereumWallet } from "./services/ethereum";
import { analyzeSolanaWallet } from "./services/solana";
import { getPriceData } from "./services/prices";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  try {
    const { initializeDatabase } = await import('./db');
    await initializeDatabase();
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }

  // API endpoint to analyze a wallet
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate the request body
      const walletData = walletSchema.parse(req.body);
      
      // Import storage to check cache
      const { storage } = await import('./storage');
      
      // Check for cached data first
      console.log(`Checking cache for wallet ${walletData.address} on ${walletData.chain} chain`);
      const cachedPortfolio = await storage.getPortfolioByWalletAddress(
        walletData.address, 
        walletData.chain
      );
      
      // If we have cached data, check if we should use it or force a refresh
      const forceRefresh = req.query.forceRefresh === 'true';
      if (cachedPortfolio && !forceRefresh) {
        console.log(`Found cached portfolio data for ${walletData.address}, using it`);
        return res.json(cachedPortfolio);
      } else if (cachedPortfolio && forceRefresh) {
        console.log(`Found cached data but force refresh requested for ${walletData.address}`);
      }
      
      console.log(`No cached data found for ${walletData.address}, analyzing wallet`);
      
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
        res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      } else {
        console.error('Error analyzing wallet:', error);
        res.status(500).json({ message: (error as Error).message || "An error occurred analyzing the wallet" });
      }
    }
  });

  // API endpoint to get price data for tokens
  app.get("/api/prices", async (req, res) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ message: "No symbols provided" });
      }
      
      const symbolArray = symbols.split(",");
      const priceData = await getPriceData(symbolArray);
      res.json(priceData);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message || "Failed to fetch price data" });
    }
  });

  // API endpoint to get price history for a token
  app.get("/api/price-history/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }
      
      const priceHistory = await getPriceData([symbol], undefined, days);
      res.json(priceHistory);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message || "Failed to fetch price history" });
    }
  });

  // Detect wallet chain from address
  app.post("/api/detect-chain", (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }
      
      // Simple detection based on address format
      if (address.startsWith("0x") && address.length === 42) {
        return res.json({ chain: "ethereum" });
      } else if ((address.length === 44 || address.length === 43) && 
                !/^0x/.test(address)) {
        return res.json({ chain: "solana" });
      } else {
        return res.json({ chain: "unknown" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message || "Failed to detect chain" });
    }
  });
  
  // Clear cache for a wallet (useful for testing)
  app.post("/api/clear-cache", async (req, res) => {
    try {
      const { address, chain } = req.body;
      
      if (!address || !chain) {
        return res.status(400).json({ message: "Address and chain are required" });
      }
      
      // Import storage
      const { storage } = await import('./storage');
      
      // Clear cache for the wallet
      await storage.clearCacheForWallet(address, chain);
      
      return res.json({ 
        success: true, 
        message: `Cache cleared for wallet ${address} on ${chain} chain` 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: (error as Error).message || "Failed to clear cache" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
