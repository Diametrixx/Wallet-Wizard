import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, Bitcoin, Coins, Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { detectChain } from "@/lib/wallet-utils";
import WalletConnect from "./WalletConnect";
import { Separator } from "@/components/ui/separator";

type WalletInputProps = {
  onAnalyze: (address: string, chain: string) => void;
  error: string | null;
};

export default function WalletInput({ onAnalyze, error }: WalletInputProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState<"ethereum" | "solana" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    
    // Auto-detect chain
    if (address.length > 5) {
      const detectedChain = detectChain(address);
      if (detectedChain) {
        setSelectedChain(detectedChain);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text);
      
      // Auto-detect chain
      const detectedChain = detectChain(text);
      if (detectedChain) {
        setSelectedChain(detectedChain);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleAnalyze = () => {
    if (walletAddress && selectedChain) {
      onAnalyze(walletAddress, selectedChain);
    }
  };
  
  const handleWalletConnected = (address: string) => {
    setWalletAddress(address);
    setSelectedChain("solana");
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-float">
      <div className="cyber-card w-full max-w-lg p-8 mb-8 glow-border">
        <h2 className="font-pixel text-xl text-cyber-green mb-6 text-center cyber-glow">ENTER YOUR WALLET</h2>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-300">Wallet Address</label>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant={selectedChain === "ethereum" ? "default" : "outline"}
                className={selectedChain === "ethereum" 
                  ? "bg-cyber-blue text-black font-bold" 
                  : "bg-cyber-dark text-cyber-blue border-cyber-blue/30 hover:bg-cyber-blue/20"
                }
                onClick={() => setSelectedChain("ethereum")}
              >
                Ethereum
              </Button>
              <Button 
                size="sm"
                variant={selectedChain === "solana" ? "default" : "outline"}
                className={selectedChain === "solana" 
                  ? "bg-cyber-purple text-black font-bold" 
                  : "bg-cyber-dark text-cyber-purple border-cyber-purple/30 hover:bg-cyber-purple/20"
                }
                onClick={() => setSelectedChain("solana")}
              >
                Solana
              </Button>
            </div>
          </div>
          <div className="relative">
            <input 
              ref={inputRef}
              type="text" 
              className="w-full p-3 bg-cyber-black border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyber-green text-gray-200"
              placeholder="0x... or Solana wallet address"
              value={walletAddress}
              onChange={handleAddressChange}
            />
            <Button 
              variant="ghost" 
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyber-green transition"
              onClick={handlePaste}
            >
              <Clipboard size={16} />
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-400">We don't store your wallet address. All analysis happens client-side.</p>
        </div>
        
        <Button 
          className="w-full py-7 px-6 bg-gradient-to-r from-cyber-green to-cyber-blue text-cyber-black font-bold rounded-md hover:opacity-90 transition animate-pulse-glow font-pixel tracking-wider"
          disabled={!walletAddress || !selectedChain}
          onClick={handleAnalyze}
        >
          ANALYZE WALLET
        </Button>
        
        <div className="mt-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Separator className="flex-1 bg-gray-700" />
            <span className="text-sm text-gray-400">OR</span>
            <Separator className="flex-1 bg-gray-700" />
          </div>
          <WalletConnect onWalletConnected={handleWalletConnected} />
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="cyber-card p-3 text-center">
            <Wallet className="w-10 h-10 mx-auto mb-1 text-cyber-blue" />
            <p className="text-xs text-gray-300">Ethereum</p>
          </div>
          <div className="cyber-card p-3 text-center">
            <Coins className="w-10 h-10 mx-auto mb-1 text-cyber-purple" />
            <p className="text-xs text-gray-300">Solana</p>
          </div>
          <div className="cyber-card p-3 text-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 mx-auto mb-1 text-cyber-green">
              <path d="M12 17a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
              <path fillRule="evenodd" clipRule="evenodd" d="M7 10V7a5 5 0 0110 0v3a5.001 5.001 0 013 4.584V19a5.006 5.006 0 01-5 5H9a5.006 5.006 0 01-5-5v-4.416A5.001 5.001 0 017 10zm5-7a3 3 0 00-3 3v3h6V7a3 3 0 00-3-3zm5 10a3 3 0 01-3 3h-4a3 3 0 110-6h4a3 3 0 013 3z" fill="currentColor" />
            </svg>
            <p className="text-xs text-gray-300">Others</p>
          </div>
        </div>
      </div>

      <div className="cyber-card w-full max-w-lg p-6 glow-border">
        <h3 className="font-pixel text-cyber-yellow text-sm mb-4">HOW IT WORKS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyber-dark/50 p-4 rounded-md">
            <div className="text-cyber-green text-lg mb-2">
              <Wallet size={20} />
            </div>
            <h4 className="text-sm font-bold mb-1">Enter Address</h4>
            <p className="text-xs text-gray-400">Paste your Ethereum or Solana wallet address</p>
          </div>
          <div className="bg-cyber-dark/50 p-4 rounded-md">
            <div className="text-cyber-blue text-lg mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h4 className="text-sm font-bold mb-1">AI Analysis</h4>
            <p className="text-xs text-gray-400">We analyze your tokens, DeFi activity, and P&L</p>
          </div>
          <div className="bg-cyber-dark/50 p-4 rounded-md">
            <div className="text-cyber-pink text-lg mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
            <h4 className="text-sm font-bold mb-1">Get Results</h4>
            <p className="text-xs text-gray-400">View your performance with meme-worthy insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
