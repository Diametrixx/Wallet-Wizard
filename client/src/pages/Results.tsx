import React from 'react';
import { useRoute } from 'wouter';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Dashboard from '@/components/Dashboard';
import LoadingView from '@/components/LoadingView';
import { useWalletAnalysis } from '@/hooks/useWalletAnalysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Results: React.FC = () => {
  const [, params] = useRoute<{ walletAddress: string }>('/results/:walletAddress');
  const walletAddress = params?.walletAddress || '';
  
  const { isLoading, progress, currentTask, nextTask, error, data } = useWalletAnalysis({
    walletAddress
  });

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-10">
        {isLoading && (
          <LoadingView 
            progress={progress} 
            currentTask={currentTask}
            nextTask={nextTask}
          />
        )}
        
        {!isLoading && error && (
          <div className="flex justify-center">
            <Alert variant="destructive" className="max-w-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        {!isLoading && !error && data && (
          <Dashboard data={data} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Results;
