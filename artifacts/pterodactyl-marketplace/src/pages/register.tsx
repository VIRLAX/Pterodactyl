import { useState, useEffect } from "react";
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
import {
  UserPlus, Mail, KeyRound, User, Eye, EyeOff,
  ChevronRight, ArrowLeft, RefreshCw, ShieldCheck,
  AlertTriangle, Copy, Check, LogIn,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem("pterostore_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pterostore_device_id", id);
  }
  return id;
}

type RegisterStep = "form" | "otp" | "limit_reached";

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username minimal 3 karakter" }),
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  confirmPassword: z.string().min(1, { message: "Konfirmasi password wajib diisi" }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "Kode OTP harus 6 digit" }),
});

type RegisterValues = z.infer<typeof registerSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      setLocation(user.role === "admin" ? "/admin" : "/marketplace");
    }
  }, [isAuthenticated, authLoading, user]);

  const [step, setStep] = useState<RegisterStep>("form");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [deviceLimit, setDeviceLimit] = useState({ used: 0, limit: 3 });
  const [limitInfo, setLimitInfo] = useState<{ used: number; limit: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    fetch(`${getApiUrl()}/auth/device-limit-info`, {
      headers: { "X-Device-ID": id },
    })
      .then(r => r.json())
      .then(data => setDeviceLimit(data))
      .catch(() => {});
  }, []);

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  function copyDeviceId() {
    navigator.clipboard.writeText(deviceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function onRegister(data: RegisterValues) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, email: data.email, password: data.password, deviceId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "DEVICE_LIMIT_REACHED") {
          setLimitInfo({ used: json.used, limit: json.limit });
          setStep("limit_reached");
          return;
        }
        toast.error(json.error || "Pendaftaran gagal. Coba lagi.");
        return;
      }
      setEmailValue(data.email);
      setMaskedEmail(json.maskedEmail);
      setDevOtp(json.devOtp ?? null);
      setStep("otp");
      if (json.devOtp) {
        toast.success(`Dev Mode: Kode OTP kamu adalah ${json.devOtp}`);
      } else {
        toast.success("Kode OTP dikirim ke email kamu!");
      }
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(data: OtpValues) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/verify-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, otp: data.otp, deviceId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "DEVICE_LIMIT_REACHED") {
          setLimitInfo({ used: json.used, limit: json.limit });
          setStep("limit_reached");
          return;
        }
        toast.error(json.error || "Kode OTP salah. Coba lagi.");
        otpForm.setError("otp", { message: json.error });
        return;
      }
      login(json.token, json.user);
      toast.success(`Akun berhasil dibuat! Selamat datang, ${json.user.username}!`);
      setLocation("/marketplace");
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    const vals = registerForm.getValues();
    if (!vals.email) return;
    try {
      await fetch(`${getApiUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: vals.username, email: vals.email, password: vals.password, deviceId }),
      });
      toast.success("OTP baru telah dikirim!");
    } catch {
      toast.error("Gagal mengirim ulang OTP.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {step === "form" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 mb-4">
                  <UserPlus className="w-6 h-6 text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h1>
                <p className="text-muted-foreground text-sm">Daftar dan mulai belanja panel Pterodactyl</p>
              </div>

              {deviceLimit.used >= deviceLimit.limit - 1 && deviceLimit.used < deviceLimit.limit && (
                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-300 font-medium">Hampir mencapai batas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Perangkat ini sudah digunakan untuk <strong className="text-white">{deviceLimit.used}/{deviceLimit.limit}</strong> akun.
                      Setelah ini, kamu tidak bisa membuat akun baru tanpa persetujuan admin.
                    </p>
                  </div>
                </div>
              )}

              <Card className="glass-panel border border-white/10 shadow-[0_0_40px_rgba(150,10,255,0.06)]">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">1</div>
                    <CardTitle className="text-base font-semibold">Data Akun</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Email kamu akan diverifikasi via OTP setelah ini</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" /> Username
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="gamer123"
                                autoComplete="username"
                                className="bg-background/60 border-white/10 focus:border-secondary/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@gmail.com"
                                autoComplete="email"
                                className="bg-background/60 border-white/10 focus:border-secondary/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5" /> Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPass ? "text" : "password"}
                                  placeholder="••••••••"
                                  autoComplete="new-password"
                                  className="bg-background/60 border-white/10 focus:border-secondary/50 pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => setShowPass((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                >
                                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5" /> Konfirmasi Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirm ? "text" : "password"}
                                  placeholder="••••••••"
                                  autoComplete="new-password"
                                  className="bg-background/60 border-white/10 focus:border-secondary/50 pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => setShowConfirm((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                >
                                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-secondary/90 text-white shadow-[0_0_20px_rgba(150,10,255,0.35)] hover:shadow-[0_0_30px_rgba(150,10,255,0.55)] transition-all mt-2"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memproses...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Daftar & Verifikasi Email <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-5 text-center text-sm">
                    <span className="text-muted-foreground">Sudah punya akun? </span>
                    <Button variant="link" className="p-0 text-secondary hover:text-secondary/80 font-medium" onClick={() => setLocation("/login")}>
                      Masuk di sini
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 flex items-center gap-3 px-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Data kamu aman & terenkripsi
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {step === "limit_reached" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Batas Akun Tercapai</h1>
                <p className="text-muted-foreground text-sm">Perangkat ini telah mencapai batas maksimal pembuatan akun</p>
              </div>

              <Card className="glass-panel border border-red-500/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-white font-semibold mb-1">
                      Batas akun: {limitInfo?.used ?? 0}/{limitInfo?.limit ?? 3}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1 perangkat hanya diizinkan membuat <strong className="text-white">{limitInfo?.limit ?? 3} akun</strong>.
                      Untuk menambah kuota, hubungi admin dengan menyertakan ID Perangkat kamu.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ID Perangkat Kamu</p>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <code className="flex-1 text-xs text-white font-mono break-all">{deviceId}</code>
                      <button
                        onClick={copyDeviceId}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Salin ID di atas dan kirimkan ke admin. Admin akan menambah kuota akun untuk perangkat kamu.
                    </p>
                  </div>

                  <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">i</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Setelah admin menambah kuota, kamu bisa kembali ke halaman ini dan coba daftar lagi.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setStep("form")}
                      variant="outline"
                      className="w-full border-white/15 text-muted-foreground hover:bg-white/5 gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </Button>
                    <Button
                      onClick={() => setLocation("/login")}
                      className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                    >
                      <LogIn className="w-4 h-4" /> Login ke Akun yang Ada
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                  <Mail className="w-6 h-6 text-green-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">✓</span>
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Verifikasi Email</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Kode OTP 6 digit dikirim ke<br />
                  <span className="text-white font-semibold">{maskedEmail}</span>
                </p>
              </div>

              <Card className="glass-panel border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                    <CardTitle className="text-base font-semibold">Verifikasi OTP</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Masukkan kode 6 digit dari email. Berlaku 5 menit.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5" /> Kode OTP
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="● ● ● ● ● ●"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                className="bg-background/60 border-white/10 focus:border-green-500/50 text-center text-2xl tracking-[0.5em] font-mono h-14"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {devOtp ? (
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">⚠ Dev Mode — SMTP Belum Dikonfigurasi</p>
                          <p className="text-xs text-muted-foreground mb-3">Email tidak terkirim. Gunakan kode ini untuk testing:</p>
                          <div className="text-3xl font-black tracking-[0.4em] text-yellow-300 font-mono bg-yellow-500/10 rounded-lg py-3 px-4 border border-yellow-500/30">
                            {devOtp}
                          </div>
                          <p className="text-xs text-yellow-500/70 mt-2">Salin kode di atas ke kolom OTP</p>
                        </div>
                      ) : (
                        <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3.5 flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-400 text-xs font-bold">i</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Cek inbox dan folder <strong className="text-white">spam/junk</strong>. OTP dikirim real-time ke Gmail kamu.
                          </p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Membuat Akun...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Verifikasi & Buat Akun <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" className="flex-1 text-muted-foreground border border-white/10 hover:bg-white/5 text-sm gap-2" onClick={() => { setStep("form"); otpForm.reset(); }}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                    </Button>
                    <Button variant="ghost" className="flex-1 text-green-400 border border-green-500/20 hover:bg-green-500/10 text-sm gap-2" onClick={resendOtp}>
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

