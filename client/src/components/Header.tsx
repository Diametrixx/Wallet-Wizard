import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="relative z-10 border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <Link href="/">
          <div className="flex items-center mb-4 sm:mb-0 cursor-pointer">
            <div className="mr-3 bg-cyber-green p-2 rounded-lg">
              <Wallet className="text-cyber-black" size={20} />
            </div>
            <h1 className="font-pixel text-xl tracking-wider text-cyber-green cyber-glow">WALLET WIZARD</h1>
          </div>
        </Link>
      
      </div>
    </header>
  );
}
