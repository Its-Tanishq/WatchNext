"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Star } from "lucide-react";

export default function AuthPage({ initialMode = "register" }) {
  const router = useRouter();
  const supabase = createClient();

  // Mode: 'register' | 'login'
  const [mode, setMode] = useState(initialMode);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Separate form states for Register and Login
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [activeAnimeIndex, setActiveAnimeIndex] = useState(1);

  // Clear messages when mode toggles
  const switchMode = (newMode) => {
    setErrorMessage("");
    setSuccessMessage("");
    setMode(newMode);
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regUsername.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: {
            username: regUsername.trim(),
            display_name: regUsername.trim(),
          },
        },
      });

      if (error) {
        if (error.status === 429 || error.code === "over_email_send_rate_limit") {
          setErrorMessage(
            "Supabase email rate limit reached. In your Supabase Dashboard, go to Authentication > Providers > Email and disable 'Confirm email' for instant signups."
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // If user session is returned immediately (email confirmation disabled in Supabase)
      if (data?.session) {
        setSuccessMessage("Account created! Redirecting...");
        router.push("/");
        router.refresh();
      } else {
        setSuccessMessage(
          "Account created! Please check your email inbox to verify your account."
        );
      }
    } catch (err) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginEmail.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("Signed in! Redirecting...");
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMessage(err?.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const animeList = [
    {
      id: "skywhale",
      title: "Skywhale Chronicle",
      rating: "9.12",
      image: "/images/skywhale.jpg",
      quote: "“The sky remembers every story you finish.”",
      subcaption: "Skywhale Chronicle — EP 8",
    },
    {
      id: "iron-blossom",
      title: "Iron Blossom",
      rating: "9.02",
      image: "/images/iron-blossom.jpg",
      quote: "“I mapped 342 worlds to find one that felt like home.”",
      subcaption: "Joined 12,408 fans tracking Iron Blossom",
    },
    {
      id: "hollow-circuit",
      title: "Hollow Circuit",
      rating: "8.98",
      image: "/images/hollow-circuit.jpg",
      quote: "“In the neon silence, machines dream in electric frequencies.”",
      subcaption: "Hollow Circuit — Episode Premiere",
    },
  ];

  // Dynamic password strength checks
  const hasMinLength = regPassword.length >= 8;
  const hasSymbolOrNumber = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword);
  const hasUpperAndLower = /[a-z]/.test(regPassword) && /[A-Z]/.test(regPassword);

  let strengthScore = 0;
  if (hasMinLength) strengthScore++;
  if (hasSymbolOrNumber) strengthScore++;
  if (hasUpperAndLower && regPassword.length >= 10) strengthScore++;

  const strengthLabel =
    regPassword.length === 0 ? "None" : strengthScore === 3 ? "Strong" : strengthScore === 2 ? "Good" : strengthScore === 1 ? "Fair" : "Weak";

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a0c10] text-[#e8ebf2] select-none">
      {/* ================= LEFT COLUMN: AUTH FORMS ================= */}
      <section className="w-full lg:w-[48%] xl:w-[46%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 relative bg-[#0b0d13]/95 backdrop-blur-md">
        {/* Top bar: Brand + Mode Header Indicator */}
        <div className="flex items-center justify-between w-full mb-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5b42] to-[#f03b24] flex items-center justify-center shadow-lg shadow-[#ff5238]/25 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-white text-lg tracking-wider">W</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold tracking-widest text-lg text-white">WATCHNEXT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5238] ml-1 mt-1 inline-block"></span>
            </div>
          </Link>

          {/* Right Header Navigation / Steps */}
          {mode === "register" ? (
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-white bg-[#191d29] px-2.5 py-1 rounded-full border border-[#2b3145]">
                <span className="w-4 h-4 rounded-full bg-[#ff5238] text-[10px] text-white flex items-center justify-center font-bold">1</span>
                <span>Account</span>
              </div>
              <div className="w-6 h-[1.5px] bg-[#242b3d]"></div>
              <div className="flex items-center gap-1 text-[#626d87] px-2 py-1">
                <span className="w-4 h-4 rounded-full bg-[#181c28] text-[10px] text-[#717e9d] flex items-center justify-center">2</span>
                <span>Taste</span>
              </div>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xs font-medium text-[#8792ab] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-[#141722] px-3 py-1.5 rounded-full border border-[#232838]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to browse</span>
            </Link>
          )}
        </div>

        {/* Central Form Container */}
        <div className="max-w-[430px] w-full mx-auto my-auto py-2">
          {/* Error and Success Feedback Messages */}
          {errorMessage && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-fadeIn">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-fadeIn">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {mode === "register" ? (
            /* ================= REGISTER VIEW ================= */
            <div className="transition-all duration-300 animate-fadeIn">
              <div className="mb-7">
                <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-white mb-2 leading-tight">Start your anime universe.</h1>
                <p className="text-sm text-[#8c97b0] leading-relaxed">Free forever. Personal anime tracking and recommendations.</p>
              </div>

              {/* Form without birth year, google, or import list */}
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-[#9da8c3] mb-1.5">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="username"
                      spellCheck={false}
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Choose a username (e.g. wanderer)"
                      required
                      className="w-full bg-[#12151f] border border-[#23283a] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#505a73] transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[#9da8c3] mb-1.5">Email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[#12151f] border border-[#23283a] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#505a73] transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-[#9da8c3] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password (min. 8 characters)"
                      required
                      className="w-full bg-[#12151f] border border-[#23283a] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[#505a73] tracking-wide transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e6b89] hover:text-[#abb6d1] transition-colors p-1"
                    >
                      {showRegPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Box */}
                <div className="bg-[#121622] border border-[#1f2537] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8c97b0]">
                      Password strength:{" "}
                      <span
                        className={`font-semibold ${
                          regPassword.length === 0 ? "text-[#626e8a]" : strengthScore >= 2 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {strengthLabel}
                      </span>
                    </span>
                    <span className={`text-[11px] font-medium ${strengthScore >= 2 ? "text-emerald-400" : "text-[#626e8a]"}`}>
                      {strengthScore >= 2 ? "All checks passed" : "Minimum 8 chars"}
                    </span>
                  </div>

                  {/* 3 Progress Bars */}
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 1 ? "bg-emerald-400" : "bg-[#252c40]"}`}
                    ></div>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 2 ? "bg-emerald-400" : "bg-[#252c40]"}`}
                    ></div>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 3 ? "bg-emerald-400" : "bg-[#252c40]"}`}
                    ></div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-4 pt-0.5 text-[11px]">
                    <span className={`flex items-center gap-1 transition-colors ${hasMinLength ? "text-emerald-400" : "text-[#5e6983]"}`}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1 transition-colors ${hasSymbolOrNumber ? "text-emerald-400" : "text-[#5e6983]"}`}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Symbol & number
                    </span>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-[#ff5339] to-[#ea3a22] hover:from-[#ff674f] hover:to-[#f24730] text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-[#ff5238]/30 flex items-center justify-center gap-2 group transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create free account</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Disclaimer */}
                <p className="text-[11px] text-[#6d7994] text-center pt-1 leading-normal">
                  By signing up you agree to Terms & Privacy. We only link official streams — no piracy.
                </p>
              </form>
            </div>
          ) : (
            /* ================= LOGIN VIEW ================= */
            <div className="transition-all duration-300 animate-fadeIn">
              {/* Season Live Pill */}
              <div className="inline-flex items-center gap-2 bg-[#141824] border border-[#242b3e] rounded-full px-3 py-1 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs text-[#a0acc7] font-medium">Fall 2026 season is live</span>
              </div>

              <div className="mb-6">
                <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-white mb-2 leading-tight">Welcome back.</h1>
                <p className="text-sm text-[#8c97b0] leading-relaxed">Sign in to continue tracking your watchlist and explore new releases.</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[#9da8c3] mb-1.5">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-[#12151f] border border-[#23283a] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#505a73] transition-all outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-[#9da8c3] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-[#12151f] border border-[#23283a] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[#505a73] tracking-wide transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e6b89] hover:text-[#abb6d1] transition-colors p-1"
                    >
                      {showLoginPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-[#9da8c3] cursor-pointer hover:text-white transition-colors">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        rememberMe ? "bg-[#ff5238] border-[#ff5238] text-white" : "border-[#30384d] bg-[#12151f]"
                      }`}
                    >
                      {rememberMe && (
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" className="text-[#8c97b0] hover:text-[#ff6850] transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-[#ff5339] to-[#ea3a22] hover:from-[#ff674f] hover:to-[#f24730] text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-[#ff5238]/30 flex items-center justify-center gap-2 group transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to WatchNext</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Catch-up Notification Alert Box */}
                <div className="bg-[#121622] border border-[#1f2537] rounded-xl p-3 flex items-start gap-3 mt-4">
                  <div className="w-7 h-7 rounded-lg bg-[#191e2e] border border-[#273047] flex items-center justify-center shrink-0 text-[#ff5b42]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-[#8c97b0] leading-snug">
                    <span className="text-white font-medium">3 new episodes</span> from your watchlist aired while you were away. We&apos;ll catch you up after sign-in.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Switcher Footer */}
        <div className="pt-6 border-t border-[#181d2a] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6e7a96] gap-2">
          <div>
            {mode === "register" ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-white hover:text-[#ff5238] font-semibold underline underline-offset-4 decoration-[#ff5238]/60 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                New to WatchNext?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-white hover:text-[#ff5238] font-semibold underline underline-offset-4 decoration-[#ff5238]/60 transition-colors cursor-pointer"
                >
                  Create account
                </button>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#55617a]">Secured by Supabase Auth</span>
        </div>
      </section>

      {/* ================= RIGHT COLUMN: VISUAL SHOWCASE ================= */}
      <section className="relative w-full lg:w-[52%] xl:w-[54%] min-h-[500px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden">
        {/* Background Artwork */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-art.jpg"
            alt="Anime universe titans key visual"
            fill
            priority
            className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Subtle gradient vignette overlays for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d13] via-[#0b0d13]/40 to-[#0b0d13]/70"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d13] via-transparent to-transparent hidden lg:block"></div>
          <div className="absolute inset-0 bg-[#351859]/20 mix-blend-color"></div>
        </div>

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* Left status badge */}
          <div className="inline-flex items-center gap-2 bg-[#0d1017]/80 backdrop-blur-md border border-[#2b3347]/60 rounded-full px-3.5 py-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-white/90">
              {mode === "register" ? "Free • No card • MAL import ready" : "128k members tracked this week"}
            </span>
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-2">
            <div className="bg-[#0f121a]/85 backdrop-blur-md border border-[#2e374d]/60 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider text-white uppercase shadow-lg">
              #1 TRENDING
            </div>
            <div className="bg-white text-[#0f121a] rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-lg">
              FALL 2026
            </div>
          </div>
        </div>

        {/* Bottom Carousel / Cards & Quote */}
        <div className="relative z-10 mt-auto pt-24 space-y-5">
          {/* 3 Horizontal Anime Preview Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {animeList.map((anime, idx) => {
              const isActive = activeAnimeIndex === idx;
              return (
                <div
                  key={anime.id}
                  onClick={() => setActiveAnimeIndex(idx)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group ${
                    isActive
                      ? "ring-2 ring-[#ff5238] shadow-xl shadow-[#ff5238]/20 scale-[1.02]"
                      : "ring-1 ring-white/10 hover:ring-white/30 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#181c26]">
                    <Image
                      src={anime.image}
                      alt={anime.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>

                    {/* Content inside card */}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col">
                      <span className="text-white text-xs font-semibold truncate leading-tight">{anime.title}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[#d1d7e5] text-[11px] font-medium">{anime.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Anime Quote & Pagination Dots */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
            <div className="max-w-lg space-y-1">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
                {animeList[activeAnimeIndex].quote}
              </p>
              <p className="text-xs text-[#a0acc7] font-medium">{animeList[activeAnimeIndex].subcaption}</p>
            </div>

            {/* Carousel Dot Indicators */}
            <div className="flex items-center gap-1.5 shrink-0">
              {animeList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveAnimeIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeAnimeIndex === idx ? "w-6 h-2 bg-[#ff5238]" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
