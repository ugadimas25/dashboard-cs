import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import DashboardV2 from "@/pages/dashboard-v2";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DataProvider } from "@/lib/data";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user } = useAuth();
  return user ? <Component {...rest} /> : <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/old">
        {/* Old Dashboard with CSV upload */}
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/">
        {/* New Dashboard with Origin/Orbit */}
        <PrivateRoute component={DashboardV2} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Router />
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
