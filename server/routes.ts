import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { walletSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeEthereumWallet } from "./services/ethereum";
import { analyzeSolanaWallet } from "./services/solana";
import { getPriceData } from "./services/prices";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to analyze a wallet
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate the request body
      const walletData = walletSchema.parse(req.body);
      
      // Call the appropriate service based on the chain
      if (walletData.chain === "ethereum") {
        const portfolioData = await analyzeEthereumWallet(walletData.address);
        res.json(portfolioData);
      } else if (walletData.chain === "solana") {
        const portfolioData = await analyzeSolanaWallet(walletData.address);
        res.json(portfolioData);
      } else {
        throw new Error("Unsupported blockchain");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid wallet data", errors: error.errors });
      } else {
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
      
      const priceHistory = await getPriceData([symbol], days);
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

  const httpServer = createServer(app);

  return httpServer;
}
