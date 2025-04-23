import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, Portfolio } from "@shared/schema";
import { detectChain } from "@/lib/wallet-utils";

export function useWallet(address: string) {
  const [chain, setChain] = useState<"ethereum" | "solana" | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Detect blockchain from address format
  useEffect(() => {
    if (address) {
      const detectedChain = detectChain(address);
      setChain(detectedChain);
      setIsValidAddress(!!detectedChain);
    } else {
      setChain(null);
      setIsValidAddress(false);
    }
  }, [address]);

  // Fetch portfolio data if we have a valid address and detected chain
  const { data, isLoading, error } = useQuery<Portfolio>({
    queryKey: [`/api/analyze`, address],
    enabled: !!address && !!chain && isValidAddress,
    queryFn: async () => {
      if (!chain) return null;
      
      const res = await apiRequest("POST", "/api/analyze", { 
        address, 
        chain 
      });
      
      return await res.json();
    }
  });

  return {
    wallet: { address, chain } as Wallet,
    portfolio: data,
    isLoading,
    error,
    isValidAddress
  };
}
