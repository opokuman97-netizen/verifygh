import { useState, useEffect, useCallback } from 'react';
import {
  Package, BarChart3, AlertTriangle, LogOut, RefreshCw,
  Plus, QrCode, Copy, Check, Building2, Tag, Hash,
  Calendar, Globe, ShieldCheck, X, MapPin,
  TrendingUp, ScanLine, FileWarning,
  Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AnalyticsTab } from './ManufacturerAnalytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  fda_approved: boolean;
  verification_code: string | null;
  barcode: string | null;
  batch_number: string | null;
  manufacture_date: string | null;
  expiry_date: string | null;
  created_at: string;
  scan_count?: number;
}

interface ScanRow {
  id: string;
  product_name: string | null;
  result: string;
  created_at: string;
  location: string | null;
  product_id: string | null;
}

interface Report {
  id: string;
  product_name: string;
  category: string;
  market_location: string | null;
  region: string | null;
  description: string | null;
  severity: string | null;
  photo_url: string | null;
  created_at: string;
}

interface OverviewStats {
  totalProducts: number;
  totalScans: number;
  uniqueLocations: number;
  reportCount: number;
}

type Tab = 'overview' | 'products' | 'analytics' | 'reports';

const CATEGORIES = ['Medicine', 'Agro-input', 'Food & Drink', 'Cosmetics', 'Electronics', 'Textiles', 'Other'];
const PAGE_SIZE = 20;

// ─── Code generator ───────────────────────────────────────────────────────────

function generateCode(brand: string): string {
  const prefix = brand.replace(/[^A-Z0-9]/gi, '').substring(0, 4).toUpperCase().padEnd(4, 'X');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seg = '';
  for (let i = 0; i < 6; i++) seg += chars[Math.floor(Math.random() * chars.length)];
  const num = String(Date.now()).slice(-4);
  return `VGH-${prefix}-${num}-${seg}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ManufacturerDashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gray-900 px-5 pt-12 pb-5 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary rounded-full uppercase tracking-wider">
                  Manufacturer
                </span>
              </div>
              <h1 className="text-lg font-bold text-white leading-tight">
                {profile?.company_name || 'Manufacturer Portal'}
              </h1>
              <p className="text-xs text-white/40 mt-0.5">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/60 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-white/10 rounded-xl p-1">
            {([
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'reports', label: 'Reports', icon: FileWarning },
            ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-lg transition-all ${
                  tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-white/50 hover:text-white/75'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats>({ totalProducts: 0, totalScans: 0, uniqueLocations: 0, reportCount: 0 });
  const [recentScans, setRecentScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get manufacturer's product names for cross-referencing
    const { data: myProducts } = await supabase
      .from('products')
      .select('id, name')
      .eq('manufacturer_id', user.id);

    const myProductIds = (myProducts || []).map(p => p.id);
    const myProductNames = (myProducts || []).map(p => p.name).filter(Boolean);

    const [totalProdsRes, scansRes, reportsRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('manufacturer_id', user.id),
      myProductIds.length > 0
        ? supabase.from('scans').select('id, product_name, result, created_at, location').in('product_id', myProductIds).order('created_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: [], count: 0 }),
      myProductNames.length > 0
        ? supabase.from('reports').select('id', { count: 'exact', head: true }).in('product_name', myProductNames)
        : Promise.resolve({ count: 0 }),
    ]);

    const scans = (scansRes.data as ScanRow[]) || [];
    const uniqueLoc = new Set(scans.map(s => s.location).filter(Boolean)).size;

    setStats({
      totalProducts: totalProdsRes.count || 0,
      totalScans: scans.length,
      uniqueLocations: uniqueLoc,
      reportCount: (reportsRes as { count: number | null }).count || 0,
    });
    setRecentScans(scans.slice(0, 5));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    { label: 'My Products', value: stats.totalProducts, icon: Package, bg: 'bg-primary-50', color: 'text-primary' },
    { label: 'Total Scans', value: stats.totalScans, icon: ScanLine, bg: 'bg-blue-50', color: 'text-accent' },
    { label: 'Scan Locations', value: stats.uniqueLocations, icon: MapPin, bg: 'bg-orange-50', color: 'text-orange-600' },
    { label: 'Reports Filed', value: stats.reportCount, icon: AlertTriangle, bg: 'bg-danger-50', color: 'text-danger-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">At a Glance</h2>
        <button onClick={load} className="text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-2.5`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            {loading
              ? <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1" />
              : <p className="text-2xl font-black text-gray-800">{stats.totalProducts > 0 || !loading ? card.value : '—'}</p>
            }
            <p className="text-[11px] text-gray-400 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent scans */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700">Recent Scans</span>
          </div>
          {!loading && <span className="text-xs text-gray-400">{recentScans.length} shown</span>}
        </div>
        {loading ? (
          <div className="p-4 space-y-2.5">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentScans.length === 0 ? (
          <div className="p-8 text-center">
            <ScanLine className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No scans recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentScans.map(scan => (
              <div key={scan.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    scan.result === 'VERIFIED' ? 'bg-primary' :
                    scan.result === 'WARNING' ? 'bg-amber-400' : 'bg-danger-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[160px]">{scan.product_name || 'Unknown'}</p>
                    {scan.location && <p className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{scan.location}</p>}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(scan.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async (pageNum = 0, q = '') => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('products')
      .select('id, name, brand, category, fda_approved, verification_code, barcode, batch_number, manufacture_date, expiry_date, created_at', { count: 'exact' })
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (q) query = query.ilike('name', `%${q}%`);

    const { data, count } = await query;
    setProducts((data as Product[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(0, search); }, [load, search]);

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search products…"
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-semibold rounded-xl px-4 py-2.5 flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {showAddForm && (
        <AddProductForm
          onDone={() => { setShowAddForm(false); load(0, search); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <p className="text-xs text-gray-400">{total} product{total !== 1 ? 's' : ''} registered</p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No products yet</p>
          <p className="text-xs text-gray-400 mt-1">Register products to generate verification codes</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {products.map((prod, i) => (
              <div
                key={prod.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-gray-800 truncate">{prod.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{prod.brand}</span>
                      {prod.category && <><span className="text-gray-200">·</span><span className="text-xs text-gray-400">{prod.category}</span></>}
                      {prod.batch_number && <><span className="text-gray-200">·</span><span className="text-xs font-mono text-gray-400">#{prod.batch_number}</span></>}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                    prod.fda_approved ? 'bg-primary-50 text-primary' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {prod.fda_approved ? 'FDA ✓' : 'Pending'}
                  </span>
                </div>

                {prod.verification_code && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <QrCode className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-gray-600 truncate">{prod.verification_code}</span>
                    </div>
                    <button
                      onClick={() => copyCode(prod.verification_code!)}
                      className="flex-shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copiedCode === prod.verification_code
                        ? <Check className="w-3.5 h-3.5 text-primary" />
                        : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
                disabled={page === 0}
                className="text-sm font-medium text-primary disabled:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-400">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </span>
              <button
                onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
                disabled={(page + 1) * PAGE_SIZE >= total}
                className="text-sm font-medium text-primary disabled:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Add Product Form ─────────────────────────────────────────────────────────

function AddProductForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', brand: '', category: '', batch_number: '',
    manufacture_date: '', expiry_date: '',
    fda_approved: true, country_of_origin: 'Ghana',
  });
  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.name || !form.brand || !form.category || !user) return;
    setSaving(true);
    setError('');
    const code = generateCode(form.brand);
    const { error: err } = await supabase.from('products').insert({
      product_name: form.name,
      name: form.name,
      brand: form.brand,
      category: form.category,
      batch_number: form.batch_number || null,
      manufacture_date: form.manufacture_date || null,
      expiry_date: form.expiry_date || null,
      fda_approved: form.fda_approved,
      country_of_origin: form.country_of_origin,
      verification_code: code,
      manufacturer_id: user.id,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSavedCode(code);
  }

  if (savedCode) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-primary-100 shadow-sm">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <p className="font-bold text-gray-800">Product Registered!</p>
          <p className="text-xs text-gray-500 mt-1">Unique verification code generated:</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center mb-4">
          <p className="font-mono text-base font-bold text-gray-800 tracking-wider break-all">{savedCode}</p>
          <p className="text-xs text-gray-400 mt-1.5">Print this on your product packaging</p>
        </div>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(savedCode).catch(() => {});
            setCopied(true);
            setTimeout(() => onDone(), 900);
          }}
          className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy Code & Close'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Register New Product</h3>
        <button onClick={onCancel} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 rounded-lg p-2.5">{error}</p>}

      {[
        { key: 'name', label: 'Product Name *', icon: Tag, placeholder: 'e.g. Paracetamol 500mg' },
        { key: 'brand', label: 'Brand *', icon: Building2, placeholder: 'e.g. Kinapharma' },
        { key: 'batch_number', label: 'Batch Number', icon: Hash, placeholder: 'e.g. KNP-2025-A1' },
        { key: 'country_of_origin', label: 'Country of Origin', icon: Globe, placeholder: 'Ghana' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">{f.label}</label>
          <div className="relative">
            <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              value={(form as Record<string, string>)[f.key]}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
      ))}

      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Category *</label>
        <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
          <option value="">Select category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{ key: 'manufacture_date', label: 'Mfg. Date' }, { key: 'expiry_date', label: 'Expiry Date' }].map(f => (
          <div key={f.key}>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">{f.label}</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input type="date" value={(form as Record<string, string>)[f.key]} onChange={e => set(f.key, e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-8 pr-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 py-1">
        <button type="button" onClick={() => set('fda_approved', !form.fda_approved)} className={`w-12 h-6 rounded-full transition-colors ${form.fda_approved ? 'bg-primary' : 'bg-gray-300'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.fda_approved ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
        <span className="text-sm text-gray-600 font-medium">FDA Approved</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!form.name || !form.brand || !form.category || saving}
        className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-all"
      >
        {saving
          ? <span className="animate-pulse text-sm">Generating Code…</span>
          : <><QrCode className="w-4.5 h-4.5" /><span className="text-sm">Register & Generate Code</span></>
        }
      </button>
    </div>
  );
}

// ─── Analytics Tab — see ManufacturerAnalytics.tsx ───────────────────────────

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: myProducts } = await supabase
        .from('products').select('name').eq('manufacturer_id', user.id);

      const myNames = (myProducts || []).map(p => p.name).filter(Boolean);

      if (myNames.length === 0) { setReports([]); setLoading(false); return; }

      const { data } = await supabase
        .from('reports')
        .select('id, product_name, category, market_location, region, description, severity, photo_url, created_at')
        .in('product_name', myNames)
        .order('created_at', { ascending: false });

      setReports((data as Report[]) || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.severity === filter);

  const severityStyle: Record<string, string> = {
    high: 'bg-danger-50 text-danger-600 border-danger-100',
    medium: 'bg-orange-50 text-orange-600 border-orange-100',
    low: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 flex-1">
          {(['all', 'high', 'medium', 'low'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg capitalize transition-all ${
                filter === f ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{reports.length === 0 ? 'No counterfeit reports for your products' : `No ${filter}-severity reports`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => (
            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-gray-800 truncate">{r.product_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{r.category}</span>
                    {r.region && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{r.region}</span>}
                    {r.market_location && <span className="text-[10px] text-gray-400">{r.market_location}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${severityStyle[r.severity || 'medium'] || 'bg-gray-100 text-gray-500'}`}>
                    {r.severity || 'medium'}
                  </span>
                  <span className="text-[10px] text-gray-400">{timeAgo(r.created_at)}</span>
                </div>
              </div>
              {r.description && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.description}</p>
              )}
              {r.photo_url && (
                <img src={r.photo_url} alt="Report" className="w-full h-28 object-cover rounded-lg mt-2 border border-gray-100" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
