import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isPhantomInstalled, connectPhantom, disconnectPhantom, getSolBalance } from "@/lib/phantom-wallet";
import { Wallet } from "lucide-react";

interface WalletConnectProps {
  onWalletConnected: (address: string) => void;
}

export default function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Phantom is installed
    setIsSupported(isPhantomInstalled());
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      if (!isPhantomInstalled()) {
        toast({
          title: "Wallet Not Found",
          description: "Please install Phantom wallet extension.",
          variant: "destructive",
        });
        return;
      }
      
      const address = await connectPhantom();
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.substring(0, 4)}...${address.substring(address.length - 4)}`,
      });
      
      onWalletConnected(address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const openPhantomStore = () => {
    window.open('https://phantom.app/', '_blank');
  };

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      {isSupported ? (
        <Button 
          variant="outline" 
          className="w-full border border-cyber-blue hover:bg-cyber-blue/20 hover:text-cyber-blue/80 transition-all" 
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting ? "Connecting..." : "Connect Phantom Wallet"}
        </Button>
      ) : (
        <Button 
          variant="outline" 
          className="w-full border border-gray-500 hover:bg-gray-700" 
          onClick={openPhantomStore}
        >
          <Wallet className="w-4 h-4 mr-2" />
          Get Phantom Wallet
        </Button>
      )}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Connect your wallet for faster & more accurate valuation
      </p>
    </div>
  );
}