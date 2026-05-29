import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Shield, ChevronRight, Mail, KeyRound, RefreshCw, ArrowLeft } from "lucide-react";
import { getApiUrl } from "@/lib/api";

const credSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});
const otpSchema = z.object({
  otp: z.string().length(6, { message: "Kode OTP harus 6 digit" }),
});

type CredValues = z.infer<typeof credSchema>;
type OTPValues = z.infer<typeof otpSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [loadingCred, setLoadingCred] = useState(false);
  const [loadingOTP, setLoadingOTP] = useState(false);

  const credForm = useForm<CredValues>({
    resolver: zodResolver(credSchema),
    defaultValues: { email: "", password: "" },
  });
  const otpForm = useForm<OTPValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmitCred(data: CredValues) {
    setLoadingCred(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Login gagal. Periksa kembali email dan password.");
        return;
      }
      if (json.step === "otp_required") {
        setMaskedEmail(json.maskedEmail);
        setEmailValue(data.email);
        setStep("otp");
        toast.success("Kode OTP telah dikirim ke email kamu!");
      }
    } catch {
      toast.error("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoadingCred(false);
    }
  }

  async function onSubmitOTP(data: OTPValues) {
    setLoadingOTP(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, otp: data.otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Kode OTP salah. Periksa email kamu dan coba lagi.");
        otpForm.setError("otp", { message: json.error });
        return;
      }
      login(json.token, json.user);
      toast.success(`Selamat datang kembali, ${json.user.username}! 🎉`);
      if (json.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/marketplace");
      }
    } catch {
      toast.error("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoadingOTP(false);
    }
  }

  function goBack() {
    setStep("credentials");
    otpForm.reset();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {step === "credentials" ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Masuk ke PteroStore</h1>
                <p className="text-muted-foreground text-sm">Verifikasi dua langkah untuk keamanan maksimal</p>
              </div>

              <Card className="glass-panel border border-white/10 shadow-[0_0_40px_rgba(255,10,60,0.05)]">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">1</div>
                    <CardTitle className="text-base font-semibold">Identitas Akun</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Masukkan email & password yang terdaftar</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...credForm}>
                    <form onSubmit={credForm.handleSubmit(onSubmitCred)} className="space-y-4">
                      <FormField
                        control={credForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@gmail.com"
                                autoComplete="email"
                                className="bg-background/60 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={credForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" />Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="bg-background/60 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={loadingCred}
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,10,60,0.35)] hover:shadow-[0_0_30px_rgba(255,10,60,0.55)] transition-all duration-200 mt-2"
                      >
                        {loadingCred ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memverifikasi...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Lanjutkan <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-5 text-center text-sm">
                    <span className="text-muted-foreground">Belum punya akun? </span>
                    <Button variant="link" className="p-0 text-primary hover:text-primary/80 font-medium" onClick={() => setLocation("/register")}>
                      Daftar sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 flex items-center gap-3 px-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Dilindungi OTP via Email
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                  <Mail className="w-7 h-7 text-green-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">✓</span>
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Periksa Email Kamu</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Kode OTP 6 digit telah dikirim ke<br />
                  <span className="text-white font-semibold">{maskedEmail}</span>
                </p>
              </div>

              <Card className="glass-panel border border-white/10 shadow-[0_0_40px_rgba(255,10,60,0.05)]">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                    <CardTitle className="text-base font-semibold">Verifikasi OTP</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Masukkan kode 6 digit dari email. Berlaku 5 menit.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onSubmitOTP)} className="space-y-4">
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" />Kode OTP</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="● ● ● ● ● ●"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                className="bg-background/60 border-white/10 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-center text-2xl tracking-[0.5em] font-mono h-14"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3.5 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-xs font-bold">i</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Cek inbox dan folder <strong className="text-white">spam/junk</strong> email kamu. Jika tidak menerima, klik tombol login ulang.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={loadingOTP}
                        className="w-full bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-200"
                      >
                        {loadingOTP ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memverifikasi...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Verifikasi & Masuk <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" className="flex-1 text-muted-foreground border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm gap-2" onClick={goBack}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                    </Button>
                    <Button variant="ghost" className="flex-1 text-primary border border-primary/20 hover:bg-primary/10 text-sm gap-2" onClick={goBack}>
                      <RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
