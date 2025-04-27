import { useState } from 'react';
import axios from 'axios';
import { Portfolio } from '@shared/schema';

interface UseWalletAnalysisProps {
  initialAddress?: string;
}

interface UseWalletAnalysisResult {
  address: string;
  setAddress: (address: string) => void;
  chain: 'ethereum' | 'solana' | 'unknown';
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  analyzeWallet: (forceRefresh?: boolean) => Promise<void>;
  resetError: () => void;
}

export default function useWalletAnalysis({ initialAddress = '' }: UseWalletAnalysisProps = {}): UseWalletAnalysisResult {
  const [address, setAddress] = useState<string>(initialAddress);
  const [chain, setChain] = useState<'ethereum' | 'solana' | 'unknown'>('unknown');
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      
      // Use our new enhanced wallet analysis endpoint
      const response = await axios.post('/api/analyze', {
        address,
        chain: detectedChain,
        forceRefresh
      });
      
      setPortfolio(response.data);
      
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

  return {
    address,
    setAddress,
    chain,
    portfolio,
    loading,
    error,
    analyzeWallet,
    resetError
  };
}