import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, MapPin, TrendingUp, TrendingDown, Minus,
  ScanLine, ShieldCheck, AlertTriangle, Globe, RefreshCw,
  Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyStat { date: string; count: number; }
interface RegionStat { region: string; scans: number; fakes: number; }
interface ProductStat { name: string; scans: number; authentic: number; }
interface WeeklyStat { week: string; count: number; }

interface AnalyticsData {
  daily: DailyStat[];
  regionStats: RegionStat[];
  topProducts: ProductStat[];
  weeklyReports: WeeklyStat[];
  authentic: number;
  warning: number;
  notFound: number;
  totalAllTime: number;
}

type Range = 7 | 30 | 90;

// ─── Ghana Regions Map Data ───────────────────────────────────────────────────

const GHANA_REGIONS: { name: string; x: number; y: number; abbr: string }[] = [
  { name: 'Upper West',    x: 42,  y: 50,  abbr: 'UW' },
  { name: 'Upper East',    x: 155, y: 42,  abbr: 'UE' },
  { name: 'North East',    x: 195, y: 75,  abbr: 'NE' },
  { name: 'Northern',      x: 130, y: 88,  abbr: 'NO' },
  { name: 'Savannah',      x: 70,  y: 90,  abbr: 'SV' },
  { name: 'Oti',           x: 202, y: 145, abbr: 'OT' },
  { name: 'Bono',          x: 78,  y: 143, abbr: 'BO' },
  { name: 'Bono East',     x: 148, y: 148, abbr: 'BE' },
  { name: 'Ahafo',         x: 102, y: 183, abbr: 'AH' },
  { name: 'Ashanti',       x: 148, y: 192, abbr: 'AS' },
  { name: 'Eastern',       x: 192, y: 200, abbr: 'EA' },
  { name: 'Volta',         x: 230, y: 192, abbr: 'VO' },
  { name: 'Western North', x: 82,  y: 215, abbr: 'WN' },
  { name: 'Central',       x: 143, y: 250, abbr: 'CE' },
  { name: 'Western',       x: 78,  y: 260, abbr: 'WE' },
  { name: 'Greater Accra', x: 195, y: 260, abbr: 'GA' },
];

// Approximate Ghana border polygon (simplified, viewBox 260×310)
const GHANA_BORDER =
  'M 40,280 L 80,292 L 125,295 L 185,290 L 215,275 L 240,250 L 245,212 ' +
  'L 240,162 L 215,110 L 200,72 L 215,45 L 170,30 L 145,25 L 100,30 ' +
  'L 55,42 L 32,65 L 30,120 L 35,165 L 38,215 L 40,280 Z';

function normalizeToRegion(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  const map: [string[], string][] = [
    [['accra', 'tema', 'ashaiman', 'ga east', 'ga west', 'greater accra'], 'Greater Accra'],
    [['kumasi', 'obuasi', 'ejisu', 'ashanti', 'mampong'], 'Ashanti'],
    [['takoradi', 'sekondi', 'axim', 'western'], 'Western'],
    [['cape coast', 'winneba', 'saltpond', 'central'], 'Central'],
    [['ho', 'hohoe', 'keta', 'aflao', 'volta'], 'Volta'],
    [['koforidua', 'nkawkaw', 'suhum', 'eastern'], 'Eastern'],
    [['sunyani', 'bono '], 'Bono'],
    [['techiman', 'nkoranza', 'bono east'], 'Bono East'],
    [['tamale', 'yendi', 'northern'], 'Northern'],
    [['bolgatanga', 'navrongo', 'bawku', 'upper east'], 'Upper East'],
    [['wa ', 'lawra', 'nandom', 'upper west'], 'Upper West'],
    [['damongo', 'salaga', 'savannah'], 'Savannah'],
    [['nalerigu', 'gambaga', 'north east'], 'North East'],
    [['dambai', 'nkwanta', 'oti'], 'Oti'],
    [['goaso', 'kukuom', 'ahafo'], 'Ahafo'],
    [['sefwi', 'bibiani', 'western north'], 'Western North'],
  ];
  for (const [keys, region] of map) {
    if (keys.some(k => s.includes(k))) return region;
  }
  // Try direct match
  for (const r of GHANA_REGIONS) {
    if (s.includes(r.name.toLowerCase())) return r.name;
  }
  return null;
}

// ─── SVG Chart: Smooth Line Chart ────────────────────────────────────────────

function LineChart({
  data,
  color = '#16a34a',
  height = 110,
  showDots = true,
}: {
  data: DailyStat[];
  color?: string;
  height?: number;
  showDots?: boolean;
}) {
  if (data.length === 0) return null;
  const W = 340; const H = height;
  const pad = { l: 4, r: 4, t: 8, b: 20 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const max = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * chartW,
    y: pad.t + chartH - (d.count / max) * chartH,
    ...d,
  }));

  // Smooth cubic bezier path
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1]; const c = pts[i];
    const cpx = (p.x + c.x) / 2;
    linePath += ` C ${cpx} ${p.y} ${cpx} ${c.y} ${c.x} ${c.y}`;
  }

  // Area path (close below)
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.t + chartH} L ${pts[0].x} ${pad.t + chartH} Z`;

  // Visible x-axis labels: first, middle, last
  const labelIdxs = new Set([0, Math.floor(data.length / 2), data.length - 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad.l} x2={pad.l + chartW} y1={pad.t + chartH * (1 - f)} y2={pad.t + chartH * (1 - f)} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#lineGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {showDots && pts.map((p, i) => (
        p.count > 0 && <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
      ))}
      {/* X-axis labels */}
      {pts.map((p, i) => labelIdxs.has(i) && (
        <text key={i} x={p.x} y={H - 2} textAnchor="middle" fontSize="8" fill="#9ca3af">
          {p.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

// ─── SVG Chart: Donut Chart ───────────────────────────────────────────────────

function DonutChart({
  authentic, warning, notFound,
}: { authentic: number; warning: number; notFound: number }) {
  const total = authentic + warning + notFound || 1;
  const R = 38; const cx = 55; const cy = 55; const sw = 14;
  const circ = 2 * Math.PI * R;

  const segs = [
    { val: authentic, color: '#16a34a' },
    { val: warning,   color: '#f59e0b' },
    { val: notFound,  color: '#ef4444' },
  ];

  let offset = 0;
  const paths = segs.map((s, i) => {
    const dash = (s.val / total) * circ;
    const el = (
      <circle
        key={i} cx={cx} cy={cy} r={R}
        fill="none" stroke={s.color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
    );
    offset += dash;
    return el;
  });

  const rate = Math.round((authentic / (total)) * 100);

  return (
    <svg viewBox="0 0 110 110" className="w-full">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
      {paths}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#111827">{rate}%</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="#6b7280">Authentic</text>
    </svg>
  );
}

// ─── SVG Map: Ghana Regions ───────────────────────────────────────────────────

function GhanaMap({ regionStats, onSelect, selected }: {
  regionStats: RegionStat[];
  onSelect: (r: string | null) => void;
  selected: string | null;
}) {
  const maxScans = Math.max(...regionStats.map(r => r.scans), 1);

  function getRegionData(name: string) {
    return regionStats.find(r => r.region === name) || { scans: 0, fakes: 0 };
  }

  function regionColor(scans: number, fakes: number): string {
    if (scans === 0) return '#e5e7eb';
    const fakeRate = fakes / scans;
    if (fakeRate > 0.3) return '#ef4444';
    if (fakeRate > 0.15) return '#f59e0b';
    return '#16a34a';
  }

  function regionOpacity(scans: number): number {
    if (scans === 0) return 1;
    return 0.4 + (scans / maxScans) * 0.6;
  }

  function circleRadius(scans: number): number {
    if (scans === 0) return 9;
    return 9 + (scans / maxScans) * 11;
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 260 310" className="w-full max-w-[260px] mx-auto">
        {/* Ghana border */}
        <path d={GHANA_BORDER} fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Region circles */}
        {GHANA_REGIONS.map(region => {
          const data = getRegionData(region.name);
          const r = circleRadius(data.scans);
          const color = regionColor(data.scans, data.fakes);
          const opacity = regionOpacity(data.scans);
          const isSelected = selected === region.name;

          return (
            <g
              key={region.name}
              onClick={() => onSelect(isSelected ? null : region.name)}
              className="cursor-pointer"
            >
              {isSelected && (
                <circle cx={region.x} cy={region.y} r={r + 4} fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
              )}
              <circle
                cx={region.x} cy={region.y} r={r}
                fill={color} opacity={opacity}
                className="transition-all duration-200"
              />
              <text
                x={region.x} y={region.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={r > 13 ? "7" : "6"} fontWeight="700" fill="white"
              >
                {region.abbr}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {[
          { color: '#16a34a', label: 'Authentic' },
          { color: '#f59e0b', label: '>15% Fakes' },
          { color: '#ef4444', label: '>30% Fakes' },
          { color: '#e5e7eb', label: 'No data' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-[9px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HorizontalBars({ items, color = '#16a34a' }: {
  items: { label: string; value: number; sub?: string }[];
  color?: string;
}) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 w-3.5 text-right">{i + 1}</span>
              <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-gray-800">{item.value}</span>
              {item.sub && <span className="text-[10px] text-gray-400 ml-1">{item.sub}</span>}
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Weekly Bar Chart ─────────────────────────────────────────────────────────

function WeeklyBars({ data }: { data: WeeklyStat[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => {
        const pct = max > 0 ? Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0) : 0;
        const isRecent = i === data.length - 1;
        return (
          <div key={d.week} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-gray-400 font-medium">{d.count > 0 ? d.count : ''}</span>
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{ height: `${Math.max(pct, 4)}%`, background: isRecent ? '#ef4444' : '#fca5a5' }}
            />
            <span className="text-[8px] text-gray-300">{d.week.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchAnalytics(
  userId: string,
  days: Range,
): Promise<AnalyticsData> {
  const { data: myProducts } = await supabase
    .from('products').select('id, name').eq('manufacturer_id', userId);

  const ids = (myProducts || []).map(p => p.id);
  const names = (myProducts || []).map(p => p.name).filter(Boolean);

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [scansRes, allTimeRes, reportsRes] = await Promise.all([
    ids.length
      ? supabase.from('scans').select('created_at, result, location, region, product_name')
          .in('product_id', ids).gte('created_at', since.toISOString())
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from('scans').select('id', { count: 'exact', head: true }).in('product_id', ids)
      : Promise.resolve({ count: 0 }),
    names.length
      ? supabase.from('reports').select('created_at, region, market_location, severity, product_name')
          .in('product_name', names).gte('created_at', since.toISOString())
      : Promise.resolve({ data: [] }),
  ]);

  const scans = (scansRes.data || []) as {
    created_at: string; result: string; location: string | null;
    region: string | null; product_name: string | null;
  }[];
  const reports = (reportsRes.data || []) as {
    created_at: string; region: string | null; market_location: string | null;
    severity: string | null; product_name: string | null;
  }[];

  // Daily scan counts
  const dayMap: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  scans.forEach(s => { const k = s.created_at.slice(0, 10); if (k in dayMap) dayMap[k]++; });
  const daily = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // Result distribution
  let authentic = 0, warning = 0, notFound = 0;
  scans.forEach(s => {
    const r = s.result?.toUpperCase() || '';
    if (r === 'VERIFIED' || r === 'AUTHENTIC') authentic++;
    else if (r === 'WARNING') warning++;
    else notFound++;
  });

  // Region stats from scans
  const regionScanMap: Record<string, { scans: number; fakes: number }> = {};
  scans.forEach(s => {
    const reg = s.region || normalizeToRegion(s.location);
    if (!reg) return;
    if (!regionScanMap[reg]) regionScanMap[reg] = { scans: 0, fakes: 0 };
    regionScanMap[reg].scans++;
    const r = s.result?.toUpperCase() || '';
    if (r === 'WARNING') regionScanMap[reg].fakes++;
  });
  // Overlay fake counts from reports
  reports.forEach(r => {
    const reg = r.region || normalizeToRegion(r.market_location);
    if (!reg) return;
    if (!regionScanMap[reg]) regionScanMap[reg] = { scans: 0, fakes: 0 };
    if (!r.severity || r.severity !== 'low') regionScanMap[reg].fakes += 0.5;
  });
  const regionStats: RegionStat[] = Object.entries(regionScanMap).map(([region, d]) => ({
    region, scans: d.scans, fakes: Math.round(d.fakes),
  }));

  // Top products
  const prodMap: Record<string, { scans: number; authentic: number }> = {};
  scans.forEach(s => {
    if (!s.product_name) return;
    if (!prodMap[s.product_name]) prodMap[s.product_name] = { scans: 0, authentic: 0 };
    prodMap[s.product_name].scans++;
    if ((s.result?.toUpperCase() || '') === 'VERIFIED') prodMap[s.product_name].authentic++;
  });
  const topProducts = Object.entries(prodMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.scans - a.scans).slice(0, 6);

  // Weekly report counts (last 8 weeks)
  const weekMap: Record<string, number> = {};
  for (let w = 7; w >= 0; w--) {
    const d = new Date(); d.setDate(d.getDate() - w * 7);
    weekMap[d.toISOString().slice(0, 10)] = 0;
  }
  reports.forEach(r => {
    const rDate = new Date(r.created_at);
    const keys = Object.keys(weekMap).sort();
    for (let i = keys.length - 1; i >= 0; i--) {
      if (new Date(keys[i]) <= rDate) { weekMap[keys[i]]++; break; }
    }
  });
  const weeklyReports = Object.entries(weekMap).sort().map(([week, count]) => ({ week, count }));

  return {
    daily, regionStats, topProducts, weeklyReports,
    authentic, warning, notFound,
    totalAllTime: (allTimeRes as { count: number | null }).count || 0,
  };
}

// ─── Main Analytics Tab ───────────────────────────────────────────────────────

export function AnalyticsTab() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await fetchAnalytics(user.id, range);
    setData(result);
    setLoading(false);
  }, [user, range]);

  useEffect(() => { load(); }, [load]);

  const total = (data?.authentic ?? 0) + (data?.warning ?? 0) + (data?.notFound ?? 0);
  const authRate = total > 0 ? Math.round(((data?.authentic ?? 0) / total) * 100) : 0;
  const alertRate = total > 0 ? Math.round(((data?.warning ?? 0) / total) * 100) : 0;
  const regionsCovered = data?.regionStats.filter(r => r.scans > 0).length ?? 0;

  // Trend vs previous period (simple: compare first half to second half of daily data)
  let trend: 'up' | 'down' | 'flat' = 'flat';
  if (data) {
    const half = Math.floor(data.daily.length / 2);
    const first = data.daily.slice(0, half).reduce((a, d) => a + d.count, 0);
    const second = data.daily.slice(half).reduce((a, d) => a + d.count, 0);
    if (second > first * 1.1) trend = 'up';
    else if (second < first * 0.9) trend = 'down';
  }

  // Region detail panel
  const regionDetail = selectedRegion
    ? data?.regionStats.find(r => r.region === selectedRegion)
    : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[100, 140, 200, 160].map((h, i) => (
          <div key={i} className="bg-white rounded-2xl animate-pulse border border-gray-100" style={{ height: h }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Time range + refresh ────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-xl p-1">
          {([7, 30, 90] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
                range === r ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
        <button onClick={load} className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {
            label: 'Total Scans', value: total.toLocaleString(),
            sub: `${data?.totalAllTime.toLocaleString()} all-time`,
            icon: ScanLine, bg: 'bg-primary-50', color: 'text-primary',
            badge: trend === 'up' ? '↑ Trending up' : trend === 'down' ? '↓ Down' : '→ Stable',
            badgeBg: trend === 'up' ? 'bg-primary-100 text-primary' : trend === 'down' ? 'bg-danger-50 text-danger-500' : 'bg-gray-100 text-gray-500',
          },
          {
            label: 'Authenticity Rate', value: `${authRate}%`,
            sub: `${data?.authentic ?? 0} authentic`,
            icon: ShieldCheck, bg: 'bg-primary-50', color: 'text-primary',
            badge: authRate > 85 ? 'Excellent' : authRate > 70 ? 'Good' : 'Review needed',
            badgeBg: authRate > 85 ? 'bg-primary-100 text-primary' : authRate > 70 ? 'bg-amber-100 text-amber-700' : 'bg-danger-50 text-danger-500',
          },
          {
            label: 'Alert Rate', value: `${alertRate}%`,
            sub: `${data?.warning ?? 0} warnings`,
            icon: AlertTriangle, bg: 'bg-danger-50', color: 'text-danger-500',
            badge: alertRate > 20 ? 'High — Investigate' : alertRate > 10 ? 'Moderate' : 'Low',
            badgeBg: alertRate > 20 ? 'bg-danger-50 text-danger-500' : alertRate > 10 ? 'bg-amber-50 text-amber-700' : 'bg-primary-50 text-primary',
          },
          {
            label: 'Regions Covered', value: `${regionsCovered}`,
            sub: `of 16 Ghana regions`,
            icon: Globe, bg: 'bg-blue-50', color: 'text-accent',
            badge: regionsCovered >= 10 ? 'National reach' : regionsCovered >= 5 ? 'Regional' : 'Local',
            badgeBg: regionsCovered >= 10 ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-gray-500',
          },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
            <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center mb-2`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-xl font-black text-gray-800 leading-none">{kpi.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${kpi.badgeBg}`}>
              {kpi.badge}
            </span>
            <p className="text-[11px] text-gray-500 font-semibold mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Scan Trend ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700">Scan Volume Trend</span>
          </div>
          <div className="flex items-center gap-1.5">
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-primary" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-danger-500" />}
            {trend === 'flat' && <Minus className="w-3.5 h-3.5 text-gray-400" />}
            <span className={`text-[11px] font-bold ${trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-danger-500' : 'text-gray-400'}`}>
              {trend === 'up' ? 'Upward trend' : trend === 'down' ? 'Downward trend' : 'Stable'}
            </span>
          </div>
        </div>
        <div className="px-4 pt-3 pb-4">
          {total === 0 ? (
            <div className="h-28 flex items-center justify-center">
              <p className="text-sm text-gray-400">No scan data for this period</p>
            </div>
          ) : (
            <LineChart data={data?.daily ?? []} />
          )}
        </div>
      </div>

      {/* ── Result Distribution ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">Verification Outcomes</span>
          {total > 0 && <span className="text-xs text-gray-400 ml-auto">{total} total</span>}
        </div>
        {total === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data</p>
        ) : (
          <div className="px-4 py-4 flex items-center gap-5">
            <div className="w-28 flex-shrink-0">
              <DonutChart authentic={data?.authentic ?? 0} warning={data?.warning ?? 0} notFound={data?.notFound ?? 0} />
            </div>
            <div className="flex-1 space-y-2.5">
              {[
                { label: 'Authentic', count: data?.authentic ?? 0, color: 'bg-primary', text: 'text-primary', dot: '#16a34a' },
                { label: 'Suspected Fake', count: data?.warning ?? 0, color: 'bg-amber-400', text: 'text-amber-600', dot: '#f59e0b' },
                { label: 'Not Found', count: data?.notFound ?? 0, color: 'bg-danger-400', text: 'text-danger-500', dot: '#ef4444' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${item.text}`}>
                      {total > 0 ? Math.round(item.count / total * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Ghana Heatmap ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">Geographic Distribution</span>
          <span className="text-xs text-gray-400 ml-auto">Tap a region</span>
        </div>
        <div className="px-4 pt-3 pb-4">
          <GhanaMap regionStats={data?.regionStats ?? []} onSelect={setSelectedRegion} selected={selectedRegion} />

          {/* Selected region detail */}
          {selectedRegion && (
            <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-800">{selectedRegion}</p>
                <button onClick={() => setSelectedRegion(null)} className="text-[10px] text-gray-400 hover:text-gray-600">✕ Close</button>
              </div>
              {regionDetail ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Scans', value: regionDetail.scans, color: 'text-primary' },
                    { label: 'Fake Alerts', value: regionDetail.fakes, color: 'text-danger-500' },
                    { label: 'Alert Rate', value: regionDetail.scans > 0 ? `${Math.round(regionDetail.fakes / regionDetail.scans * 100)}%` : '—', color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No data recorded for this region yet.</p>
              )}
            </div>
          )}

          {/* Top hotspots list */}
          {(data?.regionStats.filter(r => r.fakes > 0) ?? []).length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Counterfeit Hotspots</p>
              <div className="space-y-1.5">
                {(data?.regionStats ?? [])
                  .filter(r => r.fakes > 0)
                  .sort((a, b) => (b.fakes / Math.max(b.scans, 1)) - (a.fakes / Math.max(a.scans, 1)))
                  .slice(0, 4)
                  .map(r => (
                    <div key={r.region} className="flex items-center gap-2.5 py-1.5 px-2.5 bg-danger-50 rounded-lg border border-danger-100">
                      <AlertTriangle className="w-3.5 h-3.5 text-danger-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 flex-1">{r.region}</span>
                      <span className="text-xs font-bold text-danger-500">{r.fakes} alerts</span>
                      <span className="text-[10px] text-gray-400">
                        {r.scans > 0 ? `${Math.round(r.fakes / r.scans * 100)}% fake rate` : ''}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Products ─────────────────────────────────────── */}
      {(data?.topProducts.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700">Top Products by Scans</span>
          </div>
          <div className="px-4 py-4">
            <HorizontalBars
              items={(data?.topProducts ?? []).map(p => ({
                label: p.name,
                value: p.scans,
                sub: p.scans > 0 ? `${Math.round(p.authentic / p.scans * 100)}% auth` : '',
              }))}
            />
          </div>
        </div>
      )}

      {/* ── Report Frequency ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">Counterfeit Report Frequency</span>
          <span className="text-xs text-gray-400 ml-auto">by week</span>
        </div>
        <div className="px-4 pt-3 pb-4">
          {(data?.weeklyReports.every(w => w.count === 0)) ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-sm text-gray-400">No reports filed yet</p>
            </div>
          ) : (
            <WeeklyBars data={data?.weeklyReports ?? []} />
          )}
          {(data?.weeklyReports ?? []).some(w => w.count > 0) && (
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Total {(data?.weeklyReports ?? []).reduce((a, w) => a + w.count, 0)} reports in last {range} days
            </p>
          )}
        </div>
      </div>

      {/* ── Period note ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <p className="text-[11px] text-gray-500">
          Showing data for the <span className="font-bold">last {range} days</span>.
          All-time: <span className="font-bold">{data?.totalAllTime.toLocaleString()} total scans</span>.
        </p>
      </div>
    </div>
  );
}
