import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// User Pages
import Landing from "@/pages/landing";
import Marketplace from "@/pages/marketplace";
import ProductDetail from "@/pages/product-detail";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ReportBug from "@/pages/report-bug";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminUsers from "@/pages/admin/users";
import AdminDiscounts from "@/pages/admin/discounts";
import AdminInvites from "@/pages/admin/invites";
import AdminReviews from "@/pages/admin/reviews";
import AdminBugs from "@/pages/admin/bugs";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/checkout/:orderId" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/report-bug" component={ReportBug} />
      
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/discounts" component={AdminDiscounts} />
      <Route path="/admin/invites" component={AdminInvites} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/bugs" component={AdminBugs} />
      <Route path="/admin/settings" component={AdminSettings} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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