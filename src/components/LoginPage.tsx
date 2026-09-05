import React, { useState } from 'react';
import { UserSession } from '../types';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Play,
  Cpu,
  Zap,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Send,
  Building2,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
  onBackToLanding: () => void;
  onDirectLaunchStudio: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  onDirectLaunchStudio,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'otp_login'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'candidate' | 'interviewer' | 'recruiter'>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfoMessage, setSuccessInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification View State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string | null>(null);

  // Helper to safely parse JSON responses and provide clear error messages for gateway/proxy timeouts
  const safeParseJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_e) {
      if (res.status === 504 || res.status === 502 || res.status === 503) {
        throw new Error('Backend server is waking up. Please retry in a few seconds.');
      }
      if (text.includes('An error occurred') || text.includes('FUNCTION_INVOCATION_TIMEOUT') || text.includes('Gateway')) {
        throw new Error('Server connection timed out. Your account may already be created; please try Sign In.');
      }
      throw new Error(`Server returned unexpected status (${res.status}). Please try again.`);
    }
  };

  const handleDemoLogin = async (preset: {
    name: string;
    email: string;
    role: 'candidate' | 'interviewer' | 'recruiter';
    targetTitle?: string;
    initials: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: preset.email,
          password: 'password123',
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      if (data.token) {
        localStorage.setItem('vocalis_jwt_token', data.token);
      }

      const user: UserSession = {
        id: data.user.id,
        name: data.user.name || preset.name,
        email: data.user.email,
        role: data.user.role,
        targetTitle: preset.targetTitle,
        avatarInitials: preset.initials,
        isLoggedIn: true,
        isDemo: true,
      };

      onLoginSuccess(user);
    } catch (err: any) {
      console.warn('[Demo Auth Fallback]', err);
      const user: UserSession = {
        id: `usr-${Date.now()}`,
        name: preset.name,
        email: preset.email,
        role: preset.role,
        targetTitle: preset.targetTitle,
        avatarInitials: preset.initials,
        isLoggedIn: true,
      };
      onLoginSuccess(user);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfoMessage(null);

    try {
      if (authTab === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: fullName.trim() || email.split('@')[0],
            role,
          }),
        });

        const data = await safeParseJson(res);
        if (!res.ok) {
          if (data.error && data.error.toLowerCase().includes('already exists')) {
            throw new Error('An account with this email already exists. Please switch to Sign In.');
          }
          throw new Error(data.error || 'Registration failed');
        }

        if (data.token) {
          localStorage.setItem('vocalis_jwt_token', data.token);
        }

        // Direct instant login upon account registration
        if (data.user) {
          const initials = (data.user.name || fullName || email)
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          const user: UserSession = {
            id: data.user.id,
            name: data.user.name || fullName || email.split('@')[0],
            email: data.user.email,
            role: data.user.role,
            avatarInitials: initials || 'US',
            isLoggedIn: true,
          };

          onLoginSuccess(user);
          return;
        }

        if (data.otpCodeSimulated) {
          setSimulatedOtpCode(data.otpCodeSimulated);
        }

        setStep('otp');
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await safeParseJson(res);
        if (!res.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }

        if (data.token) {
          localStorage.setItem('vocalis_jwt_token', data.token);
        }

        const initials = (data.user.name || email)
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();

        const user: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatarInitials: initials || 'US',
          isLoggedIn: true,
        };

        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfoMessage(null);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP code');
      }

      if (data.otpCodeSimulated) {
        setSimulatedOtpCode(data.otpCodeSimulated);
      }

      setSuccessInfoMessage('6-digit OTP login code sent to your email!');
      setStep('otp');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = authTab === 'otp_login' ? '/api/auth/login-with-otp' : '/api/auth/verify-otp';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otpInput.trim() }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'OTP Verification failed');
      }

      if (data.token) {
        localStorage.setItem('vocalis_jwt_token', data.token);
      }

      const initials = (data.user.name || fullName || email)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const user: UserSession = {
        id: data.user.id,
        name: data.user.name || fullName || email.split('@')[0],
        email: data.user.email,
        role: data.user.role,
        avatarInitials: initials || 'US',
        isLoggedIn: true,
      };

      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-indigo-600 selection:text-white font-sans">
      {/* Top Back Navigation Bar */}
      <div className="w-full max-w-5xl mx-auto px-4 flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Overview</span>
        </button>

        <button
          type="button"
          onClick={onDirectLaunchStudio}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
        >
          <span>Launch Voice Studio</span>
          <Play className="w-3 h-3 fill-indigo-400" />
        </button>
      </div>

      {/* Main Header */}
      <div className="w-full max-w-5xl mx-auto text-center px-4 mb-6">
        <img
          src="/logo.jpg"
          alt="Vocalis AI Logo"
          className="w-12 h-12 rounded-2xl object-cover border border-indigo-500/40 shadow-xl shadow-indigo-600/30 mx-auto mb-3"
        />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {step === 'otp'
            ? 'Enter 6-Digit OTP Code'
            : authTab === 'otp_login'
            ? 'Passwordless OTP Login'
            : authTab === 'signup'
            ? 'Create Vocalis AI Candidate Session'
            : 'Sign in to Vocalis AI Studio'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Real-time AI Voice Interview Platform with Multi-Role Committee Panel
        </p>
      </div>

      {/* Main Card Container (Wide 2-Column Side-by-Side Layout) */}
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="bg-slate-900 shadow-2xl rounded-3xl border border-slate-800 p-6 sm:p-8">
          {step === 'otp' ? (
            /* OTP Code Entry Screen (Centered View) */
            <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto space-y-4">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <KeyRound className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-300">
                  We sent a 6-digit code to <strong className="text-white">{email}</strong> via Nodemailer SMTP.
                </p>

                {successInfoMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    {successInfoMessage}
                  </div>
                )}

                {simulatedOtpCode && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono text-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Verification Code (Instant Demo / Cloud Backup)
                    </span>
                    <strong className="text-2xl text-white font-mono tracking-widest block">{simulatedOtpCode}</strong>
                    <button
                      type="button"
                      onClick={() => setOtpInput(simulatedOtpCode)}
                      className="inline-block text-[11px] font-sans font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 px-2.5 py-1 rounded-lg transition border border-indigo-500/40 cursor-pointer"
                    >
                      Click to Auto-fill Code
                    </button>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="e.g. 584920"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code & Enter Studio</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setAuthTab('signin');
                  setSuccessInfoMessage(null);
                  setErrorMessage(null);
                }}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-2 transition cursor-pointer"
              >
                ← Or Sign In with Password Instead
              </button>
            </form>
          ) : (
            /* Side-by-Side 2-Column Grid: Sign In / Register on Left, Demo Logins on Right */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Sign In / Register / Passwordless Form */}
              <div className="md:col-span-7 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
                {/* Tab Switcher: Sign In vs Create Account */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                      authTab === 'signin' || authTab === 'otp_login'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signup');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                      authTab === 'signup'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium space-y-1.5">
                    <div>{errorMessage}</div>
                    {errorMessage.toLowerCase().includes('already exists') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('signin');
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                      >
                        Click here to Sign In with your password →
                      </button>
                    )}
                  </div>
                )}

                {/* Form Render: Password Auth vs OTP Request */}
                {authTab === 'otp_login' ? (
                  /* Passwordless OTP Code Request Form */
                  <form onSubmit={handleRequestOtpLogin} className="space-y-3">
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                      <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Forgot Password / OTP Code Login</span>
                      </p>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Enter your email address to receive a 6-digit login OTP code instantly without a password.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="candidate@company.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-white" />
                          <span>Send Login OTP Code</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Standard Password Login or Registration Form */
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    {authTab === 'signup' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-300">Full Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Jordan Reed"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none transition"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="candidate@company.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs text-white focus:border-indigo-500 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {authTab === 'signup' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-300">Account Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'candidate', label: 'Candidate' },
                            { key: 'recruiter', label: 'Recruiter / Hiring Team' },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setRole(item.key as any)}
                              className={`text-[11px] py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                                role === item.key
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Remember session</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          <span>
                            {authTab === 'signup'
                              ? 'Create Account'
                              : 'Sign In with Password'}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* OR Divider & OTP Code Login Action */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-slate-800 absolute" />
                    <span className="bg-slate-950 px-2.5 text-[9px] uppercase font-bold text-slate-500 relative z-10">
                      OR
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab(authTab === 'otp_login' ? 'signin' : 'otp_login');
                      setErrorMessage(null);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'otp_login'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {authTab === 'otp_login'
                        ? '← Back to Password Login'
                        : 'Forgot Password? Use OTP Code Login'}
                    </span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Demo Account Logins Section */}
              <div className="md:col-span-5 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Demo Account Logins</span>
                    </h3>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      Instant Access
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Explore Vocalis AI immediately with pre-configured 1-click verified test accounts.
                  </p>
                </div>

                <div className="space-y-2.5 pt-0.5">
                  {/* Candidate Practice Demo Account */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        <span>Candidate Practice</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Jordan Reed</span>
                    </div>
                    <p className="text-[11px] text-slate-200 font-semibold truncate">candidate@vocalis.ai</p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Practice real-time technical & product interviews with full resume memory.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        handleDemoLogin({
                          name: 'Jordan Reed',
                          email: 'candidate@vocalis.ai',
                          role: 'candidate',
                          targetTitle: 'Senior Distributed Systems Architect',
                          initials: 'JR',
                        })
                      }
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Login as Candidate Demo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Hiring Team / Recruiter Demo Account */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Hiring Team & Recruiter</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Neha Kapoor</span>
                    </div>
                    <p className="text-[11px] text-slate-200 font-semibold truncate">recruiter@vocalis.ai</p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Access recruiter dashboard, scorecards, quote citations & committee panel builder.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        handleDemoLogin({
                          name: 'Neha Kapoor',
                          email: 'recruiter@vocalis.ai',
                          role: 'recruiter',
                          targetTitle: 'Lead Technical Recruiter & Chair',
                          initials: 'NK',
                        })
                      }
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Login as Hiring Team Demo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
