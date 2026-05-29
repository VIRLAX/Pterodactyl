import { useState, useEffect, useRef } from "react";
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
  LogIn, Mail, KeyRound, Eye, EyeOff, ChevronRight, ArrowLeft,
  RefreshCw, Lock, ShieldCheck, CheckCircle2, XCircle, Users,
  Copy, ChevronDown, Monitor,
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

type LoginStep = "login" | "forgot_email" | "forgot_otp" | "forgot_newpass";

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});
const forgotEmailSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
});
const forgotOtpSchema = z.object({
  otp: z.string().length(6, { message: "Kode OTP harus 6 digit" }),
});
const newPassSchema = z.object({
  newPassword: z.string().min(6, { message: "Password minimal 6 karakter" }),
  confirmPassword: z.string().min(6, { message: "Konfirmasi password wajib diisi" }),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type ForgotEmailValues = z.infer<typeof forgotEmailSchema>;
type ForgotOtpValues = z.infer<typeof forgotOtpSchema>;
type NewPassValues = z.infer<typeof newPassSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      setLocation(user.role === "admin" ? "/admin" : "/marketplace");
    }
  }, [isAuthenticated, authLoading, user, setLocation]);
  const [step, setStep] = useState<LoginStep>("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMasked, setForgotMasked] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [forgotDevOtp, setForgotDevOtp] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showDeviceAccounts, setShowDeviceAccounts] = useState(false);
  const [deviceAccounts, setDeviceAccounts] = useState<any[]>([]);
  const [loadingDeviceAccounts, setLoadingDeviceAccounts] = useState(false);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const forgotEmailForm = useForm<ForgotEmailValues>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: "" },
  });
  const forgotOtpForm = useForm<ForgotOtpValues>({
    resolver: zodResolver(forgotOtpSchema),
    defaultValues: { otp: "" },
  });
  const newPassForm = useForm<NewPassValues>({
    resolver: zodResolver(newPassSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const emailValue = loginForm.watch("email");

  useEffect(() => {
    if (!emailValue || !emailValue.includes("@")) {
      setEmailStatus("idle");
      return;
    }
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    emailDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/auth/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailValue }),
        });
        const json = await res.json();
        setEmailStatus(json.exists ? "valid" : "invalid");
      } catch {
        setEmailStatus("idle");
      }
    }, 500);
  }, [emailValue]);

  async function fetchDeviceAccounts() {
    const deviceId = getOrCreateDeviceId();
    setLoadingDeviceAccounts(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/device-accounts`, {
        headers: { "X-Device-ID": deviceId },
      });
      const json = await res.json();
      setDeviceAccounts(json.accounts ?? []);
    } catch {
      setDeviceAccounts([]);
    } finally {
      setLoadingDeviceAccounts(false);
    }
  }

  async function onLogin(data: LoginValues) {
    setLoading(true);
    setLoginError(null);
    setEmailStatus("idle");
    setPasswordStatus("idle");
    setShowDeviceAccounts(false);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, deviceId }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = json.error || "Login gagal. Periksa email dan password.";
        setLoginError(errMsg);

        const emailCheck = await fetch(`${getApiUrl()}/auth/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
        const emailJson = await emailCheck.json();

        if (!emailJson.exists) {
          setEmailStatus("invalid");
          setPasswordStatus("idle");
        } else {
          setEmailStatus("valid");
          setPasswordStatus("invalid");
        }
        return;
      }
      setEmailStatus("valid");
      setPasswordStatus("valid");
      login(json.token, json.user);
      toast.success(`Selamat datang, ${json.user.username}!`);
      setLocation(json.user.role === "admin" ? "/admin" : "/marketplace");
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotEmail(data: ForgotEmailValues) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal mengirim OTP.");
        return;
      }
      setForgotEmail(data.email);
      setForgotMasked(json.maskedEmail);
      setForgotDevOtp(json.devOtp ?? null);
      setStep("forgot_otp");
      if (json.devOtp) {
        toast.success(`Dev Mode: Kode OTP kamu adalah ${json.devOtp}`);
      } else {
        toast.success("Kode OTP telah dikirim ke email kamu!");
      }
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotOtp(data: ForgotOtpValues) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: data.otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Kode OTP salah.");
        forgotOtpForm.setError("otp", { message: json.error });
        return;
      }
      setResetToken(json.resetToken);
      setStep("forgot_newpass");
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function onNewPass(data: NewPassValues) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, resetToken, newPassword: data.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal mereset password.");
        return;
      }
      toast.success("Password berhasil diubah! Silakan login.");
      setStep("login");
      newPassForm.reset();
      forgotEmailForm.reset();
      forgotOtpForm.reset();
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function resendForgotOtp() {
    try {
      await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      toast.success("OTP baru telah dikirim!");
    } catch {
      toast.error("Gagal mengirim ulang OTP.");
    }
  }

  const StatusIcon = ({ status }: { status: "idle" | "valid" | "invalid" }) => {
    if (status === "valid") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === "invalid") return <XCircle className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {step === "login" && (
            <>
              {/* Device ID strip */}
              <div className="mb-5 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Monitor className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">ID Perangkat</p>
                    <p className="text-xs text-white/60 font-mono truncate">{getOrCreateDeviceId().slice(0, 18)}…</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getOrCreateDeviceId());
                    toast.success("ID Perangkat disalin!");
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-primary/20 rounded-lg px-2.5 py-1 transition-colors hover:bg-primary/10"
                >
                  <Copy className="w-3 h-3" /> Salin
                </button>
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <LogIn className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Masuk ke PteroStore</h1>
                <p className="text-muted-foreground text-sm">Masukkan email dan password kamu</p>
              </div>

              <Card className="glass-panel border border-white/10 shadow-[0_0_40px_rgba(255,10,60,0.06)]">
                <CardContent className="pt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> Email
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="name@gmail.com"
                                  autoComplete="email"
                                  className={`bg-background/60 pr-10 transition-colors ${
                                    emailStatus === "valid"
                                      ? "border-green-500/60 focus:border-green-500"
                                      : emailStatus === "invalid"
                                      ? "border-red-500/60 focus:border-red-500"
                                      : "border-white/10 focus:border-primary/50"
                                  }`}
                                  {...field}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <StatusIcon status={emailStatus} />
                                </span>
                              </div>
                            </FormControl>
                            {emailStatus === "invalid" && (
                              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                <XCircle className="w-3 h-3" /> Email tidak terdaftar. Periksa kembali.
                              </p>
                            )}
                            {emailStatus === "valid" && (
                              <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Email ditemukan.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5" /> Password
                              </FormLabel>
                              <button
                                type="button"
                                onClick={() => setStep("forgot_email")}
                                className="text-xs text-primary hover:text-primary/80 transition-colors"
                              >
                                Lupa Password?
                              </button>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPass ? "text" : "password"}
                                  placeholder="••••••••"
                                  autoComplete="current-password"
                                  className={`bg-background/60 pr-16 transition-colors ${
                                    passwordStatus === "valid"
                                      ? "border-green-500/60 focus:border-green-500"
                                      : passwordStatus === "invalid"
                                      ? "border-red-500/60 focus:border-red-500"
                                      : "border-white/10 focus:border-primary/50"
                                  }`}
                                  {...field}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  <StatusIcon status={passwordStatus} />
                                  <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPass((v) => !v)}
                                    className="text-muted-foreground hover:text-white transition-colors"
                                  >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </FormControl>
                            {passwordStatus === "invalid" && (
                              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                <XCircle className="w-3 h-3" /> Password salah.
                              </p>
                            )}
                            {passwordStatus === "valid" && (
                              <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Password benar.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {loginError && (
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3.5">
                          <p className="text-sm text-red-400 text-center">{loginError}</p>
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            Pastikan username/password sudah benar. Jika lupa, gunakan fitur{" "}
                            <button
                              type="button"
                              onClick={() => setStep("forgot_email")}
                              className="text-primary underline"
                            >
                              Lupa Password
                            </button>
                            .
                          </p>
                          {passwordStatus === "valid" && emailStatus === "invalid" && (
                            <button
                              type="button"
                              onClick={async () => {
                                setShowDeviceAccounts(v => !v);
                                if (!showDeviceAccounts) await fetchDeviceAccounts();
                              }}
                              className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-blue-400 border border-blue-500/25 rounded-lg py-2 hover:bg-blue-500/10 transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" />
                              Lihat akun yang pernah login di perangkat ini
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDeviceAccounts ? "rotate-180" : ""}`} />
                            </button>
                          )}
                          {emailStatus === "invalid" && passwordStatus === "idle" && (
                            <button
                              type="button"
                              onClick={async () => {
                                setShowDeviceAccounts(v => !v);
                                if (!showDeviceAccounts) await fetchDeviceAccounts();
                              }}
                              className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-blue-400 border border-blue-500/25 rounded-lg py-2 hover:bg-blue-500/10 transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" />
                              Lihat akun yang pernah login di perangkat ini
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDeviceAccounts ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                      )}

                      {showDeviceAccounts && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Akun di perangkat ini
                          </p>
                          {loadingDeviceAccounts ? (
                            <div className="flex items-center justify-center py-3">
                              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                          ) : deviceAccounts.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">Tidak ada akun yang tercatat di perangkat ini.</p>
                          ) : (
                            deviceAccounts.map((acc: any) => (
                              <div key={acc.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                <div>
                                  <p className="text-sm text-white font-medium">{acc.username}</p>
                                  <p className="text-xs text-muted-foreground">{acc.email}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    loginForm.setValue("email", "");
                                    toast.info(`Gunakan email akun "${acc.username}" untuk login.`);
                                  }}
                                  className="text-xs text-primary"
                                >
                                  Pilih
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,10,60,0.3)] hover:shadow-[0_0_30px_rgba(255,10,60,0.5)] transition-all mt-2"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memverifikasi...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Masuk <ChevronRight className="w-4 h-4" />
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
                  <ShieldCheck className="w-3 h-3" /> Sistem aman & terenkripsi
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {step === "forgot_email" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
                  <Lock className="w-6 h-6 text-orange-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Lupa Password</h1>
                <p className="text-muted-foreground text-sm">Masukkan email akun kamu untuk menerima kode OTP</p>
              </div>

              <Card className="glass-panel border border-white/10">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">1</div>
                    <CardTitle className="text-base font-semibold">Email Akun</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Kode OTP akan dikirim ke email ini</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...forgotEmailForm}>
                    <form onSubmit={forgotEmailForm.handleSubmit(onForgotEmail)} className="space-y-4">
                      <FormField
                        control={forgotEmailForm.control}
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
                                className="bg-background/60 border-white/10 focus:border-orange-500/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white transition-all mt-2"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Mengirim OTP...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Kirim OTP <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4">
                    <Button variant="ghost" className="w-full text-muted-foreground border border-white/10 hover:bg-white/5 text-sm gap-2" onClick={() => setStep("login")}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === "forgot_otp" && (
            <>
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
                  <Mail className="w-6 h-6 text-orange-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">✓</span>
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Periksa Email Kamu</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Kode OTP dikirim ke<br />
                  <span className="text-white font-semibold">{forgotMasked}</span>
                </p>
              </div>

              <Card className="glass-panel border border-white/10">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                    <CardTitle className="text-base font-semibold">Masukkan Kode OTP</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Berlaku 5 menit. Cek juga folder spam/junk.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...forgotOtpForm}>
                    <form onSubmit={forgotOtpForm.handleSubmit(onForgotOtp)} className="space-y-4">
                      <FormField
                        control={forgotOtpForm.control}
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
                                className="bg-background/60 border-white/10 focus:border-orange-500/50 text-center text-2xl tracking-[0.5em] font-mono h-14"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {forgotDevOtp ? (
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">⚠ Dev Mode — SMTP Belum Dikonfigurasi</p>
                          <p className="text-xs text-muted-foreground mb-3">Email tidak terkirim. Gunakan kode ini untuk testing:</p>
                          <div className="text-3xl font-black tracking-[0.4em] text-yellow-300 font-mono bg-yellow-500/10 rounded-lg py-3 px-4 border border-yellow-500/30">
                            {forgotDevOtp}
                          </div>
                          <p className="text-xs text-yellow-500/70 mt-2">Salin kode di atas ke kolom OTP</p>
                        </div>
                      ) : (
                        <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3 flex items-start gap-2">
                          <span className="text-blue-400 text-xs font-bold mt-0.5">i</span>
                          <p className="text-xs text-muted-foreground">Cek inbox dan folder <strong className="text-white">spam/junk</strong> email kamu.</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memverifikasi...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Verifikasi OTP <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" className="flex-1 text-muted-foreground border border-white/10 hover:bg-white/5 text-sm gap-2" onClick={() => setStep("forgot_email")}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                    </Button>
                    <Button variant="ghost" className="flex-1 text-orange-400 border border-orange-500/20 hover:bg-orange-500/10 text-sm gap-2" onClick={resendForgotOtp}>
                      <RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === "forgot_newpass" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Buat Password Baru</h1>
                <p className="text-muted-foreground text-sm">Buat password yang kuat untuk akun kamu</p>
              </div>

              <Card className="glass-panel border border-white/10">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">3</div>
                    <CardTitle className="text-base font-semibold">Password Baru</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Minimal 6 karakter, pastikan kedua password cocok</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...newPassForm}>
                    <form onSubmit={newPassForm.handleSubmit(onNewPass)} className="space-y-4">
                      <FormField
                        control={newPassForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5" /> Password Baru
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showNew ? "text" : "password"}
                                  placeholder="••••••••"
                                  autoComplete="new-password"
                                  className="bg-background/60 border-white/10 focus:border-green-500/50 pr-10"
                                  {...field}
                                />
                                <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={newPassForm.control}
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
                                  className="bg-background/60 border-white/10 focus:border-green-500/50 pr-10"
                                  {...field}
                                />
                                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white transition-all mt-2">
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Menyimpan...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Simpan Password Baru <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4">
                    <Button variant="ghost" className="w-full text-muted-foreground border border-white/10 hover:bg-white/5 text-sm gap-2" onClick={() => setStep("forgot_otp")}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Kembali
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
