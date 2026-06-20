import { useState, useEffect, useCallback } from 'react';
import {
  Clock, ShieldCheck, AlertTriangle, XCircle, Search,
  ScanLine, RefreshCw, ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ScanRecord {
  id: string;
  product_name: string;
  result: string;
  scanned_at: string | null;
  created_at?: string;
  location?: string | null;
}

type Filter = 'all' | 'verified' | 'warning' | 'not_registered';

function statusConfig(result: string) {
  if (result === 'verified') return {
    label: 'AUTHENTIC',
    color: 'text-primary',
    bg: 'bg-primary-50',
    pill: 'bg-primary text-white',
    icon: <ShieldCheck className="w-4.5 h-4.5 text-primary" />,
  };
  if (result === 'warning') return {
    label: 'SUSPECTED',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    pill: 'bg-amber-500 text-white',
    icon: <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />,
  };
  return {
    label: 'NOT FOUND',
    color: 'text-danger-500',
    bg: 'bg-danger-50',
    pill: 'bg-danger-500 text-white',
    icon: <XCircle className="w-4.5 h-4.5 text-danger-500" />,
  };
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ScanHistoryScreen({ onBack }: { onBack: () => void }) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 20;

  const fetchScans = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    let query = supabase
      .from('scans')
      .select('*')
      .order('scanned_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (filter !== 'all') query = query.eq('result', filter);
    if (search.trim()) query = query.ilike('product_name', `%${search.trim()}%`);

    const { data } = await query;
    if (data) {
      setScans(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [filter, search]);

  useEffect(() => {
    setPage(0);
    fetchScans(0, true);
  }, [filter, search, fetchScans]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchScans(next, false);
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'verified', label: 'Authentic' },
    { id: 'warning', label: 'Suspected' },
    { id: 'not_registered', label: 'Not Found' },
  ];

  const grouped = scans.reduce<Record<string, ScanRecord[]>>((acc, scan) => {
    const date = new Date(scan.scanned_at || scan.created_at || '').toLocaleDateString('en-GH', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(scan);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Scan History</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product name..."
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                filter === f.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {loading && scans.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ScanLine className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No scans found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== 'all' || search ? 'Try adjusting your filters' : 'Your scan history will appear here'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{date}</span>
              </div>
              <div className="space-y-2">
                {items.map((scan, i) => {
                  const s = statusConfig(scan.result);
                  return (
                    <div
                      key={scan.id}
                      className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100 animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                        {s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {scan.product_name || 'Unknown Product'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold ${s.color}`}>{s.label}</span>
                          {scan.location && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-[10px] text-gray-400 truncate">{scan.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-gray-400">
                          {new Date(scan.scanned_at || scan.created_at || '').toLocaleTimeString('en-GH', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.pill}`}>
                          {scan.result === 'verified' ? '✓' : scan.result === 'warning' ? '!' : '×'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Load More
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
