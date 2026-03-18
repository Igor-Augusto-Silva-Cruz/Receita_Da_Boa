import * as React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Moderation from "@/pages/Moderation";
import Profile from "@/pages/Profile";

// Intercept global fetch to inject token into API requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = input.toString();
  else if (input instanceof Request) url = input.url;

  // We only intercept requests to our own /api
  if (url.includes('/api/')) {
    const token = localStorage.getItem('receita_token');
    if (token) {
      // Use new Headers() to correctly copy Headers objects AND plain objects
      const newHeaders = new Headers(init?.headers);
      newHeaders.set('Authorization', `Bearer ${token}`);
      init = { ...(init ?? {}), headers: newHeaders };
    }
  }
  
  const response = await originalFetch(input, init);
  
  // If unauthorized and we had a token, it might be expired
  if (response.status === 401 && localStorage.getItem('receita_token')) {
    localStorage.removeItem('receita_token');
  }
  
  return response;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      }
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/moderacao" component={Moderation} />
      <Route path="/usuario/:id" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  React.useEffect(() => {
    // Check for ?token=... in URL (Google OAuth redirect callback)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('receita_token', token);
      // Clean URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
      queryClient.invalidateQueries();
      // If this is a popup opened by another tab, notify opener and close
      if (window.opener) {
        window.opener.postMessage({ type: 'AUTH_SUCCESS', token }, '*');
        window.close();
      }
    }

    // Listen for token set from another tab (cross-tab auth sync)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'receita_token' && e.newValue) {
        queryClient.invalidateQueries();
      }
    };
    window.addEventListener('storage', onStorage);

    // Listen for postMessage from popup
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'AUTH_SUCCESS' && e.data?.token) {
        localStorage.setItem('receita_token', e.data.token);
        queryClient.invalidateQueries();
      }
    };
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
