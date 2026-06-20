import { useState } from 'react';
import {
  ArrowLeft, Mail, Phone, MapPin, Clock, Send,
  CheckCircle2, Loader2, AlertCircle, MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUBJECTS = [
  'General Inquiry',
  'Report a Counterfeit Product',
  'Manufacturer Registration',
  'Partnership Opportunity',
  'Media & Press',
  'Technical Support',
  'Feedback & Suggestions',
];

const CONTACT_ITEMS = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'info@verifygh.gov.gh',
    sub: 'Response within 1–2 business days',
    bg: 'bg-blue-50',
    color: 'text-accent',
  },
  {
    icon: Phone,
    label: 'Call / WhatsApp',
    value: '+233 30 280 0100',
    sub: 'Mon–Fri, 8:00 AM – 5:00 PM',
    bg: 'bg-primary-50',
    color: 'text-primary',
  },
  {
    icon: MapPin,
    label: 'Visit Us',
    value: 'FDA Headquarters, Accra',
    sub: 'No. 15 Ebo Street, Cantonments, Accra',
    bg: 'bg-orange-50',
    color: 'text-orange-600',
  },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (form.message.trim().length < 10) { setError('Please provide more detail in your message.'); return; }

    setSubmitting(true);
    setError('');

    const { error: dbError } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      subject: form.subject,
      message: form.message.trim(),
    });

    setSubmitting(false);
    if (dbError) { setError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gray-900 px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <button onClick={() => onNavigate('home')} className="relative z-10 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-12">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-5 animate-check-bounce">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">Message Sent!</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-8">
            Thank you, <span className="font-semibold text-gray-700">{form.name.split(' ')[0]}</span>.
            We received your message and will get back to you within 1–2 business days.
          </p>
          <div className="space-y-2.5 w-full max-w-xs">
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
              className="w-full bg-primary text-white font-bold rounded-2xl py-3.5 transition-all active:scale-[0.98]"
            >
              Send Another Message
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl py-3.5 transition-all text-sm active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/[0.03] rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => onNavigate('home')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-5">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-light" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Contact Us</h1>
              <p className="text-white/40 text-xs">We typically reply within 1–2 business days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ── Contact info cards ──────────────────────────────── */}
        <div className="space-y-2.5">
          {CONTACT_ITEMS.map(item => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3.5">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Office hours ────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Office Hours</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Monday – Friday: 8:00 AM – 5:00 PM (GMT)<br />
              Saturday: 9:00 AM – 12:00 PM<br />
              Sunday & Public Holidays: Closed
            </p>
          </div>
        </div>

        {/* ── Contact form ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-800">Send Us a Message</h2>
            <p className="text-xs text-gray-400 mt-0.5">All fields marked * are required</p>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3.5">
            {error && (
              <div className="flex items-center gap-2.5 bg-danger-50 border border-danger-100 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0" />
                <p className="text-sm text-danger-600">{error}</p>
              </div>
            )}

            <FormField label="Full Name *" type="text" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Kwame Mensah" autoComplete="name" />
            <FormField label="Email Address *" type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" autoComplete="email" />
            <FormField label="Phone Number" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+233 XX XXX XXXX" autoComplete="tel" />

            {/* Subject select */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Subject *</label>
              <div className="relative">
                <select
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 appearance-none transition-all"
                >
                  <option value="">Select a subject…</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Message *</label>
              <textarea
                value={form.message}
                onChange={e => set('message', e.target.value)}
                rows={5}
                placeholder="Describe your inquiry in detail…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none transition-all"
              />
              <p className="text-right text-[10px] text-gray-300 mt-0.5">{form.message.length} chars</p>
            </div>

            <button
              type="submit"
              disabled={!form.name || !form.email || !form.subject || !form.message || submitting}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              {submitting
                ? <><Loader2 className="w-5 h-5 animate-spin" />Sending…</>
                : <><Send className="w-4 h-4" />Send Message</>
              }
            </button>
          </form>
        </div>

        {/* Legal note */}
        <p className="text-center text-[11px] text-gray-400 leading-relaxed px-4">
          By submitting this form you agree to our{' '}
          <button onClick={() => onNavigate('privacy')} className="underline hover:text-gray-600">Privacy Policy</button>.
          {' '}We will never share your contact details with third parties.
        </p>
      </div>
    </div>
  );
}

function FormField({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
      />
    </div>
  );
}
