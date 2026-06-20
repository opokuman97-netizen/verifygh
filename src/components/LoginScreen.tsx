import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, Building2, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tab = 'signin' | 'register';

export default function LoginScreen({ onSuccess }: { onSuccess?: () => void }) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Sign-in fields
  const [siEmail, setSiEmail] = useState('');
  const [siPass, setSiPass] = useState('');

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regName, setRegName] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!siEmail || !siPass) return;
    setLoading(true);
    setError('');
    const res = await signIn(siEmail.trim(), siPass);
    setLoading(false);
    if (res.error) {
      setError(res.error.includes('Invalid') ? 'Invalid email or password.' : res.error);
    } else {
      onSuccess?.();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regEmail || !regPass || !regCompany) return;
    if (regPass !== regPassConfirm) { setError('Passwords do not match.'); return; }
    if (regPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    const res = await signUp(regEmail.trim(), regPass, regCompany.trim(), regName.trim() || undefined);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setRegistered(true);
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 pb-24">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-5 animate-check-bounce">
          <ShieldCheck className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Registration Submitted</h2>
        <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed mb-6">
          Your manufacturer account request has been submitted.
          Check your email to confirm your account, then sign in.
        </p>
        <button
          onClick={() => { setRegistered(false); setTab('signin'); setRegEmail(''); setRegPass(''); setRegPassConfirm(''); setRegCompany(''); setRegName(''); }}
          className="bg-primary text-white font-semibold rounded-2xl py-3.5 px-8 transition-all hover:bg-primary-dark active:scale-[0.98]"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Branded header */}
      <div className="bg-gray-900 px-5 pt-16 pb-10 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">VerifyGH</h1>
          <p className="text-white/50 text-sm mt-1">Manufacturer & Regulator Portal</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">

        {/* Tab switcher */}
        <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm mb-6">
          {(['signin', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2.5 bg-danger-50 border border-danger-100 rounded-xl p-3.5 mb-4">
            <AlertCircle className="w-4.5 h-4.5 text-danger-500 flex-shrink-0" />
            <p className="text-sm text-danger-600">{error}</p>
          </div>
        )}

        {/* ── Sign In form ────────────────────────────────────── */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <AuthField
              icon={Mail}
              label="Email Address"
              type="email"
              value={siEmail}
              onChange={setSiEmail}
              placeholder="you@company.com"
              autoComplete="email"
            />
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={siPass}
                  onChange={e => setSiPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!siEmail || !siPass || loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Register form ───────────────────────────────────── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <AuthField icon={Building2} label="Company / Manufacturer Name *" type="text" value={regCompany} onChange={setRegCompany} placeholder="e.g. Kinapharma Ltd" autoComplete="organization" />
            <AuthField icon={User} label="Your Full Name" type="text" value={regName} onChange={setRegName} placeholder="e.g. Kwame Mensah (optional)" autoComplete="name" />
            <AuthField icon={Mail} label="Work Email *" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@company.com" autoComplete="email" />
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Password * (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="input-field pl-10 pr-11"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={regPassConfirm}
                  onChange={e => setRegPassConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="input-field pl-10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!regEmail || !regPass || !regPassConfirm || !regCompany || loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 mt-1"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Creating Account…' : 'Create Manufacturer Account'}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-gray-400 leading-relaxed mt-6 px-4">
          Access is restricted to registered manufacturers and regulators.
          Misuse may result in legal action under Ghanaian law.
        </p>
      </div>
    </div>
  );
}

function AuthField({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  icon: React.ElementType;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input-field pl-10"
        />
      </div>
    </div>
  );
}
