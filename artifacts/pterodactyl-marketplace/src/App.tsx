import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
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
import AdminSessions from "@/pages/admin/sessions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ minHeight: "100vh" }}>
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/">{() => <AnimatedPage><Landing /></AnimatedPage>}</Route>
        <Route path="/marketplace">{() => <AnimatedPage><Marketplace /></AnimatedPage>}</Route>
        <Route path="/product/:id">{(params) => <AnimatedPage><ProductDetail /></AnimatedPage>}</Route>
        <Route path="/checkout/:orderId">{() => <AnimatedPage><Checkout /></AnimatedPage>}</Route>
        <Route path="/orders">{() => <AnimatedPage><Orders /></AnimatedPage>}</Route>
        <Route path="/login">{() => <AnimatedPage><Login /></AnimatedPage>}</Route>
        <Route path="/register">{() => <AnimatedPage><Register /></AnimatedPage>}</Route>
        <Route path="/report-bug">{() => <AnimatedPage><ReportBug /></AnimatedPage>}</Route>

        <Route path="/admin">{() => <AnimatedPage><AdminDashboard /></AnimatedPage>}</Route>
        <Route path="/admin/products">{() => <AnimatedPage><AdminProducts /></AnimatedPage>}</Route>
        <Route path="/admin/orders">{() => <AnimatedPage><AdminOrders /></AnimatedPage>}</Route>
        <Route path="/admin/users">{() => <AnimatedPage><AdminUsers /></AnimatedPage>}</Route>
        <Route path="/admin/discounts">{() => <AnimatedPage><AdminDiscounts /></AnimatedPage>}</Route>
        <Route path="/admin/invites">{() => <AnimatedPage><AdminInvites /></AnimatedPage>}</Route>
        <Route path="/admin/reviews">{() => <AnimatedPage><AdminReviews /></AnimatedPage>}</Route>
        <Route path="/admin/bugs">{() => <AnimatedPage><AdminBugs /></AnimatedPage>}</Route>
        <Route path="/admin/sessions">{() => <AnimatedPage><AdminSessions /></AnimatedPage>}</Route>
        <Route path="/admin/settings">{() => <AnimatedPage><AdminSettings /></AnimatedPage>}</Route>

        <Route>{() => <AnimatedPage><NotFound /></AnimatedPage>}</Route>
      </Switch>
    </AnimatePresence>
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
