import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

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
      // Wait for the DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 50));

      if (typeof Html5Qrcode === 'undefined') {
        throw new Error("Scanner library not loaded");
      }

      // Initialize if not already done
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 }, // Rectangular scanning zone for barcodes
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
            // Close automatically on success
            onClose();
          }
        },
        (errorMessage: string) => {
          // Ignore scanning errors (frame didn't contain barcode)
        }
      );
      
      if (mountedRef.current) {
        setIsInitialized(true);
      }

    } catch (err: any) {
      console.error("Scanner error:", err);
      if (mountedRef.current) {
        let msg = "Could not access camera.";
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
        console.warn("Error stopping scanner", e);
      }
      scannerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Camera size={20} className="text-brand-accent" />
            Scan Barcode
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-[3/4] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Scanner Container - The library injects the video here */}
          <div id="reader" className="w-full h-full absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>

          {/* Loading State */}
          {!error && !isInitialized && (
             <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                  <p className="text-xs text-slate-400">Starting camera...</p>
                </div>
             </div>
          )}
          
          {!error ? (
            <>
              {/* Visual Overlay (Scan Frame) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                 {/* Target Box */}
                 <div className="w-[70%] h-[35%] relative">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-brand-accent rounded-tl-md shadow-sm"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-brand-accent rounded-tr-md shadow-sm"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-brand-accent rounded-bl-md shadow-sm"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-brand-accent rounded-br-md shadow-sm"></div>
                    
                    {/* Laser Line */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500/90 shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse transform -translate-y-1/2"></div>
                 </div>

                <div className="absolute text-white/80 text-xs font-medium bottom-8 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                  Point camera at barcode
                </div>
              </div>
            </>
          ) : (
            /* Error State */
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-900/90 backdrop-blur-sm">
              <div className="text-center p-6 text-slate-400">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="mb-2 text-white font-medium">Scanner Error</p>
                <p className="text-sm max-w-[200px] mx-auto">{error}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};