import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Camera, MapPin, Send, CheckCircle2, X,
  Loader2, AlertTriangle, Shield, Info, Share2, Clock,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Medicine', 'Agro-input', 'Food & Drink', 'Cosmetics',
  'Electronics', 'Textiles', 'Other',
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta',
  'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo',
  'Savannah', 'North East', 'Oti', 'Western North',
];

const SEVERITY = [
  { id: 'low',    label: 'Low',    hint: 'Suspicious but uncertain',        color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'medium', label: 'Medium', hint: 'Likely fake',                     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'high',   label: 'High',   hint: 'Definitely counterfeit or dangerous', color: 'bg-danger-50 text-danger-600 border-danger-200' },
] as const;

type SeverityId = 'low' | 'medium' | 'high';

// ─── Spam guard ───────────────────────────────────────────────────────────────

const SPAM_KEY = 'vgh_report_history_v2';
const MAX_PER_DAY = 3;
const COOLDOWN_MS = 10 * 60 * 1000; // 10 min

function getHistory(): number[] {
  try { return JSON.parse(localStorage.getItem(SPAM_KEY) || '[]'); }
  catch { return []; }
}

function spamCheck(): { ok: boolean; minutesLeft?: number; reason?: string } {
  const day = Date.now() - 86400_000;
  const recent = getHistory().filter(t => t > day);
  if (recent.length >= MAX_PER_DAY) {
    return { ok: false, reason: `You've reached the limit of ${MAX_PER_DAY} reports in 24 hours.` };
  }
  const last = recent[recent.length - 1];
  if (last && Date.now() - last < COOLDOWN_MS) {
    const mins = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 60_000);
    return { ok: false, minutesLeft: mins, reason: `Please wait ${mins} minute${mins !== 1 ? 's' : ''} before submitting another report.` };
  }
  return { ok: true };
}

function recordSubmission() {
  const day = Date.now() - 86400_000;
  const recent = getHistory().filter(t => t > day);
  localStorage.setItem(SPAM_KEY, JSON.stringify([...recent, Date.now()]));
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

async function uploadPhoto(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('report-images')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error || !data) return null;
  const { data: urlData } = supabase.storage.from('report-images').getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Form {
  product_name: string;
  category: string;
  market_location: string;
  description: string;
  region: string;
  severity: SeverityId;
}

interface Coords { lat: number; lng: number }

export default function ReportScreen({
  onBack,
  initialProductName,
}: {
  onBack: () => void;
  initialProductName?: string;
}) {
  const [form, setForm] = useState<Form>({
    product_name: initialProductName || '',
    category: '',
    market_location: '',
    description: '',
    region: '',
    severity: 'medium',
  });
  const [coords, setCoords] = useState<Coords | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'detecting' | 'found' | 'denied'>('idle');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [descChars, setDescChars] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const spam = spamCheck();

  // Auto-detect GPS on mount
  useEffect(() => { detectGps(); }, []);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function detectGps() {
    if (!('geolocation' in navigator)) { setGpsState('denied'); return; }
    setGpsState('detecting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        // Rough Ghana region from coordinates
        let region = 'Greater Accra';
        if (lat > 9.5) region = lng < -1.5 ? 'Upper West' : 'Upper East';
        else if (lat > 8.5) region = lng < -1.2 ? 'Savannah' : 'North East';
        else if (lat > 7.5) region = lng < -2.0 ? 'Northern' : 'Oti';
        else if (lat > 6.5) region = lng < -2.5 ? 'Bono' : lng < -1.5 ? 'Bono East' : 'Volta';
        else if (lat > 5.8) region = lng < -2.0 ? 'Ahafo' : 'Ashanti';
        else if (lat > 5.3) region = lng < -2.5 ? 'Western North' : lng < -1.8 ? 'Western' : 'Eastern';
        else region = lng < -0.6 ? 'Central' : 'Greater Accra';
        set('region', region);
        setGpsState('found');
      },
      () => {
        set('region', 'Greater Accra');
        setGpsState('denied');
      },
      { timeout: 8000 },
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Enforce 5MB limit
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB.'); return; }
    setPhotoFile(file);
    const r = new FileReader();
    r.onload = ev => setPhotoPreview(ev.target?.result as string);
    r.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleDescChange(v: string) {
    set('description', v);
    setDescChars(v.length);
  }

  const descValid = descChars === 0 || descChars >= 20;
  const canSubmit = !!form.product_name.trim() && !!form.category && !submitting && spam.ok && descValid;

  async function handleSubmit() {
    if (!canSubmit) return;

    // Re-check spam at submission time
    const guard = spamCheck();
    if (!guard.ok) { setSubmitError(guard.reason || 'Too many submissions.'); return; }

    setSubmitting(true);
    setSubmitError('');

    let photoUrl: string | null = null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile);
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        product_name: form.product_name.trim(),
        category: form.category,
        market_location: form.market_location.trim() || null,
        description: form.description.trim() || null,
        region: form.region || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        photo_url: photoUrl,
        severity: form.severity,
        status: 'pending',
      })
      .select('report_id_display')
      .single();

    if (error || !data) {
      setSubmitError('Submission failed. Please check your connection and try again.');
      setSubmitting(false);
      return;
    }

    recordSubmission();
    setReportId(data.report_id_display || `RPT-${Date.now().toString(36).toUpperCase().slice(-5)}`);
    setSubmitting(false);
    setSubmitted(true);
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col px-5 pb-10">
        {/* Header */}
        <div className="pt-12 pb-6 flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto">
          {/* Icon */}
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6 animate-check-bounce">
            <CheckCircle2 className="w-14 h-14 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Thank you for helping protect Ghanaians from counterfeit products.
            Authorities have been notified.
          </p>

          {/* Reference card */}
          <div className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
              Your Report Reference
            </p>
            <p className="text-2xl font-black text-primary font-mono tracking-wider">{reportId}</p>
            <p className="text-xs text-gray-400 mt-2">Save this ID to follow up with authorities</p>
          </div>

          {/* Details pill */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-8">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {form.region && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {form.region}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="w-full space-y-2.5">
            <button
              onClick={() => {
                const text = `I reported a suspected counterfeit product (${form.product_name}) to VerifyGH. Report ref: ${reportId}. Help protect Ghana — report fakes at ghverify.com 🇬🇭`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <Share2 className="w-5 h-5" />
              Share Report on WhatsApp
            </button>
            <button
              onClick={onBack}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-600 font-medium rounded-2xl py-3.5 transition-all"
            >
              Back to Home
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
            Powered by <span className="font-semibold">VerifyGH</span> · Ghana Product Authentication Platform
          </p>
        </div>
      </div>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">Report Counterfeit</h1>
          <p className="text-xs text-gray-400">Help protect your community</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1 bg-primary-50 rounded-full px-2.5 py-1">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary">SECURE</span>
          </div>
        </div>
      </div>

      {/* Spam guard warning */}
      {!spam.ok && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Submission limit reached</p>
            <p className="text-xs text-amber-600 mt-0.5">{spam.reason}</p>
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-5">

        {/* ── Section: Product Info ─────────────────────────────────────── */}
        <SectionCard title="Product Information" icon={<Info className="w-4 h-4 text-primary" />}>
          <Field label="Product Name *">
            <input
              type="text"
              value={form.product_name}
              onChange={e => set('product_name', e.target.value)}
              placeholder="What product did you find?"
              className="input-field"
              disabled={!spam.ok}
            />
          </Field>

          <Field label="Category *">
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="input-field appearance-none"
              disabled={!spam.ok}
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Severity">
            <div className="flex gap-2">
              {SEVERITY.map(s => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!spam.ok}
                  onClick={() => set('severity', s.id)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    form.severity === s.id
                      ? s.color + ' border-current scale-[1.02] shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {SEVERITY.find(s => s.id === form.severity)?.hint}
            </p>
          </Field>
        </SectionCard>

        {/* ── Section: Photo ────────────────────────────────────────────── */}
        <SectionCard title="Photo Evidence" icon={<Camera className="w-4 h-4 text-primary" />}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={photoPreview} alt="Product" className="w-full h-52 object-cover" />
              <button
                onClick={clearPhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-black/55 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 pt-8 pb-2.5 px-3">
                <p className="text-[11px] text-white/80 truncate">{photoFile?.name}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!spam.ok}
              className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-primary/40 active:scale-[0.98] disabled:opacity-50 rounded-xl py-7 flex flex-col items-center gap-2.5 transition-all"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">Add photo of product</p>
                <p className="text-xs text-gray-400 mt-0.5">Camera or gallery · Max 5 MB</p>
              </div>
            </button>
          )}
        </SectionCard>

        {/* ── Section: Location ─────────────────────────────────────────── */}
        <SectionCard title="Location" icon={<MapPin className="w-4 h-4 text-primary" />}>

          {/* GPS status pill */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${
                gpsState === 'found' ? 'bg-primary animate-pulse' :
                gpsState === 'detecting' ? 'bg-amber-400 animate-pulse' :
                gpsState === 'denied' ? 'bg-gray-300' : 'bg-gray-300'
              }`} />
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  {gpsState === 'found' && coords
                    ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`
                    : gpsState === 'detecting' ? 'Detecting GPS…'
                    : gpsState === 'denied' ? 'GPS unavailable'
                    : 'Tap Detect to get GPS'}
                </p>
                {form.region && <p className="text-[10px] text-gray-400">{form.region}</p>}
              </div>
            </div>
            <button
              onClick={detectGps}
              disabled={gpsState === 'detecting' || !spam.ok}
              className="text-xs font-semibold text-primary disabled:text-gray-400 flex items-center gap-1"
            >
              {gpsState === 'detecting'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MapPin className="w-3.5 h-3.5" />
              }
              {gpsState === 'detecting' ? 'Detecting' : gpsState === 'found' ? 'Refresh' : 'Detect'}
            </button>
          </div>

          <Field label="Region">
            <select
              value={form.region}
              onChange={e => set('region', e.target.value)}
              className="input-field appearance-none"
              disabled={!spam.ok}
            >
              <option value="">Select region</option>
              {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Market / Location">
            <input
              type="text"
              value={form.market_location}
              onChange={e => set('market_location', e.target.value)}
              placeholder="e.g. Kejetia Market, Kumasi"
              className="input-field"
              disabled={!spam.ok}
            />
          </Field>
        </SectionCard>

        {/* ── Section: Description ─────────────────────────────────────── */}
        <SectionCard
          title="What Looks Suspicious"
          icon={<AlertTriangle className="w-4 h-4 text-primary" />}
        >
          <div className="relative">
            <textarea
              value={form.description}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="Describe what looks fake — poor packaging, wrong label, unusual colour, suspicious seal, unusual smell, etc."
              rows={4}
              disabled={!spam.ok}
              className={`input-field resize-none transition-all ${!descValid ? 'border-danger-300 ring-1 ring-danger-300' : ''}`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {!descValid ? (
                <p className="text-[10px] text-danger-500 font-medium">
                  Minimum 20 characters ({20 - descChars} more needed)
                </p>
              ) : (
                <span />
              )}
              <p className={`text-[10px] ml-auto ${descChars > 500 ? 'text-danger-500' : 'text-gray-400'}`}>
                {descChars}/500
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Submit error */}
        {submitError && (
          <div className="bg-danger-50 border border-danger-100 rounded-2xl p-4 flex gap-2.5">
            <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-600">{submitError}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-primary/20"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Report…
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Report
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-gray-400 leading-relaxed px-4">
          Reports are reviewed by Ghana FDA regulators.
          False reports may result in legal action.
          {!spam.ok && <span className="block text-amber-500 font-semibold mt-1">Submission limit reached — {spam.reason}</span>}
        </p>

      </div>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        {icon}
        <span className="text-sm font-bold text-gray-700">{title}</span>
      </div>
      <div className="px-4 py-4 space-y-3.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
