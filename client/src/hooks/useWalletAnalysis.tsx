import { useState } from 'react';
import axios from 'axios';
import { Portfolio } from '@shared/schema';

interface UseWalletAnalysisProps {
  initialAddress?: string;
  initialTimeFrame?: "all" | "year" | "sixMonths" | "threeMonths";
}

interface UseWalletAnalysisResult {
  address: string;
  setAddress: (address: string) => void;
  chain: 'ethereum' | 'solana' | 'unknown';
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  timeFrame: "all" | "year" | "sixMonths" | "threeMonths";
  setTimeFrame: (timeFrame: "all" | "year" | "sixMonths" | "threeMonths") => void;
  analyzeWallet: (forceRefresh?: boolean) => Promise<void>;
  resetError: () => void;
}

export default function useWalletAnalysis({ 
  initialAddress = '', 
  initialTimeFrame = 'all' 
}: UseWalletAnalysisProps = {}): UseWalletAnalysisResult {
  const [address, setAddress] = useState<string>(initialAddress);
  const [chain, setChain] = useState<'ethereum' | 'solana' | 'unknown'>('unknown');
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<"all" | "year" | "sixMonths" | "threeMonths">(initialTimeFrame);

  // Reset error state
  const resetError = () => {
    setError(null);
  };

  // Detect chain from address
  const detectChain = async (address: string): Promise<'ethereum' | 'solana' | 'unknown'> => {
    try {
      const response = await axios.post('/api/detect-chain', { address });
      return response.data.chain;
    } catch (error) {
      console.error('Error detecting chain:', error);
      return 'unknown';
    }
  };

  // Analyze wallet with performance tracking
  const analyzeWallet = async (forceRefresh: boolean = false) => {
    resetError();
    
    if (!address) {
      setError('Please enter a wallet address');
      return;
    }

    setLoading(true);
    
    try {
      // First detect the chain
      const detectedChain = await detectChain(address);
      setChain(detectedChain);
      
      if (detectedChain === 'unknown') {
        setError('Invalid wallet address format');
        setLoading(false);
        return;
      }
      
      // Use our new enhanced wallet analysis endpoint with time frame
      const response = await axios.post('/api/analyze', {
        address,
        chain: detectedChain,
        forceRefresh,
        timeFrame // Include current time frame selection
      });
      
      setPortfolio(response.data);
      
      // Update local time frame to match what was returned from API
      if (response.data.selectedTimeFrame) {
        setTimeFrame(response.data.selectedTimeFrame);
      }
      
    } catch (error: any) {
      console.error('Error analyzing wallet:', error);
      
      // Extract the most useful error message
      let errorMessage = 'Failed to analyze wallet';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // Effect to update portfolio with new time frame
  const updateTimeFrame = (newTimeFrame: "all" | "year" | "sixMonths" | "threeMonths") => {
    setTimeFrame(newTimeFrame);
    
    // If we have a portfolio, update its selected time frame
    if (portfolio) {
      setPortfolio({
        ...portfolio,
        selectedTimeFrame: newTimeFrame
      });
    }
  };

  return {
    address,
    setAddress,
    chain,
    portfolio,
    loading,
    error,
    timeFrame,
    setTimeFrame: updateTimeFrame,
    analyzeWallet,
    resetError
  };
}