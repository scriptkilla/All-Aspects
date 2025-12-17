
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, QrCode, Zap, ZapOff, Scan } from 'lucide-react';

// Declare global variable for the external library loaded in index.html
declare const Html5Qrcode: any;

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  
  const scannerRef = useRef<any>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsInitialized(false);
      setHasTorch(false);
      setTorchOn(false);
      
      // Give the DOM a moment to render the #reader div
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      if (typeof Html5Qrcode === 'undefined') {
        throw new Error("Scanner engine not found. Please refresh.");
      }

      // Cleanup any existing instance
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch(e) {}
      }

      scannerRef.current = new Html5Qrcode("reader");

      const config = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          if (mountedRef.current) {
            onScan(decodedText);
            onClose();
          }
        },
        () => { /* ignore frame errors */ }
      );
      
      if (mountedRef.current) {
        setIsInitialized(true);
        
        // Check for flashlight support after the camera is active
        setTimeout(async () => {
          if (!mountedRef.current || !scannerRef.current) return;
          try {
            const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
            }
          } catch (e) {
            console.debug("Torch not supported on this device/browser.");
          }
        }, 800);
      }

    } catch (err: any) {
      console.error("Scanner startup failed:", err);
      if (mountedRef.current) {
        let msg = "Camera failed to start.";
        if (err?.name === "NotAllowedError") msg = "Camera permission denied.";
        if (err?.name === "NotFoundError") msg = "No camera found.";
        setError(msg);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
      scannerRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const newStatus = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newStatus }]
      });
      setTorchOn(newStatus);
    } catch (e) {
      setHasTorch(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full flex flex-col">
        
        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-50 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-brand-accent p-2 rounded-xl text-brand-blue shadow-lg">
               <Scan size={20} strokeWidth={3} />
            </div>
            <h3 className="text-white font-black text-xl tracking-tight uppercase">Scanner</h3>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all border border-white/10 backdrop-blur-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          
          {/* THE SCANNER DIV */}
          <div id="reader" className="w-full h-full absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>

          {!error && !isInitialized && (
             <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-slate-800 border-t-brand-accent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-500 tracking-widest uppercase animate-pulse">Initializing...</p>
                </div>
             </div>
          )}
          
          {!error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
               {/* Viewfinder Graphics */}
               <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-brand-accent rounded-tl-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-brand-accent rounded-tr-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-brand-accent rounded-bl-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-brand-accent rounded-br-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                  
                  {/* Laser Scanner Animation */}
                  <div className="absolute top-0 left-2 right-2 h-[3px] bg-brand-accent shadow-[0_0_20px_rgba(245,158,11,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
               </div>

                <div className="absolute bottom-1/4 translate-y-20 flex flex-col items-center gap-4">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
                    <QrCode size={18} className="text-brand-accent" />
                    <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">
                      QR & Barcodes
                    </span>
                  </div>
                </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-950/95 backdrop-blur-md p-10">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h4 className="text-white text-xl font-black mb-2 uppercase tracking-tight">Camera Error</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-10">{error}</p>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* FLASHLIGHT TOGGLE - BOTTOM LEFT CORNER */}
          {isInitialized && hasTorch && (
             <div className="absolute bottom-8 left-8 z-50 pointer-events-auto">
               <button 
                  onClick={toggleTorch} 
                  className={`group p-5 rounded-full transition-all border-2 shadow-2xl flex items-center justify-center ${torchOn ? 'text-brand-accent bg-white/20 border-brand-accent' : 'text-white/70 bg-black/40 border-white/20'}`}
               >
                 {torchOn ? (
                    <Zap size={28} fill="currentColor" className="animate-pulse" />
                 ) : (
                    <ZapOff size={28} />
                 )}
                 <span className="absolute left-full ml-4 whitespace-nowrap bg-black/60 px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {torchOn ? 'Light Off' : 'Light On'}
                 </span>
               </button>
             </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-900 p-6 border-t border-white/5 flex items-center justify-center gap-4">
           <div className="w-2 h-2 rounded-full bg-brand-accent animate-ping"></div>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Scanner Online</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        #reader__status_span { display: none !important; }
        #reader__dashboard { background: transparent !important; border: none !important; }
      `}} />
    </div>
  );
};
