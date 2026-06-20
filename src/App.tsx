import { useState, useCallback } from 'react';
import { Home, ScanLine, Clock, Flag, LayoutDashboard } from 'lucide-react';
import HomeScreen from './components/HomeScreen';
import ScannerScreen from './components/ScannerScreen';
import ResultScreen from './components/ResultScreen';
import ReportScreen from './components/ReportScreen';
import DashboardScreen from './components/DashboardScreen';
import ScanHistoryScreen from './components/ScanHistoryScreen';
import SMSInfoScreen from './components/SMSInfoScreen';
import AboutScreen from './components/AboutScreen';
import ContactScreen from './components/ContactScreen';
import PrivacyScreen from './components/PrivacyScreen';
import TermsScreen from './components/TermsScreen';
import { AuthProvider } from './context/AuthContext';

export interface Product {
  id: string;
  name: string;
  product_name?: string;
  brand: string;
  category: string | null;
  batch_number: string | null;
  manufacture_date: string | null;
  expiry_date: string | null;
  fda_approved: boolean;
  country_of_origin: string;
  verification_code?: string | null;
  registered_by?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

export type ResultState = 'verified' | 'warning' | 'not_registered';
type Screen = 'home' | 'scan' | 'result' | 'report' | 'history' | 'dashboard' | 'sms-info' | 'about' | 'contact' | 'privacy' | 'terms';

const tabs: { id: Screen; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'scan', label: 'Scan', icon: ScanLine },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'report', label: 'Report', icon: Flag },
  { id: 'dashboard', label: 'Admin', icon: LayoutDashboard },
];

const BOTTOM_NAV_SCREENS: Screen[] = ['home', 'history', 'report', 'dashboard'];

function AppInner() {
  const [screen, setScreen] = useState<Screen>('home');
  const [product, setProduct] = useState<Product | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [reportProductName, setReportProductName] = useState('');
  const [resultState, setResultState] = useState<ResultState>('not_registered');

  const handleNavigate = useCallback((target: string) => {
    setScreen(target as Screen);
  }, []);

  const handleResult = useCallback((prod: Product | null, code: string, state: ResultState) => {
    setProduct(prod);
    setScannedCode(code);
    setResultState(state);
    setScreen('result');
  }, []);

  const handleReportFromResult = useCallback((name?: string) => {
    setReportProductName(name || product?.name || '');
    setScreen('report');
  }, [product]);

  const handleBack = useCallback(() => {
    setScreen('home');
  }, []);

  const handleScanAgain = useCallback(() => {
    setScreen('scan');
  }, []);

  const showBottomNav = BOTTOM_NAV_SCREENS.includes(screen);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {screen === 'home' && <HomeScreen onNavigate={handleNavigate} />}
      {screen === 'scan' && <ScannerScreen onResult={handleResult} onBack={handleBack} />}
      {screen === 'result' && (
        <ResultScreen
          product={product}
          code={scannedCode}
          state={resultState}
          onBack={handleBack}
          onReport={handleReportFromResult}
          onScanAgain={handleScanAgain}
        />
      )}
      {screen === 'history' && <ScanHistoryScreen onBack={handleBack} />}
      {screen === 'report' && (
        <ReportScreen onBack={handleBack} initialProductName={reportProductName} />
      )}
      {screen === 'dashboard' && <DashboardScreen />}
      {screen === 'sms-info' && <SMSInfoScreen onBack={handleBack} />}
      {screen === 'about' && <AboutScreen onNavigate={handleNavigate} />}
      {screen === 'contact' && <ContactScreen onNavigate={handleNavigate} />}
      {screen === 'privacy' && <PrivacyScreen onNavigate={handleNavigate} />}
      {screen === 'terms' && <TermsScreen onNavigate={handleNavigate} />}

      {showBottomNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 safe-bottom z-50">
          <div className="flex items-center justify-around py-1.5">
            {tabs.map(tab => {
              const active = screen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setScreen(tab.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 ${
                    active ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-150 ${active ? 'bg-primary-50' : ''}`}>
                    <tab.icon className={`w-5 h-5 transition-all duration-150 ${active ? 'scale-110' : ''}`} />
                  </div>
                  <span className={`text-[9px] font-medium transition-all ${active ? 'text-primary' : 'text-gray-400'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
