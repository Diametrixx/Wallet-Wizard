import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface LoadingScreenProps {
  progress: number;
  status: string;
}

export default function LoadingScreen({ progress, status }: LoadingScreenProps) {
  const loadingTasks = [
    { current: progress < 30, title: "CURRENT TASK", text: "Fetching wallet transactions..." },
    { current: progress >= 30 && progress < 60, title: "CURRENT TASK", text: "Calculating your paper hands moments..." },
    { current: progress >= 60 && progress < 90, title: "CURRENT TASK", text: "Evaluating your diamond hands potential..." },
    { current: progress >= 90, title: "CURRENT TASK", text: "Generating your crypto persona..." },
  ];

  const currentTask = loadingTasks.find(task => task.current) || loadingTasks[0];
  const nextTask = loadingTasks.find((task, index) => {
    const currentIndex = loadingTasks.findIndex(t => t.current);
    return index === currentIndex + 1;
  });

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="cyber-card w-full max-w-lg p-8 text-center glow-border">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-cyber-dark rounded-lg flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-cyber-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        
        <h2 className="font-pixel text-xl text-cyber-green mb-6 cyber-glow">SUMMONING DATA</h2>
        
        <Progress value={progress} className="w-full h-4 mb-4 bg-cyber-black rounded-full border border-white/10 overflow-hidden" />
        
        <p className="text-sm text-gray-300 mb-8">{status}</p>
        
        <div className="flex justify-center space-x-2 mb-4">
          <div className="loading-pixel bg-cyber-green"></div>
          <div className="loading-pixel bg-cyber-blue" style={{ animationDelay: "0.2s" }}></div>
          <div className="loading-pixel bg-cyber-purple" style={{ animationDelay: "0.4s" }}></div>
          <div className="loading-pixel bg-cyber-pink" style={{ animationDelay: "0.6s" }}></div>
          <div className="loading-pixel bg-cyber-yellow" style={{ animationDelay: "0.8s" }}></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-cyber-dark/50 p-3 rounded-md text-left">
            <h4 className="text-xs font-bold mb-1 text-cyber-blue">{currentTask.title}</h4>
            <p className="text-xs text-gray-400">{currentTask.text}</p>
          </div>
          {nextTask && (
            <div className="bg-cyber-dark/50 p-3 rounded-md text-left">
              <h4 className="text-xs font-bold mb-1 text-cyber-green">NEXT UP</h4>
              <p className="text-xs text-gray-400">{nextTask.text}</p>
            </div>
          )}
        </div>
      </div>
      
      <Card className="max-w-lg w-full p-4 mt-6 flex items-center bg-cyber-dark/50 border-white/10">
        <div className="mr-3 text-cyber-yellow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <p className="text-xs text-gray-300">This might take 20-30 seconds while we analyze your on-chain history.</p>
      </Card>
    </div>
  );
}
