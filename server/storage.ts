import { 
  users, type User, type InsertUser,
  type Transaction, type Token, type Portfolio, type Wallet
} from "@shared/schema";

// Storage interface for all models
export interface IStorage {
  // User methods (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolio cache methods
  getPortfolioByWalletAddress(walletAddress: string): Promise<Portfolio | undefined>;
  savePortfolio(walletAddress: string, portfolio: Portfolio): Promise<Portfolio>;
}

// Extended Transaction type that includes wallet address for storage
interface StoredTransaction extends Transaction {
  id: number;
  walletAddress: string;
}

// Extended Token type that includes wallet address for storage
interface StoredToken extends Token {
  id: number;
  walletAddress: string;
}

// Portfolio with ID for storage
interface StoredPortfolio extends Portfolio {
  id: number;
  walletAddress: string;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<string, StoredPortfolio>;
  private userId: number;
  private portfolioId: number;

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.userId = 1;
    this.portfolioId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Portfolio methods
  async getPortfolioByWalletAddress(walletAddress: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(walletAddress);
  }

  async savePortfolio(walletAddress: string, portfolio: Portfolio): Promise<Portfolio> {
    const id = this.portfolioId++;
    const storedPortfolio: StoredPortfolio = { 
      ...portfolio, 
      id, 
      walletAddress 
    };
    
    this.portfolios.set(walletAddress, storedPortfolio);
    return portfolio;
  }
}

export const storage = new MemStorage();
