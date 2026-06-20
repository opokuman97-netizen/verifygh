import { ArrowLeft, MessageSquare, CheckCircle2, XCircle, AlertTriangle, Phone, Send, Smartphone, Star, Info } from 'lucide-react';

const SMS_NUMBER = import.meta.env.VITE_SMS_NUMBER || '1388';

const STEPS = [
  {
    num: 1,
    title: 'Find the code on the product',
    desc: 'Look for a printed code starting with "VGH-" on the packaging, label, or seal.',
    icon: Star,
    color: 'bg-primary-50 text-primary',
    border: 'border-primary-100',
  },
  {
    num: 2,
    title: `Send the code via SMS to ${SMS_NUMBER}`,
    desc: `Open your SMS app, type the code exactly as printed, and send it to ${SMS_NUMBER}.`,
    icon: Send,
    color: 'bg-blue-50 text-accent',
    border: 'border-blue-100',
  },
  {
    num: 3,
    title: 'Receive your instant reply',
    desc: 'Within seconds you will get a reply telling you if the product is Authentic, Fake, or Not Found.',
    icon: MessageSquare,
    color: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
];

const RESULT_EXAMPLES = [
  {
    tag: 'AUTHENTIC ✓',
    tagBg: 'bg-primary-50',
    tagColor: 'text-primary',
    border: 'border-primary-100',
    icon: CheckCircle2,
    iconColor: 'text-primary',
    title: 'Safe to Use',
    body: 'VERIFYGH: AUTHENTIC ✓\nParacetamol 500mg by Kinapharma is GENUINE & FDA Approved. Safe to use.\nExpiry: Dec 2026\nStay safe – VerifyGH',
  },
  {
    tag: 'NOT FOUND ✗',
    tagBg: 'bg-danger-50',
    tagColor: 'text-danger-500',
    border: 'border-danger-100',
    icon: XCircle,
    iconColor: 'text-danger-500',
    title: 'Product Not in Database',
    body: 'VERIFYGH: NOT FOUND ✗\nCode "VGH-XXXX-0000-AAAA" not in database. This product may be COUNTERFEIT.\nDo NOT use. Report: verifygh.com\n– VerifyGH',
  },
  {
    tag: 'WARNING ⚠',
    tagBg: 'bg-amber-50',
    tagColor: 'text-amber-600',
    border: 'border-amber-100',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    title: 'Expired or Unapproved',
    body: 'VERIFYGH: WARNING ⚠\nProduct XYZ by ABC: This product is EXPIRED.\nDo NOT use. Report fake goods at verifygh.com\n– VerifyGH',
  },
];

export default function SMSInfoScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-gray-900 px-5 pt-12 pb-8 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <button onClick={onBack} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-5">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-primary-light" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">SMS Verification</h1>
              <p className="text-white/50 text-xs">Works on all mobile phones</p>
            </div>
          </div>

          {/* Key highlight */}
          <div className="flex items-center gap-2.5 bg-white/10 rounded-2xl px-4 py-3 mt-4">
            <Phone className="w-5 h-5 text-primary-light flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">No smartphone or internet needed</p>
              <p className="text-white/50 text-xs mt-0.5">Any basic mobile phone with SMS can verify products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Send to number card */}
        <div className="bg-primary rounded-2xl px-5 py-5 shadow-lg shadow-primary/20 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Send Your Product Code To</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-white tracking-widest">{SMS_NUMBER}</p>
          </div>
          <p className="text-white/60 text-xs mt-1.5">Standard SMS rates apply · Available 24/7</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-light rounded-full animate-pulse" />
            <span className="text-white/70 text-xs">Service active</span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800">How It Works</h2>
            <p className="text-xs text-gray-400 mt-0.5">3 simple steps</p>
          </div>
          <div className="divide-y divide-gray-50">
            {STEPS.map(step => (
              <div key={step.num} className="px-4 py-4 flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${step.color} ${step.border}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Step {step.num}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SMS example conversation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800">Example SMS Conversation</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[80%]">
                <p className="text-[10px] text-gray-400 text-right mb-1">You → {SMS_NUMBER}</p>
                <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                  <p className="text-white font-mono text-sm font-semibold">VGH-KINA-2025-AB12</p>
                </div>
              </div>
            </div>
            {/* System reply */}
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <p className="text-[10px] text-gray-400 mb-1">{SMS_NUMBER} → You</p>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-gray-700 text-xs leading-relaxed font-mono whitespace-pre-line">
                    {'VERIFYGH: AUTHENTIC ✓\nParacetamol 500mg by Kinapharma is GENUINE & FDA Approved. Safe to use.\nExpiry: Dec 2026\nStay safe - VerifyGH'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reply types */}
        <div>
          <h2 className="text-sm font-bold text-gray-800 mb-2.5">Understanding the Reply</h2>
          <div className="space-y-2.5">
            {RESULT_EXAMPLES.map(ex => (
              <div key={ex.tag} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${ex.border}`}>
                <div className={`px-4 py-2.5 flex items-center gap-2.5 border-b ${ex.border} ${ex.tagBg}`}>
                  <ex.icon className={`w-4 h-4 flex-shrink-0 ${ex.iconColor}`} />
                  <span className={`text-xs font-black ${ex.tagColor}`}>{ex.tag}</span>
                  <span className="text-xs text-gray-500 ml-1">— {ex.title}</span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-line">{ex.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-gray-50 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-800">Tips for Accurate Results</h2>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {[
              { tip: 'Type the code exactly as printed — include all dashes (-)' },
              { tip: 'Codes start with "VGH-" followed by letters and numbers' },
              { tip: 'If the code has spaces on the packaging, replace them with dashes' },
              { tip: 'Send "HELP" to get a reminder of how the service works' },
              { tip: 'Check your SMS inbox — the reply arrives within seconds' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who this is for */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-4 flex items-start gap-3">
          <Smartphone className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-primary">Works on All Phones</p>
            <p className="text-xs text-primary/70 leading-relaxed mt-1">
              This service works on any mobile phone that can send SMS — including basic Nokia and feature phones.
              No internet connection, no app, and no data bundle required.
              Available to all Ghanaians across all networks.
            </p>
          </div>
        </div>

        {/* Language note */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5">
          <p className="text-xs text-amber-700 font-semibold mb-1">Supported networks in Ghana</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            MTN · Vodafone · AirtelTigo · Glo · All Ghanaian mobile networks (
            <span className="font-medium">+233</span> numbers)
          </p>
        </div>

        {/* Powered by */}
        <p className="text-center text-[11px] text-gray-400 pb-2">
          Powered by <span className="font-semibold">VerifyGH</span> · Ghana Product Authentication Platform
          <br />SMS API: Africa's Talking · Database: Ghana FDA Registry
        </p>
      </div>
    </div>
  );
}
