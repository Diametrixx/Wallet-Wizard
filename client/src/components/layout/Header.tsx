import React from 'react';
import { Link } from 'wouter';

const Header: React.FC = () => {
  return (
    <header className="relative z-10 border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <Link href="/">
          <div className="flex items-center mb-4 sm:mb-0 cursor-pointer">
            <div className="mr-3 bg-cyber-green p-2 rounded-lg">
              <i className="fas fa-wallet text-cyber-black text-xl"></i>
            </div>
            <h1 className="font-pixel text-xl tracking-wider text-cyber-green cyber-glow">WALLET WIZARD</h1>
          </div>
        </Link>
        
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-cyber-dark rounded-md border border-cyber-purple/30 text-cyber-purple text-sm transition hover:bg-cyber-purple/20">
            <i className="fas fa-question-circle mr-2"></i>Help
          </button>
          <button className="px-4 py-2 bg-cyber-dark rounded-md border border-cyber-green/30 text-cyber-green text-sm transition hover:bg-cyber-green/20">
            <i className="fas fa-info-circle mr-2"></i>About
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
