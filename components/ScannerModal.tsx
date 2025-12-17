import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, QrCode, Zap, ZapOff } from 'lucide-react';

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
    // Reset state when opening
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
      await new Promise(resolve => setTimeout(resolve, 100));

      if (typeof Html5Qrcode === 'undefined') {
        throw new Error("Scanner library not loaded. Check internet connection.");
      }

      // Initialize if not already done
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      const config = {
        fps: 15, // Slightly higher for smoother UI
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
        (errorMessage: string) => {
          // Frame-by-frame errors are ignored as they occur when no code is visible
        }
      );
      
      if (mountedRef.current) {
        setIsInitialized(true);
        
        // Attempt to detect torch capability after start
        // Using a short delay as capabilities might not be immediately available
        setTimeout(async () => {
          if (!mountedRef.current || !scannerRef.current) return;
          try {
            const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
            }
          } catch (e) {
            console.warn("Could not check camera capabilities:", e);
          }
        }, 500);
      }

    } catch (err: any) {
      console.error("Scanner error:", err);
      if (mountedRef.current) {
        let msg = "Could not access camera.";
        if (err?.name === "NotAllowedError") msg = "Camera permission denied. Please allow access in settings.";
        if (err?.name === "NotFoundError") msg = "No camera found on this device.";
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
      console.error("Failed to toggle torch:", e);
      // If applying constraints fails, hide the button as it might not be truly supported
      setHasTorch(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-black sm:rounded-2xl overflow-hidden shadow-2xl border-none sm:border sm:border-slate-800 flex flex-col">
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="bg-brand-accent p-1.5 rounded-lg text-brand-blue">
               <Camera size={18} strokeWidth={2.5} />
            </div>
            <h3 className="text-white font-bold tracking-tight">Scanner</h3>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Flashlight Toggle - Only shows if hardware supports it */}
             {hasTorch && (
               <button 
                  onClick={toggleTorch} 
                  className={`p-2.5 rounded-full transition-all border ${torchOn ? 'text-brand-accent bg-white/20 border-brand-accent shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border-transparent'}`}
                  title={torchOn ? "Turn Flashlight Off" : "Turn Flashlight On"}
               >
                 {torchOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
               </button>
             )}
             
             <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all border border-transparent">
               <X size={20} />
             </button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative flex-1 sm:aspect-[3/4] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Scanner Container - The library injects the video here */}
          <div id="reader" className="w-full h-full absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>

          {/* Loading State Overlay */}
          {!error && !isInitialized && (
             <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-slate-800 border-t-brand-accent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-slate-400">Waking up camera...</p>
                </div>
             </div>
          )}
          
          {!error ? (
            <>
              {/* Visual Overlay (HUD) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                 {/* Target Frame */}
                 <div className="w-64 h-64 relative">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-brand-accent rounded-tl-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-brand-accent rounded-tr-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-brand-accent rounded-bl-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-brand-accent rounded-br-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                    
                    {/* Scanning Laser Animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-brand-accent/60 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-[scan_2s_linear_infinite]"></div>
                 </div>

                {/* Status Bar */}
                <div className="absolute bottom-12 flex flex-col items-center gap-2">
                  <div className="text-white text-[11px] font-bold uppercase tracking-[0.2em] bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-lg border border-white/10 flex items-center gap-3">
                    <QrCode size={16} className="text-brand-accent" />
                    Align code in frame
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Error View */
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-900/95 backdrop-blur-md">
              <div className="text-center p-8 max-w-[280px]">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h4 className="text-white font-bold mb-2">Camera Unavailable</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{error}</p>
                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info (Mobile only) */}
        <div className="sm:hidden p-4 bg-slate-900 border-t border-slate-800 text-center">
           <p className="text-[10px] text-slate-500 uppercase tracking-widest">Scanner active • Ready to scan</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
};
