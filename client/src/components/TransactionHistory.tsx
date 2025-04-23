import { Transaction } from "@shared/schema";
import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatAddress, getTransactionTypeInfo } from "@/lib/wallet-utils";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  // Display only the 3 most recent transactions
  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className="font-pixel text-sm text-white mb-4">RECENT TRANSACTIONS</h3>
      
      <div className="space-y-3">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx, index) => {
            const { iconName, bgColor, color } = getTransactionTypeInfo(tx.type);
            const timeAgo = new Date(tx.timestamp).toLocaleDateString();
            
            return (
              <div key={index} className="flex items-center p-2 bg-cyber-dark/70 rounded-md border border-white/5">
                <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-3`}>
                  {iconName === "arrow-up" && <ArrowUp size={16} className={color} />}
                  {iconName === "arrow-down" && <ArrowDown size={16} className={color} />}
                  {iconName === "refresh-cw" && <RefreshCw size={16} className={color} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm">
                      {tx.type === "send" && "Sent "}
                      {tx.type === "receive" && "Received "}
                      {tx.type === "swap" && "Swapped "}
                      {tx.type === "stake" && "Staked "}
                      {tx.type === "unstake" && "Unstaked "}
                      {tx.type === "other" && ""}
                      {tx.tokenSymbol}
                    </span>
                    <span className="text-sm font-mono">
                      {tx.amount} {tx.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{timeAgo}</span>
                    <span>
                      {tx.type === "send" && `To: ${formatAddress(tx.toAddress || '')}`}
                      {tx.type === "receive" && `From: ${formatAddress(tx.fromAddress)}`}
                      {tx.type === "swap" && (tx.platformName || "Unknown platform")}
                      {tx.type === "stake" && "Staking contract"}
                      {tx.type === "unstake" && "Staking contract"}
                      {tx.type === "other" && formatAddress(tx.fromAddress)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p>No transaction history available</p>
          </div>
        )}
      </div>
      
      {transactions.length > 3 && (
        <Button 
          variant="outline" 
          className="w-full mt-4 py-2 text-xs text-gray-300 border-white/10 hover:bg-white/5"
        >
          View All Transactions
        </Button>
      )}
    </div>
  );
}
