import React from 'react';
import { Link } from 'wouter';

interface ActionButtonsProps {
  walletAddress?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ walletAddress }) => {
  const handleDownload = () => {
    // Implementation for downloading report
    alert("Download functionality would be implemented here");
  };

  const handleShare = () => {
    // Implementation for sharing results
    if (navigator.share) {
      navigator.share({
        title: 'My Wallet Wizard Analysis',
        text: 'Check out my crypto portfolio analysis!',
        url: window.location.href,
      })
      .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("Link copied to clipboard!"))
        .catch(console.error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
      <button 
        className="py-3 px-6 bg-cyber-dark border border-cyber-green/30 text-cyber-green rounded-md hover:bg-cyber-green/20 transition font-pixel tracking-wider"
        onClick={handleDownload}
      >
        <i className="fas fa-download mr-2"></i> DOWNLOAD REPORT
      </button>
      <button 
        className="py-3 px-6 bg-cyber-dark border border-cyber-blue/30 text-cyber-blue rounded-md hover:bg-cyber-blue/20 transition font-pixel tracking-wider"
        onClick={handleShare}
      >
        <i className="fas fa-share-alt mr-2"></i> SHARE RESULTS
      </button>
      <Link href="/">
        <button className="py-3 px-6 bg-cyber-purple text-white rounded-md hover:bg-cyber-purple/80 transition font-pixel tracking-wider">
          <i className="fas fa-search mr-2"></i> ANALYZE NEW WALLET
        </button>
      </Link>
    </div>
  );
};

export default ActionButtons;
