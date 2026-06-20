import { useState, useEffect } from 'react';
import { ScanLine, ShieldCheck, AlertTriangle, XCircle, Clock, Flag, ChevronRight, Shield, MessageSquare, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SMS_NUMBER = import.meta.env.VITE_SMS_NUMBER || '1388';

interface ScanRecord {
  id: string;
  product_name: string;
  result: string;
  scanned_at: string | null;
  created_at?: string;
}

function statusConfig(result: string) {
  if (result === 'verified') return {
    label: 'AUTHENTIC',
    color: 'text-primary',
    bg: 'bg-primary-50',
    dot: 'bg-primary',
    icon: <ShieldCheck className="w-4 h-4 text-primary" />,
  };
  if (result === 'warning') return {
    label: 'SUSPECTED',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  };
  return {
    label: 'NOT FOUND',
    color: 'text-danger-500',
    bg: 'bg-danger-50',
    dot: 'bg-danger-500',
    icon: <XCircle className="w-4 h-4 text-danger-500" />,
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomeScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState({ verified: 0, reported: 0, brands: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [verifiedRes, reportsRes, brandsRes, scansRes] = await Promise.all([
        supabase.from('scans').select('id', { count: 'exact', head: true }).eq('result', 'verified'),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('brand'),
        supabase.from('scans').select('id, product_name, result, scanned_at, created_at')
          .order('scanned_at', { ascending: false }).limit(3),
      ]);
      const uniqueBrands = new Set((brandsRes.data || []).map((b: { brand: string }) => b.brand)).size;
      setStats({
        verified: verifiedRes.count ?? 0,
        reported: reportsRes.count ?? 0,
        brands: uniqueBrands,
      });
      if (scansRes.data) setRecentScans(scansRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 flex flex-col">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <div className="relative bg-primary-800 flex flex-col items-center pt-14 pb-10 px-5 overflow-hidden flex-shrink-0">
        {/* Background geometry */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-light/50 to-transparent" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/[0.03] rounded-full" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/[0.04] rounded-full" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-2.5 mb-3 self-start">
          <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">VerifyGH</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 self-start mb-8">
          <p className="text-white/90 text-base font-medium leading-snug max-w-[260px]">
            Verify products instantly.
          </p>
          <p className="text-white/55 text-sm leading-snug max-w-[280px] mt-0.5">
            Protect yourself from counterfeits in Ghana.
          </p>
        </div>

        {/* ── SCAN BUTTON ── */}
        <div className="relative z-10 w-full">
          <button
            onClick={() => onNavigate('scan')}
            className="relative w-full bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-100 shadow-2xl shadow-black/30"
            style={{ minHeight: '140px' }}
          >
            {/* Green inner background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white" />

            {/* Corner scan brackets */}
            <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-primary rounded-tl-sm" />
            <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-primary rounded-tr-sm" />
            <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-primary rounded-bl-sm" />
            <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-primary rounded-br-sm" />

            {/* Animated scan line */}
            <div className="absolute inset-x-8 top-0 h-full overflow-hidden pointer-events-none">
              <div className="scan-line absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                {/* Pulse rings */}
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.8s' }} />
                <div className="absolute inset-[-8px] rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center relative shadow-lg shadow-primary/40">
                  <ScanLine className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 tracking-tight">Scan Product</p>
                <p className="text-sm text-gray-500 mt-0.5">QR code · Barcode · Verification code</p>
              </div>
            </div>
          </button>
        </div>

        {/* Live badge */}
        <div className="relative z-10 flex items-center gap-1.5 mt-4">
          <div className="w-1.5 h-1.5 bg-primary-light rounded-full animate-pulse" />
          <span className="text-[11px] text-white/50 font-medium">Ghana FDA database · Updated live</span>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4 space-y-4">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('report')}
            className="bg-white border border-danger-100 rounded-2xl py-4 px-4 flex items-center gap-3 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Flag className="w-5 h-5 text-danger-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Report</p>
              <p className="text-[11px] text-gray-400 leading-tight">Fake goods</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="bg-white border border-gray-100 rounded-2xl py-4 px-4 flex items-center gap-3 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">History</p>
              <p className="text-[11px] text-gray-400 leading-tight">Past scans</p>
            </div>
          </button>
        </div>

        {/* SMS Verification Banner */}
        <button
          onClick={() => onNavigate('sms-info')}
          className="w-full bg-gray-900 rounded-2xl px-4 py-4 flex items-center gap-3.5 active:scale-[0.98] transition-all shadow-sm overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-primary/20 to-transparent" />
          <div className="relative z-10 w-11 h-11 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-primary-light" />
          </div>
          <div className="relative z-10 flex-1 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-bold text-sm">No Internet? Use SMS</p>
              <span className="text-[9px] font-bold bg-primary/30 text-primary-light px-1.5 py-0.5 rounded-full uppercase tracking-wide">Free</span>
            </div>
            <p className="text-white/50 text-xs">
              Send product code to <span className="text-white/80 font-bold font-mono">{SMS_NUMBER}</span> · Any phone
            </p>
          </div>
          <ArrowRight className="relative z-10 w-4 h-4 text-white/30 flex-shrink-0" />
        </button>

        {/* Stats strip */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { value: loading ? '—' : stats.verified.toLocaleString(), label: 'Products\nVerified', color: 'text-primary' },
              { value: loading ? '—' : stats.reported.toLocaleString(), label: 'Fakes\nReported', color: 'text-danger-500' },
              { value: loading ? '—' : stats.brands.toLocaleString(), label: 'Brands\nRegistered', color: 'text-accent' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center py-4 px-2">
                <p className={`text-2xl font-bold ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 text-center leading-tight mt-1 whitespace-pre-line">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scans */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-semibold text-gray-700">Recent Scans</p>
            {recentScans.length > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-primary font-semibold"
              >
                View All
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl p-3.5 animate-pulse border border-gray-100">
                  <div className="h-3.5 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <div className="bg-white rounded-2xl px-5 py-8 text-center border border-gray-100">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ScanLine className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">No scans yet</p>
              <p className="text-xs text-gray-300 mt-0.5">Tap Scan Product above to start</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((scan, i) => {
                const s = statusConfig(scan.result);
                return (
                  <div
                    key={scan.id}
                    className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 border border-gray-100 shadow-sm animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                        {scan.product_name || 'Unknown Product'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold ${s.color}`}>{s.label}</span>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-[10px] text-gray-400">
                          {timeAgo(scan.scanned_at || scan.created_at || '')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3.5">
          <ShieldCheck className="w-7 h-7 text-primary flex-shrink-0" />
          <p className="text-xs text-primary/70 leading-relaxed">
            <span className="font-semibold text-primary">Ghana FDA-connected.</span>{' '}
            All verifications are checked against the official product registry.
          </p>
        </div>

        {/* ── Footer navigation ─────────────────────────────── */}
        <div className="border-t border-gray-200 pt-4 pb-2">
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[
              { label: 'About Us', screen: 'about' },
              { label: 'Contact', screen: 'contact' },
              { label: 'Privacy', screen: 'privacy' },
              { label: 'Terms', screen: 'terms' },
            ].map(link => (
              <button
                key={link.screen}
                onClick={() => onNavigate(link.screen)}
                className="text-[11px] text-gray-400 hover:text-primary font-medium py-2 px-1 text-center transition-colors rounded-lg hover:bg-primary-50"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] font-bold text-gray-500">VerifyGH</span>
          </div>
          <p className="text-center text-[10px] text-gray-300 leading-relaxed">
            © 2025 VerifyGH Limited · Ghana Product Authentication Platform<br />
            Protecting Ghanaian consumers since 2024
          </p>
        </div>
      </div>
    </div>
  );
}
