import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Camera, Keyboard, Search, AlertCircle,
  RefreshCw, ScanLine, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import type { Product, ResultState } from '../App';

// Dimensions of the scan zone in the viewfinder (px)
const SCAN_W = 280;
const SCAN_H = 160;

type CameraState =
  | 'requesting'   // asking for permission
  | 'active'       // camera live, scanning
  | 'verifying'    // code decoded, querying API
  | 'success'      // lookup done, about to navigate
  | 'denied'       // permission denied
  | 'error';       // other failure

export default function ScannerScreen({
  onResult,
  onBack,
}: {
  onResult: (product: Product | null, code: string, state: ResultState) => void;
  onBack: () => void;
}) {
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => { teardown(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function teardown() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    handledRef.current = false;
    setCameraState('requesting');

    // Explicit getUserMedia first — lets us distinguish NotAllowedError
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          // Request continuous autofocus where supported
          // @ts-expect-error — non-standard but supported on Chrome Android
          focusMode: 'continuous',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Try to enable continuous autofocus after stream is acquired
      stream.getVideoTracks().forEach(track => {
        const caps = track.getCapabilities?.() as Record<string, unknown> | undefined;
        if (caps?.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          track.applyConstraints?.({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {});
        }
      });

      streamRef.current = stream;
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      setCameraState(
        name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error'
      );
      return;
    }

    // Release our preview stream — Html5Qrcode opens its own
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setCameraState('active');

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: SCAN_W, height: SCAN_H },
          aspectRatio: window.innerHeight / window.innerWidth,
          disableFlip: false,
        },
        (decoded) => {
          if (handledRef.current) return;
          handledRef.current = true;
          setScannedCode(decoded);
          setCameraState('verifying');
          scanner.stop().then(() => {
            scannerRef.current = null;
            lookupProduct(decoded);
          }).catch(() => {
            scannerRef.current = null;
            lookupProduct(decoded);
          });
        },
        () => {} // per-frame no-match — intentionally silent
      );
    } catch {
      setCameraState('error');
    }
  }

  function rescan() {
    setScannedCode('');
    setManualOpen(false);
    startCamera();
  }

  async function lookupProduct(raw: string) {
    const trimmed = raw.trim();

    const queries = [
      supabase.from('products').select('*').eq('barcode', trimmed).maybeSingle(),
      supabase.from('products').select('*').eq('verification_code', trimmed).maybeSingle(),
      supabase.from('products').select('*').eq('name', trimmed).maybeSingle(),
      supabase.from('products').select('*').eq('product_name', trimmed).maybeSingle(),
    ];

    let product: Product | null = null;
    for (const q of queries) {
      const { data } = await q;
      if (data) { product = data as Product; break; }
    }

    const resultState: ResultState = !product
      ? 'not_registered'
      : product.fda_approved ? 'verified' : 'warning';

    await supabase.from('scans').insert({
      product_name: product?.name || product?.product_name || trimmed,
      result: resultState,
      scanned_at: new Date().toISOString(),
      product_id: (product as unknown as { id?: string })?.id || null,
    });

    setCameraState('success');
    // Brief success flash, then navigate
    setTimeout(() => onResult(product, trimmed, resultState), 600);
  }

  const handleManualSubmit = useCallback(async () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    teardown();
    setScannedCode(trimmed);
    setCameraState('verifying');
    await lookupProduct(trimmed);
  }, [manualCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">

      {/* Camera layer — fills entire screen */}
      <div id="qr-reader" className="absolute inset-0 scanner-container" />

      {/* ── Dark viewfinder overlay ──────────────────────────── */}
      {(cameraState === 'active') && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {/* Four dark quadrants that frame the scan zone */}
          <ScanOverlay />
        </div>
      )}

      {/* ── Floating header ──────────────────────────────────── */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-14 pb-3">
        <button
          onClick={() => { teardown(); onBack(); }}
          className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl flex items-center justify-center border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Scan Product</h1>
          <p className="text-[11px] text-white/50">QR code · Barcode · Verification code</p>
        </div>
      </div>

      {/* ── Center status overlays ──────────────────────────── */}

      {/* REQUESTING */}
      {cameraState === 'requesting' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-20 px-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Camera className="w-8 h-8 text-white/60 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">Starting camera…</p>
            <p className="text-white/40 text-sm">
              Tap <span className="text-white/60 font-medium">Allow</span> when prompted
            </p>
          </div>
        </div>
      )}

      {/* VERIFYING */}
      {cameraState === 'verifying' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-20 px-6">
          <div className="w-20 h-20 bg-black/60 backdrop-blur rounded-2xl border border-white/10 flex items-center justify-center">
            <Loader2 className="w-9 h-9 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg mb-1">Verifying…</p>
            {scannedCode && (
              <p className="text-white/40 text-xs font-mono px-3 py-1 bg-white/5 rounded-full">
                {scannedCode.length > 30 ? scannedCode.slice(0, 30) + '…' : scannedCode}
              </p>
            )}
          </div>
          <button
            onClick={rescan}
            className="flex items-center gap-2 text-white/50 text-sm hover:text-white/70 transition-colors mt-2"
          >
            <RefreshCw className="w-4 h-4" />
            Rescan
          </button>
        </div>
      )}

      {/* SUCCESS flash */}
      {cameraState === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-20 px-6">
          <div className="w-20 h-20 bg-primary/20 backdrop-blur rounded-2xl border border-primary/30 flex items-center justify-center animate-check-bounce">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <p className="text-white font-bold text-lg">Code Found</p>
        </div>
      )}

      {/* DENIED */}
      {cameraState === 'denied' && (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20 px-6">
          <div className="bg-black/70 backdrop-blur rounded-2xl border border-white/10 p-6 w-full max-w-xs">
            <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-white font-semibold text-center mb-1">Camera access denied</p>
            <p className="text-white/40 text-xs text-center mb-4">
              Allow camera access to scan products.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-2">
                iPhone / Safari
              </p>
              <ol className="text-white/50 text-xs space-y-1 list-decimal list-inside">
                <li>Open <span className="text-white/70 font-medium">Settings</span></li>
                <li>Go to <span className="text-white/70 font-medium">Safari → Camera</span></li>
                <li>Select <span className="text-white/70 font-medium">Allow</span></li>
                <li>Return here and retry</li>
              </ol>
            </div>
            <button
              onClick={startCamera}
              className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {cameraState === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center relative z-20 px-6">
          <div className="bg-black/70 backdrop-blur rounded-2xl border border-white/10 p-6 w-full max-w-xs text-center">
            <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-white font-semibold mb-2">Camera unavailable</p>
            <p className="text-white/40 text-xs mb-4 leading-relaxed">
              Your browser may not support camera scanning.
              Use manual entry below as a fallback.
            </p>
            <button
              onClick={startCamera}
              className="w-full bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-all mb-3"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── Active scan hint + rescan button ─────────────────── */}
      {cameraState === 'active' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col">
          {/* Scan zone label — sits just below the frame */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Scan frame (visual only — actual scan region set via qrbox) */}
            <div className="relative" style={{ width: SCAN_W, height: SCAN_H }}>
              {/* Corner brackets */}
              <Corner pos="top-left" />
              <Corner pos="top-right" />
              <Corner pos="bottom-left" />
              <Corner pos="bottom-right" />
              {/* Sweep line */}
              <div className="absolute inset-x-3 overflow-hidden" style={{ top: 0, height: '100%' }}>
                <div className="sweep-line absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              </div>
            </div>
          </div>

          {/* Bottom hint — pointer-events-auto to allow taps */}
          <div className="pointer-events-auto pb-6 px-5 space-y-3">
            <p className="text-center text-white/50 text-xs">
              Hold steady · Point at QR code or barcode
            </p>
          </div>
        </div>
      )}

      {/* ── Manual entry ────────────────────────────────────────
           Always rendered at bottom so it's reachable in any state
      */}
      {cameraState !== 'verifying' && cameraState !== 'success' && (
        <div className="relative z-20 px-4 pb-safe-or-6">
          {/* Toggle */}
          <button
            onClick={() => {
              setManualOpen(o => !o);
              if (!manualOpen) setTimeout(() => inputRef.current?.focus(), 80);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-white/40 hover:text-white/60 transition-colors text-sm"
          >
            <Keyboard className="w-4 h-4" />
            {manualOpen ? 'Hide manual entry' : 'Enter code manually'}
          </button>

          {manualOpen && (
            <div className="animate-slide-up">
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="Product name, barcode, or verification code"
                  className="w-full bg-white/10 border border-white/15 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-all flex items-center justify-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                Verify Product
              </button>
            </div>
          )}
          {/* Safe-area spacer */}
          <div className="h-safe-bottom" />
        </div>
      )}
    </div>
  );
}

// ─── Scan overlay: four dark quadrants framing the scan zone ──────────────────

function ScanOverlay() {
  // We use a single SVG mask so the cutout is pixel-perfect
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
  const cx = vw / 2;
  const cy = vh / 2 - 40; // shift scan zone slightly above center
  const x = cx - SCAN_W / 2;
  const y = cy - SCAN_H / 2;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="cutout">
          {/* White = show; black = hide */}
          <rect width={vw} height={vh} fill="white" />
          <rect x={x} y={y} width={SCAN_W} height={SCAN_H} rx="6" fill="black" />
        </mask>
      </defs>
      {/* Dark overlay with rectangular cutout */}
      <rect
        width={vw}
        height={vh}
        fill="rgba(0,0,0,0.55)"
        mask="url(#cutout)"
      />
    </svg>
  );
}

// ─── Corner bracket helper ────────────────────────────────────────────────────

function Corner({ pos }: { pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const base = 'absolute w-7 h-7';
  const border = 'border-primary';
  const map = {
    'top-left':     `${base} top-0 left-0 border-t-[3px] border-l-[3px] ${border} rounded-tl`,
    'top-right':    `${base} top-0 right-0 border-t-[3px] border-r-[3px] ${border} rounded-tr`,
    'bottom-left':  `${base} bottom-0 left-0 border-b-[3px] border-l-[3px] ${border} rounded-bl`,
    'bottom-right': `${base} bottom-0 right-0 border-b-[3px] border-r-[3px] ${border} rounded-br`,
  };
  return <span className={map[pos]} />;
}

