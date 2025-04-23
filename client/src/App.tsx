import { Switch, Route } from "wouter";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="relative overflow-x-hidden min-h-screen bg-cyber-black text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 pixel-bg opacity-5 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyber-purple/30 to-transparent opacity-20 z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-cyber-green/30 to-transparent opacity-20 z-0"></div>
      
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard/:address" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="wallet-wizard-theme">
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
