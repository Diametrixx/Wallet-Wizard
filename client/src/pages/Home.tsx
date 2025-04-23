import { useState } from "react";
import WalletInput from "@/components/WalletInput";
import LoadingScreen from "@/components/LoadingScreen";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { walletSchema } from "@shared/schema";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing wallet analysis...");
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  // Simulate a loading sequence with different messages
  const loadingMessages = [
    "Fetching wallet transactions...",
    "Analyzing token transfers...",
    "Calculating your paper hands moments...",
    "Determining your degen level...",
    "Generating your crypto persona...",
    "Almost there! Processing final results..."
  ];

  const startLoading = () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setLoadingProgress(progress);
      
      // Update loading message based on progress
      const messageIndex = Math.floor(progress / 20) % loadingMessages.length;
      setLoadingStatus(loadingMessages[messageIndex]);
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const analyzeWallet = async (address: string, chain: string) => {
    try {
      startLoading();
      
      // Validate wallet data
      const walletData = walletSchema.parse({ address, chain });
      
      // Call the API to analyze the wallet
      await apiRequest("POST", "/api/analyze", walletData);
      
      // Redirect to the dashboard page
      setTimeout(() => {
        setIsLoading(false);
        setLocation(`/dashboard/${address}`);
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to analyze wallet");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {isLoading ? (
        <LoadingScreen 
          progress={loadingProgress} 
          status={loadingStatus} 
        />
      ) : (
        <WalletInput 
          onAnalyze={analyzeWallet} 
          error={error}
        />
      )}
    </div>
  );
}
