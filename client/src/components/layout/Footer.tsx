import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 py-6 text-center text-gray-400 text-sm mt-8">
      <div className="container mx-auto px-4">
        <p className="mb-2">Wallet Wizard - Crypto Analysis Tool</p>
        <p className="text-xs">We don't store your data. All analysis happens in your browser.</p>
        <div className="flex justify-center mt-4 space-x-4">
          <a href="#" className="text-gray-400 hover:text-cyber-green transition">
            <i className="fab fa-github"></i>
          </a>
          <a href="#" className="text-gray-400 hover:text-cyber-green transition">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="text-gray-400 hover:text-cyber-green transition">
            <i className="fab fa-discord"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
