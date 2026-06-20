import { useState, useEffect } from 'react';
import {
  AlertTriangle, MapPin, Clock, PackageSearch, Flame,
  Radio, BarChart3, Plus, X, Package, Building2, Tag,
  Calendar, Globe, ShieldCheck, Hash, QrCode, Copy, Check,
  RefreshCw, LogOut, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './LoginScreen';
import ManufacturerDashboard from './ManufacturerDashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  product_name: string;
  category: string;
  market_location: string | null;
  description: string | null;
  region: string | null;
  created_at: string;
  severity: string | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  fda_approved: boolean;
  verification_code: string | null;
  barcode: string | null;
  created_at: string;
}

type Tab = 'overview' | 'products' | 'alerts';

const CATEGORIES = ['Medicine', 'Agro-input', 'Food & Drink', 'Cosmetics', 'Electronics', 'Textiles', 'Other'];

function generateVerificationCode(brand: string): string {
  const prefix = brand.replace(/[^A-Z0-9]/gi, '').substring(0, 4).toUpperCase().padEnd(4, 'X');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seg = '';
  for (let i = 0; i < 6; i++) seg += chars[Math.floor(Math.random() * chars.length)];
  return `VGH-${prefix}-${String(Date.now()).slice(-4)}-${seg}`;
}

// ─── Root: auth gate + role router ───────────────────────────────────────────

export default function DashboardScreen() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return <LoginScreen />;
  if (profile.role === 'manufacturer') return <ManufacturerDashboard />;
  return <AdminDashboard />;
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ reportsToday: 0, activeHotspots: 0, productsFlagged: 0, totalProducts: 0 });
  const [topFaked, setTopFaked] = useState<{ category: string; count: number }[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [reportsRes, todayRes, allReports, productsRes] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('reports').select('category, market_location, region'),
      supabase.from('products').select('id, name, brand, category, fda_approved, verification_code, barcode, created_at').order('created_at', { ascending: false }),
    ]);
    if (reportsRes.data) setReports(reportsRes.data as Report[]);
    if (productsRes.data) setProducts(productsRes.data as Product[]);
    const allData = allReports.data || [];
    const uniqueLocs = new Set(allData.map((r: { market_location: string | null }) => r.market_location).filter(Boolean)).size;
    const catCounts: Record<string, number> = {};
    allData.forEach((r: { category: string }) => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
    setTopFaked(Object.entries(catCounts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 5));
    setStats({ reportsToday: todayRes.count || 0, activeHotspots: uniqueLocs, productsFlagged: allData.length, totalProducts: productsRes.data?.length || 0 });
    setLoading(false);
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const maxCount = topFaked.length > 0 ? Math.max(...topFaked.map(t => t.count)) : 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gray-900 px-5 pt-12 pb-5 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-1">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full uppercase tracking-wider">Admin</span>
              <h1 className="text-lg font-bold text-white mt-1">Admin Dashboard</h1>
              <p className="text-xs text-white/40">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadData} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                <RefreshCw className="w-4 h-4 text-white/60" />
              </button>
              <button onClick={signOut} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/60 text-xs font-medium px-3 py-2 rounded-xl transition-colors">
                <LogOut className="w-3.5 h-3.5" />Out
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-1 mt-4 bg-white/10 rounded-xl p-1 relative z-10">
          {(['overview', 'products', 'alerts'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 text-xs font-semibold py-2 rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-white/60 hover:text-white/80'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Radio} label="Reports Today" value={stats.reportsToday} iconBg="bg-blue-100" iconColor="text-accent" />
              <MetricCard icon={Flame} label="Active Hotspots" value={stats.activeHotspots} iconBg="bg-orange-100" iconColor="text-orange-600" />
              <MetricCard icon={PackageSearch} label="Total Cases" value={stats.productsFlagged} iconBg="bg-red-100" iconColor="text-danger-500" />
              <MetricCard icon={Package} label="Reg. Products" value={stats.totalProducts} iconBg="bg-green-100" iconColor="text-primary" />
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Most Reported Categories</h3>
              </div>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${100 - i * 20}%` }} />)}</div>
              ) : topFaked.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topFaked.map((item, i) => (
                    <div key={item.category} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-gray-600">{item.category}</span><span className="text-xs font-bold text-gray-800">{item.count}</span></div>
                      <div className="h-5 bg-gray-100 rounded-lg overflow-hidden"><div className="h-full bg-gradient-to-r from-danger-500 to-danger-light rounded-lg" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'products' && (
          <>
            <button onClick={() => setShowAddProduct(true)} className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20">
              <Plus className="w-5 h-5" />Register New Product
            </button>
            {showAddProduct && <AdminAddProductForm onDone={() => { setShowAddProduct(false); loadData(); }} onCancel={() => setShowAddProduct(false)} />}
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100"><div className="h-4 bg-gray-100 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/3" /></div>)}</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><Package className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500 font-medium">No products registered</p></div>
            ) : (
              <div className="space-y-2">
                {products.map((prod, i) => (
                  <div key={prod.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{prod.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{prod.brand}{prod.category ? ` · ${prod.category}` : ''}</p>
                      </div>
                      <span className={`flex-shrink-0 ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.fda_approved ? 'bg-primary-50 text-primary' : 'bg-amber-50 text-amber-600'}`}>{prod.fda_approved ? 'FDA ✓' : 'Pending'}</span>
                    </div>
                    {prod.verification_code && (
                      <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0"><QrCode className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="text-xs font-mono text-gray-600 truncate">{prod.verification_code}</span></div>
                        <button onClick={() => copyCode(prod.verification_code!)} className="ml-2 flex-shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                          {copiedCode === prod.verification_code ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'alerts' && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">Live Counterfeit Reports</span>
              <span className="ml-auto text-xs text-gray-400">{reports.length} total</span>
            </div>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100"><div className="h-4 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-200 rounded w-1/3" /></div>)}</div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No alerts yet</p></div>
            ) : (
              <div className="space-y-2">
                {reports.map((report, i) => (
                  <div key={report.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-danger-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"><AlertTriangle className="w-4 h-4 text-danger-500" /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{report.product_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">{report.category}</span>
                            {report.severity && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${report.severity === 'high' ? 'bg-danger-50 text-danger-500' : report.severity === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'}`}>{report.severity}</span>}
                            {report.market_location && <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><MapPin className="w-2.5 h-2.5" />{report.market_location}</span>}
                            {report.region && <span className="text-[10px] text-gray-400">{report.region}</span>}
                          </div>
                          {report.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{report.description}</p>}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0 ml-2"><Clock className="w-3 h-3" />{timeAgo(report.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Admin add product form ───────────────────────────────────────────────────

function AdminAddProductForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', brand: '', category: '', batch_number: '', manufacture_date: '', expiry_date: '', fda_approved: true, country_of_origin: 'Ghana', registered_by: '' });
  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.name || !form.brand || !form.category) return;
    setSaving(true);
    const code = generateVerificationCode(form.brand);
    await supabase.from('products').insert({
      product_name: form.name, name: form.name, brand: form.brand, category: form.category,
      batch_number: form.batch_number || null, manufacture_date: form.manufacture_date || null,
      expiry_date: form.expiry_date || null, fda_approved: form.fda_approved,
      country_of_origin: form.country_of_origin, registered_by: form.registered_by || null,
      verification_code: code, manufacturer_id: user?.id || null,
    });
    setSaving(false); setSavedCode(code);
  }

  if (savedCode) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-primary-100 shadow-sm">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3"><ShieldCheck className="w-7 h-7 text-primary" /></div>
          <p className="font-semibold text-gray-800">Product Registered!</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center mb-4">
          <p className="font-mono text-base font-bold text-gray-800 tracking-wider break-all">{savedCode}</p>
          <p className="text-xs text-gray-400 mt-1">Print on product packaging</p>
        </div>
        <button onClick={async () => { await navigator.clipboard.writeText(savedCode).catch(() => {}); setCopied(true); setTimeout(onDone, 900); }} className="w-full bg-primary text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all">
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? 'Copied!' : 'Copy Code & Close'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between mb-1"><h3 className="font-semibold text-gray-800">Register Product</h3><button onClick={onCancel} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button></div>
      {[{ key: 'name', label: 'Product Name *', icon: Tag, ph: 'e.g. Paracetamol 500mg' }, { key: 'brand', label: 'Brand *', icon: Building2, ph: 'e.g. Kinapharma' }, { key: 'registered_by', label: 'Registered By', icon: Building2, ph: 'Company name' }, { key: 'batch_number', label: 'Batch Number', icon: Hash, ph: 'e.g. KNP-2025-A1' }, { key: 'country_of_origin', label: 'Country of Origin', icon: Globe, ph: 'Ghana' }].map(f => (
        <div key={f.key}><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{f.label}</label><div className="relative"><f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type="text" value={(form as Record<string, string>)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" /></div></div>
      ))}
      <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Category *</label><select value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"><option value="">Select category</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">{[{ key: 'manufacture_date', label: 'Mfg. Date' }, { key: 'expiry_date', label: 'Expiry Date' }].map(f => (<div key={f.key}><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{f.label}</label><div className="relative"><Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" /><input type="date" value={(form as Record<string, string>)[f.key]} onChange={e => set(f.key, e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div></div>))}</div>
      <div className="flex items-center gap-3 py-1"><button type="button" onClick={() => set('fda_approved', !form.fda_approved)} className={`w-12 h-6 rounded-full transition-colors ${form.fda_approved ? 'bg-primary' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.fda_approved ? 'translate-x-6' : 'translate-x-0'}`} /></button><span className="text-sm text-gray-600 font-medium">FDA Approved</span></div>
      <button onClick={handleSubmit} disabled={!form.name || !form.brand || !form.category || saving} className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all">{saving ? <span className="animate-pulse">Generating Code…</span> : <><QrCode className="w-5 h-5" />Register & Generate Code</>}</button>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, iconBg, iconColor }: { icon: React.ElementType; label: string; value: number; iconBg: string; iconColor: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
