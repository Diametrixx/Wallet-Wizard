import { useState } from "react";

interface MemeSummaryProps {
  memeRank: string;
  memeSummary: string;
  memeImage: string;
}

// Predefined meme personas that will be assigned based on portfolio performance
const memePersonas = [
  {
    title: "DIAMOND HANDS",
    description: "You've held through crashes that would make paper hands cry",
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.svg"
  },
  {
    title: "DEFI CHAD",
    description: "You've mastered yield farming and liquidity pools",
    image: "https://cryptologos.cc/logos/uniswap-uni-logo.svg"
  },
  {
    title: "MEMECOIN ENJOYER",
    description: "Can't resist a good doggy coin or pepe token",
    image: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg"
  }
];

export default function MemeSummary({ memeRank, memeSummary, memeImage }: MemeSummaryProps) {
  return (
    <div className="cyber-card p-6 mb-6 text-center glow-border">
      <h3 className="font-pixel text-lg text-cyber-yellow mb-4 cyber-glow">YOUR CRYPTO PERSONA</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {memePersonas.map((persona, index) => (
          <div key={index} className="bg-cyber-dark/70 p-4 rounded-lg border border-white/10">
            <img 
              src={index === 0 ? memeImage : persona.image} 
              alt={persona.title} 
              className="w-16 h-16 mx-auto rounded-md mb-2" 
            />
            <h4 className={`text-${index === 0 ? 'cyber-green' : index === 1 ? 'cyber-blue' : 'cyber-purple'} text-sm font-bold mb-1`}>
              {index === 0 ? memeRank : persona.title}
            </h4>
            <p className="text-xs text-gray-400">
              {index === 0 ? memeSummary.substring(0, 60) + "..." : persona.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="cyber-card bg-gradient-to-r from-cyber-dark/80 to-cyber-black/80 p-6 rounded-xl border border-white/10 max-w-2xl mx-auto">
        <p className="text-base">
          You are the <span className="font-bold text-cyber-green">{memeRank}</span>, {memeSummary}
        </p>
      </div>
    </div>
  );
}
