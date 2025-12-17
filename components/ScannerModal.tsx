
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
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      // Small delay to ensure the DOM element "reader" is ready
      await new Promise(resolve => setTimeout(resolve, 150));

      if (typeof Html5Qrcode === 'undefined') {
        throw new Error("Scanner library not loaded. Check your connection.");
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      const config = {
        fps: 20, // High FPS for faster detection
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.7); // 70% of screen width
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      // By default, Html5Qrcode supports all formats including QR_CODE, EAN, CODE_128, etc.
      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          if (mountedRef.current) {
            onScan(decodedText);
            onClose();
          }
        },
        () => {
          // Continuous scanning...
        }
      );
      
      if (mountedRef.current) {
        setIsInitialized(true);
        
        // Detection for Torch (Flashlight) capability
        // Note: Needs a moment for the camera track to stabilize
        setTimeout(async () => {
          if (!mountedRef.current || !scannerRef.current) return;
          try {
            const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
            }
          } catch (e) {
            console.warn("Torch capability check skipped:", e);
          }
        }, 1000);
      }

    } catch (err: any) {
      console.error("Scanner error:", err);
      if (mountedRef.current) {
        let msg = "Camera access error.";
        if (err?.name === "NotAllowedError") msg = "Permission denied. Enable camera in settings.";
        if (err?.name === "NotFoundError") msg = "Camera not found on this device.";
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
        console.warn("Error stopping scanner:", e);
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
      console.error("Torch toggle failed:", e);
      setHasTorch(false); // Disable if it fails
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full h-full flex flex-col">
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-brand-accent p-2 rounded-xl text-brand-blue shadow-lg">
               <Scan size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-white font-bold text-lg tracking-tight">Universal Scanner</h3>
          </div>
          
          <div className="flex items-center gap-3">
             {hasTorch && (
               <button 
                  onClick={toggleTorch} 
                  className={`p-3 rounded-full transition-all border-2 ${torchOn ? 'text-brand-accent bg-white/20 border-brand-accent shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'text-white/80 hover:text-white bg-white/10 border-white/20'}`}
                  title="Toggle Flashlight"
               >
                 {torchOn ? <Zap size={22} fill="currentColor" /> : <ZapOff size={22} />}
               </button>
             )}
             
             <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all border-2 border-white/20">
               <X size={22} />
             </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
          <div id="reader" className="w-full h-full absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>

          {!error && !isInitialized && (
             <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 border-4 border-slate-800 border-t-brand-accent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-slate-400 animate-pulse">Initializing Camera...</p>
                </div>
             </div>
          )}
          
          {!error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
               {/* Viewfinder Graphics */}
               <div className="w-72 h-72 relative">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-brand-accent rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-brand-accent rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-brand-accent rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-brand-accent rounded-br-2xl"></div>
                  
                  {/* Laser effect */}
                  <div className="absolute top-0 left-2 right-2 h-[2px] bg-brand-accent/50 shadow-[0_0_15px_rgba(245,158,11,1)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
               </div>

                <div className="absolute bottom-16 flex flex-col items-center gap-4 px-6 w-full max-w-xs">
                  <div className="bg-black/70 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                    <QrCode size={20} className="text-brand-accent" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest text-center">
                      Scan QR or Barcode
                    </span>
                  </div>
                </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-950/95 backdrop-blur-md p-8">
              <div className="text-center max-w-xs">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h4 className="text-white text-xl font-bold mb-3">Camera Error</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">{error}</p>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-brand-accent text-brand-blue rounded-2xl font-bold transition-transform active:scale-95"
                >
                  Return to Inventory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions Footer */}
        <div className="bg-slate-900/80 backdrop-blur-md p-6 pb-10 border-t border-white/5 text-center flex items-center justify-center gap-3">
           <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
           <p className="text-[11px] text-slate-300 font-bold uppercase tracking-[0.2em]">Ready to scan item...</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
};
