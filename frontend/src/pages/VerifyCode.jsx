import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../AuthContext";

import { API_BASE } from "../apiConfig";

function VerifyCode() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const stored = sessionStorage.getItem("ai-ielts-pending-user");
    if (stored) {
      setPendingUser(JSON.parse(stored));
    }
  }, []);

  if (!pendingUser) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <p className="text-sm text-gray-600">
            No verification request found.{" "}
            <a href="/login" className="text-[#7E3AF2] font-bold hover:underline">
              Go to login →
            </a>
          </p>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, code: input })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid code. Please try again.");
        return;
      }

      // Save user + token via AuthContext (persisted to localStorage)
      login(data.user, data.token);
      sessionStorage.removeItem("ai-ielts-pending-user");
      navigate("/dashboard");
    } catch (err) {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Visual: individual digit boxes for the 6-digit code
  const digits = input.padEnd(6, " ").split("");

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7E3AF2] text-white shadow-xl shadow-[#7E3AF2]/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h1 className="text-xl font-bold text-[#333333] text-center">
              Check your inbox
            </h1>
            <p className="mt-2 text-sm text-gray-600 text-center">
              We&apos;ve sent a 6-digit verification code to{" "}
              <span className="font-bold text-[#7E3AF2]">{pendingUser.email}</span>.
            </p>
            <p className="mt-1 text-[11px] text-gray-400 text-center">
              Don&apos;t see it? Check your spam folder. The code expires in 10 minutes.
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Verification code
                </label>

                {/* Digit preview boxes */}
                <div className="flex gap-2 mb-2" aria-hidden="true">
                  {digits.map((d, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-12 flex items-center justify-center rounded-xl border-2 text-lg font-bold transition-all duration-150 ${
                        i < input.length
                          ? "border-[#7E3AF2] bg-[#7E3AF2]/5 text-[#7E3AF2]"
                          : "border-gray-100 bg-gray-50 text-transparent"
                      }`}
                    >
                      {d.trim() || "·"}
                    </div>
                  ))}
                </div>

                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7E3AF2] focus:bg-white focus:ring-2 focus:ring-[#7E3AF2]/20 transition-all duration-200"
                  placeholder="Enter 6-digit code"
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || input.length < 6}
                className="btn-primary w-full mt-2 py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  "Verify & continue →"
                )}
              </button>
            </form>

            <button
              onClick={() => navigate("/login")}
              className="mt-4 w-full text-xs text-gray-500 hover:text-[#7E3AF2] transition-colors text-center"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VerifyCode;
