import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { showSuccess } from './Toast';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const startScanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          showSuccess('Barcode scanned successfully!');
          if (onScan) {
            onScan(decodedText);
          }
          stopScanner();
        },
        (errorMessage) => {
          // Ignore scanning errors - they're normal during scanning
        }
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Unable to access camera. Please check permissions.');
      setLoading(false);
    }
  }, [onScan]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const stopScanner = useCallback(() => {
    stopCamera();
    if (onClose) onClose();
  }, [onClose]);

  const handleRetake = () => {
    stopCamera();
    startScanner();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <h2 className="text-white text-lg font-semibold">Scan Barcode</h2>
        <button
          onClick={stopScanner}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-white">
            <RefreshCw size={48} className="animate-spin" />
            <p>Starting camera...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-white p-6 text-center">
            <AlertCircle size={48} className="text-red-400" />
            <p className="max-w-md">{error}</p>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        ) : (
          <>
            <div id="qr-reader" className="w-full h-full" />
            
            {/* Scanner Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                
                {/* Scanning line animation */}
                <motion.div
                  animate={{ y: [0, 240, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-32 left-0 right-0 text-center">
              <p className="text-white/80 text-sm bg-black/50 inline-block px-4 py-2 rounded-lg">
                Align barcode within the frame
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex gap-3 justify-center">
          {!error && !loading && (
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <RefreshCw size={18} /> Retake
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BarcodeScanner;
