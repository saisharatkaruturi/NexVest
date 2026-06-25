import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Mail, Lock, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { login, setStoredToken, setStoredUser } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignupHint, setShowSignupHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowSignupHint(false);
    setLoading(true);
    try {
      const result = await login({ data: { email, password } });
      setStoredToken(result.access_token);
      localStorage.setItem("refresh_token", result.refresh_token);
      setStoredUser(result.user);
      authLogin(result.access_token, result.refresh_token, result.user);
      toast.success("Welcome back!", { description: result.user.name });
      navigate({ to: "/app" });
    } catch (err: any) {
      const msg = err?.message || "Login failed. Please try again.";
      setError(msg);
      if (/no account|sign up first/i.test(msg)) setShowSignupHint(true);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@nexvest.app");
    setPassword("demo1234");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-profit flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
          </div>
          <span className="font-bold text-2xl tracking-tight">NexVest</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-center mb-6">Sign in to your account</p>

          {error && (
            <div className="space-y-2 mb-4">
              <div className="bg-loss/10 border border-loss/30 text-loss text-sm rounded-lg p-3">
                {error}
              </div>
              {showSignupHint && (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/signup", search: { email } })}
                  className="w-full bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg p-2.5 hover:bg-primary/15 transition flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create an account with this email
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary/60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border focus:outline-none focus:border-primary/60"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-muted-foreground">
                <input type="checkbox" className="rounded border-border" defaultChecked /> Remember me
              </label>
              <button type="button" onClick={() => toast.info("Password reset link sent (demo)")} className="text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={fillDemo}
            className="w-full mt-3 py-2 text-xs rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
          >
            Use demo credentials
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => navigate({ to: "/signup" })}
              className="text-primary font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
