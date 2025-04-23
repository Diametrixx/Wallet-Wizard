import React, { useEffect, useState } from 'react';

interface LoadingViewProps {
  currentTask?: string;
  nextTask?: string;
  progress?: number;
}

const loadingMessages = [
  "Fetching wallet transactions...",
  "Analyzing token transfers...",
  "Calculating your paper hands moments...",
  "Determining your degen level...",
  "Generating your crypto persona...",
  "Almost there! Processing final results..."
];

const LoadingView: React.FC<LoadingViewProps> = ({ 
  currentTask = "Calculating your paper hands moments...",
  nextTask = "Evaluating your diamond hands potential...",
  progress = 0
}) => {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [statusMessage, setStatusMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (progress > 0) {
      setCurrentProgress(progress);
      
      // Update loading message based on progress
      const messageIndex = Math.min(
        Math.floor((progress / 100) * loadingMessages.length),
        loadingMessages.length - 1
      );
      setStatusMessage(loadingMessages[messageIndex]);
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="cyber-card w-full max-w-lg p-8 text-center glow-border">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto rounded-lg bg-cyber-purple/20 flex items-center justify-center">
            <i className="fas fa-robot text-cyber-purple text-4xl"></i>
          </div>
        </div>
        
        <h2 className="font-pixel text-xl text-cyber-green mb-6 cyber-glow">SUMMONING DATA</h2>
        
        <div className="w-full bg-cyber-black rounded-full h-4 mb-4 overflow-hidden border border-white/10">
          <div 
            className="bg-gradient-to-r from-cyber-green to-cyber-blue h-full transition-all duration-500 ease-in-out" 
            style={{ width: `${currentProgress}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-300 mb-8">{statusMessage}</p>
        
        <div className="flex justify-center space-x-2 mb-4">
          <div className="loading-pixel bg-cyber-green"></div>
          <div className="loading-pixel bg-cyber-blue" style={{ animationDelay: "0.2s" }}></div>
          <div className="loading-pixel bg-cyber-purple" style={{ animationDelay: "0.4s" }}></div>
          <div className="loading-pixel bg-cyber-pink" style={{ animationDelay: "0.6s" }}></div>
          <div className="loading-pixel bg-cyber-yellow" style={{ animationDelay: "0.8s" }}></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-cyber-dark/50 p-3 rounded-md text-left">
            <h4 className="text-xs font-bold mb-1 text-cyber-blue">CURRENT TASK</h4>
            <p className="text-xs text-gray-400">{currentTask}</p>
          </div>
          <div className="bg-cyber-dark/50 p-3 rounded-md text-left">
            <h4 className="text-xs font-bold mb-1 text-cyber-green">NEXT UP</h4>
            <p className="text-xs text-gray-400">{nextTask}</p>
          </div>
        </div>
      </div>
      
      <div className="cyber-card max-w-lg w-full p-4 mt-6 flex items-center glow-border">
        <div className="mr-3 text-cyber-yellow">
          <i className="fas fa-lightbulb"></i>
        </div>
        <p className="text-xs text-gray-300">This might take 20-30 seconds while we analyze your on-chain history.</p>
      </div>
    </div>
  );
};

export default LoadingView;
