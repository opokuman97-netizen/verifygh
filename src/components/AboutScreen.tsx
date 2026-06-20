import {
  ArrowLeft, Shield, Target, Users, BarChart3, Globe,
  CheckCircle2, Zap, Heart, Award, ChevronRight, MessageSquare,
  ScanLine, Phone,
} from 'lucide-react';

const MISSION_POINTS = [
  { icon: Shield, title: 'Protect Consumers', desc: 'Empower every Ghanaian to instantly verify the authenticity of products before use.' },
  { icon: Target, title: 'Eliminate Counterfeits', desc: 'Disrupt the counterfeit supply chain by making fake products impossible to sell undetected.' },
  { icon: Users, title: 'Support Manufacturers', desc: 'Give legitimate businesses the tools to protect their brand reputation and market share.' },
  { icon: Globe, title: 'Strengthen Regulation', desc: 'Provide regulators with real-time data to identify hotspots and take swift enforcement action.' },
];

const VERIFICATION_METHODS = [
  {
    icon: ScanLine,
    title: 'Scan QR / Barcode',
    desc: 'Use our mobile app to instantly scan a product\'s QR code or barcode for real-time verification.',
    tag: 'Smartphone',
    tagBg: 'bg-primary-50 text-primary',
  },
  {
    icon: MessageSquare,
    title: 'SMS Verification',
    desc: 'Send the product code via SMS to our shortcode. Instant reply — no internet, no app required.',
    tag: 'Any Phone',
    tagBg: 'bg-blue-50 text-accent',
  },
  {
    icon: Phone,
    title: 'Manual Code Check',
    desc: 'Enter the printed verification code (VGH-XXXX) manually in the app to verify on the spot.',
    tag: 'All Devices',
    tagBg: 'bg-amber-50 text-amber-700',
  },
];

const CORE_VALUES = [
  { icon: Shield, label: 'Integrity' },
  { icon: Zap, label: 'Speed' },
  { icon: Heart, label: 'Public Good' },
  { icon: Award, label: 'Excellence' },
];

const PARTNERS = [
  'Ghana Food & Drugs Authority (FDA)',
  'Ghana Standards Authority (GSA)',
  'Ghana Police Service — CID',
  'Ministry of Health, Ghana',
  'Ghana Revenue Authority',
];

export default function AboutScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-5 pt-12 pb-10 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/[0.03] rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => onNavigate('home')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">VerifyGH</h1>
              <p className="text-white/40 text-xs">Ghana Product Authentication Platform</p>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-relaxed max-w-sm">
            Fighting counterfeit products across Ghana — protecting consumers,
            manufacturers, and the national economy since 2024.
          </p>

          {/* Quick stats */}
          <div className="flex gap-4 mt-5">
            {[
              { value: '50K+', label: 'Verifications' },
              { value: '200+', label: 'Brands Protected' },
              { value: '16', label: 'Regions Covered' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-white font-black text-lg leading-none">{s.value}</p>
                <p className="text-white/40 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* ── The Problem ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-danger-50 border-b border-danger-100 px-4 py-3 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-danger-500 rounded-full" />
            <h2 className="text-sm font-black text-danger-700 uppercase tracking-wide">The Problem</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Counterfeit products pose a serious and growing threat to Ghana.
              Fake medicines, substandard agro-inputs, and fraudulent consumer goods
              cost the Ghanaian economy over <span className="font-bold text-danger-600">GH₵ 2 billion annually</span> and
              are directly linked to preventable deaths and crop failures.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { stat: '1 in 3', desc: 'Medicines in West Africa are substandard or falsified', color: 'bg-danger-50 text-danger-600 border-danger-100' },
                { stat: '40%', desc: 'Of reported agro-input fraud originates from counterfeit products', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                { stat: 'GH₵2B', desc: 'Estimated annual economic loss from counterfeit goods in Ghana', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                { stat: '3,000+', desc: 'Consumer complaints filed with Ghana FDA in 2023 alone', color: 'bg-red-50 text-red-700 border-red-100' },
              ].map(item => (
                <div key={item.stat} className={`rounded-xl p-3 border ${item.color}`}>
                  <p className="text-xl font-black leading-none mb-1">{item.stat}</p>
                  <p className="text-[10px] leading-tight opacity-80">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Our Mission ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-primary-50 border-b border-primary-100 px-4 py-3 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-primary rounded-full" />
            <h2 className="text-sm font-black text-primary-800 uppercase tracking-wide">Our Mission</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            {MISSION_POINTS.map(pt => (
              <div key={pt.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <pt.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{pt.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How We Work ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-800">How VerifyGH Works</h2>
            <p className="text-xs text-gray-400 mt-0.5">Three ways to verify any product</p>
          </div>
          <div className="divide-y divide-gray-50">
            {VERIFICATION_METHODS.map(m => (
              <div key={m.title} className="px-4 py-4 flex items-start gap-3.5">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <m.icon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-800">{m.title}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.tagBg}`}>{m.tag}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Partners & Affiliations ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-800">Partners & Affiliations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Working with Ghana's leading institutions</p>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {PARTNERS.map(p => (
              <div key={p} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-gray-700">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Core Values ─────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20" />
          <div className="relative z-10 px-4 py-5">
            <h2 className="text-sm font-black text-white mb-4">Our Core Values</h2>
            <div className="grid grid-cols-4 gap-3">
              {CORE_VALUES.map(v => (
                <div key={v.label} className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center">
                    <v.icon className="w-5 h-5 text-primary-light" />
                  </div>
                  <span className="text-[10px] text-white/60 font-semibold text-center">{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Impact Snapshot ─────────────────────────────────── */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black text-primary-800">Our Impact (2024–2025)</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '50,000+', label: 'Product verifications processed' },
              { value: '1,200+', label: 'Counterfeit reports submitted' },
              { value: '400+', label: 'Manufacturers registered' },
              { value: '16/16', label: 'Ghanaian regions served' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-primary-100">
                <p className="text-lg font-black text-primary leading-none">{s.value}</p>
                <p className="text-[10px] text-primary/60 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <button
            onClick={() => onNavigate('contact')}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            Get in Touch
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-white border border-gray-200 hover:border-gray-300 active:scale-[0.98] text-gray-700 font-semibold rounded-2xl py-3.5 transition-all text-sm"
          >
            Start Verifying Products
          </button>
        </div>

        {/* Legal footer */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { label: 'Privacy Policy', screen: 'privacy' },
            { label: 'Terms of Service', screen: 'terms' },
          ].map(l => (
            <button key={l.screen} onClick={() => onNavigate(l.screen)} className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-center text-[11px] text-gray-300 pb-2">
          © 2025 VerifyGH Ltd. · Accra, Ghana · All rights reserved.
        </p>
      </div>
    </div>
  );
}
