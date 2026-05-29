import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Shield, User, ChevronRight, Zap } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    email: "admin@pterostore.com",
    password: "admin123",
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30",
    desc: "Full dashboard access",
  },
  {
    label: "User",
    email: "user@pterostore.com",
    password: "user123",
    icon: User,
    color: "text-blue-400",
    bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
    desc: "Browse & purchase",
  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLoginUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate({ data }, {
      onSuccess: (response) => {
        login(response.token, response.user);
        toast.success("Login successful!");
        if (response.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/marketplace");
        }
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to login. Please check your credentials.");
      }
    });
  }

  function fillDemo(email: string, password: string) {
    form.setValue("email", email);
    form.setValue("password", password);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">

          <div className="text-center space-y-1 mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Demo Accounts Available</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your PteroStore account</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${acc.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 font-semibold text-sm ${acc.color}`}>
                      <Icon className="w-4 h-4" />
                      {acc.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{acc.desc}</p>
                  <code className="text-xs text-muted-foreground/70 font-mono truncate">{acc.email}</code>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">or sign in manually</span>
            </div>
          </div>

          <Card className="glass-panel neon-border-primary border-t-2">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight text-center">Sign In</CardTitle>
              <CardDescription className="text-center text-xs">Enter your credentials below</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="bg-background/50 border-white/10 focus:border-primary/50 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(255,10,60,0.4)] hover:shadow-[0_0_30px_rgba(255,10,60,0.6)] transition-all duration-200"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Button variant="link" className="p-0 text-primary hover:text-primary/80" onClick={() => setLocation("/register")}>
                  Sign up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
