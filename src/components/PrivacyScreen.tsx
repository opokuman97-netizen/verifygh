import { ArrowLeft, Shield, ChevronRight } from 'lucide-react';

const LAST_UPDATED = 'June 1, 2025';

const SECTIONS = [
  {
    id: '1',
    title: '1. Introduction',
    content: `VerifyGH Limited ("VerifyGH", "we", "us", or "our") is committed to protecting the privacy and personal information of all users of the VerifyGH product authentication platform, including the mobile application, website, and SMS verification service (collectively, the "Services").

This Privacy Policy explains how we collect, use, disclose, store, and protect your personal information when you access or use our Services. By using VerifyGH, you agree to the practices described in this policy.

VerifyGH is incorporated in Ghana and operates in accordance with the Data Protection Act, 2012 (Act 843) of Ghana.`,
  },
  {
    id: '2',
    title: '2. Information We Collect',
    content: `We collect the following categories of information:

2.1 Information You Provide Directly
• Contact form submissions: name, email address, phone number, and message content
• Manufacturer registration: company name, business registration, contact details, and product data
• Counterfeit reports: product details, location, photographs, and incident descriptions

2.2 Information Collected Automatically
• Scan history: product codes scanned, verification results, timestamps, and general location (city/region level) when you permit location access
• Device information: device type, operating system, and app version for technical support purposes
• Usage analytics: screens visited, actions taken, and session duration to improve the service

2.3 SMS Verification Data
• When you use SMS verification, we collect your mobile phone number and the product code you submitted. This data is used solely to process your verification request and improve service quality.`,
  },
  {
    id: '3',
    title: '3. How We Use Your Information',
    content: `We use the information we collect for the following purposes:

• Product verification: to look up and return authentication results in real time
• Service improvement: to analyse usage patterns and improve the platform's accuracy and reliability
• Communication: to respond to your inquiries, support requests, or counterfeit reports
• Regulatory compliance: to share verified counterfeit incident data with Ghana FDA, Ghana Police Service, and other authorised enforcement bodies
• Security: to detect and prevent fraud, abuse, or misuse of the platform
• Analytics: to generate anonymised statistics on counterfeiting trends for public policy purposes

We do not use your personal information for marketing or advertising to third parties.`,
  },
  {
    id: '4',
    title: '4. Sharing Your Information',
    content: `We may share information in the following limited circumstances:

4.1 Government & Regulatory Bodies
Counterfeit reports, incident data, and aggregated trend statistics may be shared with the Ghana Food and Drugs Authority (FDA), Ghana Standards Authority (GSA), Ghana Police Service, and other authorised enforcement agencies for regulatory and law enforcement purposes.

4.2 Service Providers
We engage trusted third-party service providers (e.g. cloud hosting, SMS gateways) who process data on our behalf under strict data processing agreements. These providers may not use your data for any other purpose.

4.3 Legal Requirements
We may disclose information if required to do so by law, court order, or in response to a lawful request by public authorities.

4.4 We Do Not Sell Your Data
VerifyGH does not sell, rent, or trade personal information to any third party for commercial gain.`,
  },
  {
    id: '5',
    title: '5. Data Security',
    content: `We implement industry-standard security measures to protect your personal information:

• All data is encrypted in transit using TLS 1.2 or higher
• Databases are secured using role-based access control (RBAC) and row-level security
• Authentication tokens are short-lived and rotated regularly
• Phone numbers in SMS verification logs are access-restricted to authorised administrators only
• We conduct regular security reviews of our infrastructure

Despite our best efforts, no method of transmission over the internet or electronic storage is 100% secure. In the event of a data breach affecting your information, we will notify you and relevant authorities as required under Ghanaian law.`,
  },
  {
    id: '6',
    title: '6. Data Retention',
    content: `We retain personal data only for as long as necessary:

• Scan history: retained for 12 months, then anonymised
• Counterfeit reports: retained indefinitely for regulatory evidence purposes, with identifying details anonymised after 24 months unless required for active enforcement
• Contact form submissions: retained for 24 months
• SMS verification logs: phone numbers are pseudonymised after 6 months; aggregated verification statistics are retained indefinitely
• Manufacturer account data: retained for the duration of the account and 5 years thereafter for compliance purposes

You may request early deletion of your data (see Section 7).`,
  },
  {
    id: '7',
    title: '7. Your Rights',
    content: `Under the Data Protection Act, 2012 (Act 843) of Ghana, you have the following rights:

• Right of access: You may request a copy of personal information we hold about you
• Right to correction: You may request correction of inaccurate or incomplete information
• Right to erasure: You may request deletion of your personal data, subject to our legal obligations
• Right to object: You may object to processing of your data for certain purposes
• Right to data portability: You may request your data in a structured, machine-readable format

To exercise any of these rights, contact us at privacy@verifygh.gov.gh or use the Contact page. We will respond within 30 days.`,
  },
  {
    id: '8',
    title: '8. Cookies & Local Storage',
    content: `The VerifyGH mobile application uses local device storage to save your scan history and app preferences locally on your device. This data does not leave your device unless you explicitly share it.

The VerifyGH website may use essential session cookies required for authentication and security. We do not use tracking or advertising cookies.`,
  },
  {
    id: '9',
    title: '9. Children\'s Privacy',
    content: `VerifyGH Services are not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately and we will delete it promptly.`,
  },
  {
    id: '10',
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify registered users of material changes via the app or by email. The "Last Updated" date at the top of this policy indicates when it was most recently revised. Continued use of our Services after changes are posted constitutes your acceptance of the revised policy.`,
  },
  {
    id: '11',
    title: '11. Contact & Data Controller',
    content: `VerifyGH Limited is the data controller for personal information processed under this policy.

Data Protection Officer:
VerifyGH Limited
No. 15 Ebo Street, Cantonments
Accra, Ghana

Email: privacy@verifygh.gov.gh
Phone: +233 30 280 0100

You have the right to lodge a complaint with the Data Protection Commission of Ghana if you believe your rights have been infringed.`,
  },
];

export default function PrivacyScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gray-900 px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/[0.03] rounded-full" />
        <div className="relative z-10">
          <button onClick={() => onNavigate('home')} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-5">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white/70" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Privacy Policy</h1>
              <p className="text-white/40 text-xs">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-3.5 py-2.5">
            <p className="text-white/70 text-xs leading-relaxed">
              This policy describes how VerifyGH Limited collects, uses, and protects your personal information in accordance with the{' '}
              <span className="text-white font-semibold">Data Protection Act, 2012 (Act 843)</span> of Ghana.
            </p>
          </div>
        </div>
      </div>

      {/* ── Table of contents ───────────────────────────────────── */}
      <div className="px-4 pt-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Contents</h2>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
          <div className="px-4 py-2 grid grid-cols-2 gap-x-4">
            {SECTIONS.slice(0, 8).map(s => (
              <p key={s.id} className="text-[11px] text-gray-500 py-1 border-b border-gray-50 last:border-0 truncate">
                {s.title}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections ────────────────────────────────────────────── */}
      <div className="px-4 space-y-3 pb-4">
        {SECTIONS.map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-800">{section.title}</h2>
            </div>
            <div className="px-4 py-4">
              {section.content.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                if (line.startsWith('•')) {
                  return (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      <p className="text-xs text-gray-600 leading-relaxed">{line.slice(1).trim()}</p>
                    </div>
                  );
                }
                if (line.match(/^\d+\.\d+/)) {
                  return <p key={i} className="text-xs font-bold text-gray-700 mt-3 mb-1">{line}</p>;
                }
                return <p key={i} className="text-xs text-gray-600 leading-relaxed mb-1">{line}</p>;
              })}
            </div>
          </div>
        ))}

        {/* Legal compliance note */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-xs font-black text-primary-800 uppercase tracking-wide">Governing Law</p>
          </div>
          <p className="text-xs text-primary/70 leading-relaxed">
            This Privacy Policy is governed by and construed in accordance with the laws of the Republic of Ghana.
            Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the courts of Ghana.
          </p>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-5 pt-2">
          <button onClick={() => onNavigate('terms')} className="text-xs text-gray-400 hover:text-gray-600 underline">Terms of Service</button>
          <button onClick={() => onNavigate('contact')} className="text-xs text-gray-400 hover:text-gray-600 underline">Contact Us</button>
          <button onClick={() => onNavigate('about')} className="text-xs text-gray-400 hover:text-gray-600 underline">About Us</button>
        </div>
        <p className="text-center text-[11px] text-gray-300">
          © 2025 VerifyGH Ltd. · Accra, Ghana
        </p>
      </div>
    </div>
  );
}
