import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { calculatePerformanceLevel } from '@/lib/utils';
import type { PortfolioData } from '@/components/Dashboard';

interface UseWalletAnalysisProps {
  walletAddress: string;
}

export const useWalletAnalysis = ({ walletAddress }: UseWalletAnalysisProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Fetching wallet transactions...");
  const [nextTask, setNextTask] = useState("Analyzing token transfers...");
  const [error, setError] = useState<string | null>(null);
  
  // Query wallet data from API
  const { data, isError, isSuccess } = useQuery({
    queryKey: [`/api/wallet/${walletAddress}`],
    enabled: !!walletAddress,
    retry: 1,
  });

  // Simulate loading progress
  useEffect(() => {
    if (!walletAddress) return;
    
    let progressInterval: NodeJS.Timeout;
    
    // Start simulating progress if we're still loading
    if (isLoading && !isSuccess && !isError) {
      let currentProgress = 0;
      const tasks = [
        { current: "Fetching wallet transactions...", next: "Analyzing token transfers..." },
        { current: "Analyzing token transfers...", next: "Calculating your paper hands moments..." },
        { current: "Calculating your paper hands moments...", next: "Determining your degen level..." },
        { current: "Determining your degen level...", next: "Generating your crypto persona..." },
        { current: "Generating your crypto persona...", next: "Almost there! Processing final results..." }
      ];

      progressInterval = setInterval(() => {
        currentProgress += 2;
        
        // Update task messages based on progress
        const taskIndex = Math.min(Math.floor(currentProgress / 20), tasks.length - 1);
        setCurrentTask(tasks[taskIndex].current);
        setNextTask(tasks[taskIndex].next);
        
        setProgress(currentProgress);
        
        if (currentProgress >= 95) {
          clearInterval(progressInterval);
        }
      }, 200);
    }
    
    // If data loaded successfully, jump to 100%
    if (isSuccess) {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
    
    // If error occurred, stop at current progress
    if (isError) {
      clearInterval(progressInterval);
      setError("Failed to analyze wallet. Please check the address and try again.");
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [walletAddress, isLoading, isSuccess, isError]);

  // Process the data when it's available
  const processedData: PortfolioData | null = data ? {
    ...data,
    performance: calculatePerformanceLevel(data.percentChange),
  } : null;

  return {
    isLoading,
    progress,
    currentTask,
    nextTask,
    error,
    data: processedData,
  };
};
