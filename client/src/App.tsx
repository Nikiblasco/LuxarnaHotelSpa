import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Rooms from "@/pages/Rooms";
import Spa from "@/pages/Spa";
import Restaurant from "@/pages/Restaurant";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import LoyaltySignUp from "@/pages/LoyaltySignUp";
import ChatBot from "@/components/ChatBot";
import PromoPopup from "@/components/PromoPopup";
import Checkout from "@/pages/Checkout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/spa" component={Spa} />
      <Route path="/restaurant" component={Restaurant} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={Admin} />
      <Route path="/loyalty-signup" component={LoyaltySignUp} />
      <Route path="/checkout" component={Checkout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <PromoPopup />
        <ChatBot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
