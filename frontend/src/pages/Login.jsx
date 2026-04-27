import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:4000/api";

function Login() {
  const [mode, setMode] = useState("login"); // "login" | "forgot-password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "forgot-password") {
        // Mock backend call for forgot-password
        await new Promise(r => setTimeout(r, 1000));
        setMessage("If an account exists, a password reset link has been sent to your email.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      // Store email + name for the OTP step
      sessionStorage.setItem(
        "ai-ielts-pending-user",
        JSON.stringify({ name: email.split("@")[0], email })
      );
      navigate("/verify");
    } catch (err) {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7E3AF2] focus:bg-white focus:ring-2 focus:ring-[#7E3AF2]/20 transition-all duration-200";

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7E3AF2] text-white shadow-lg shadow-[#7E3AF2]/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#333333]">
                  {mode === "login" ? "Welcome back" : "Reset password"}
                </h1>
                <p className="text-xs text-gray-500">IELTS Mock Test Platform</p>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {mode === "login" 
                ? "Sign in to access your dashboard and practice history." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>

            {/* Form */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              {mode !== "forgot-password" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot-password"); setError(""); setMessage(""); }}
                      className="text-[11px] font-bold text-[#7E3AF2] hover:text-[#6930D0] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required={true}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-[#7E3AF2]/10 border border-[#7E3AF2]/20 px-3 py-2 text-xs font-medium text-[#7E3AF2]">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  mode === "login" ? "Send verification code →" : "Send reset link →"
                )}
              </button>
            </form>

            {mode === "forgot-password" ? (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  className="text-xs font-medium text-gray-500 hover:text-[#7E3AF2] hover:underline"
                >
                  ← Back to login
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-500">Don't have an account? </span>
                <RouterLink
                  to="/signup"
                  className="text-xs font-bold text-[#7E3AF2] hover:text-[#6930D0] hover:underline"
                >
                  Sign up
                </RouterLink>
              </div>
            )}

            {mode !== "forgot-password" && (
              <p className="mt-5 text-[11px] text-gray-400 text-center">
                A 6-digit verification code will be sent to your email after submitting.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
