'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

interface DetectedBarcode {
  rawValue: string;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastResultRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const handleResult = useCallback((value: string) => {
    const now = Date.now();
    // Debounce: same result within 3s is ignored
    if (value && (value !== lastResultRef.current || now - lastScanTimeRef.current > 3000)) {
      lastResultRef.current = value;
      lastScanTimeRef.current = now;
      onScanRef.current(value);
    }
  }, []);

  const stopScanning = useCallback(async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    if (zxingControlsRef.current) {
      try { zxingControlsRef.current.stop(); } catch { /* ignore */ }
      zxingControlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      lastResultRef.current = '';

      // 1. Camera stream with optimal constraints for QR scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // 2. Apply continuous autofocus (critical for QR scanning)
      const track = stream.getVideoTracks()[0];
      try {
        const capabilities = track.getCapabilities?.() as Record<string, unknown>;
        const focusModes = capabilities?.focusMode as string[] | undefined;
        if (focusModes?.includes('continuous')) {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          });
        }
      } catch {
        // Advanced constraints not supported - fine, continue
      }

      // 3. Attach stream to video element
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setIsScanning(true);

      // 4. Choose decoder strategy
      const hasNativeBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

      if (hasNativeBarcodeDetector) {
        // Native BarcodeDetector - best performance (Chrome, Edge, Samsung Internet, Opera)
        const detector = new (window as unknown as {
          BarcodeDetector: new (opts: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
          };
        }).BarcodeDetector({ formats: ['qr_code'] });

        const scanFrame = async () => {
          if (!streamRef.current) return;

          if (video.readyState >= 2) {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleResult(barcodes[0].rawValue);
              }
            } catch {
              // Detection error on this frame - skip
            }
          }

          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } else {
        // @zxing/browser fallback (Firefox, Safari, older browsers)
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader();

        const controls = await reader.decodeFromStream(stream, video, (result) => {
          if (result) {
            handleResult(result.getText());
          }
        });

        zxingControlsRef.current = controls;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(msg);
      onError?.(msg);
    }
  }, [onError, handleResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (zxingControlsRef.current) {
        try { zxingControlsRef.current.stop(); } catch { /* ignore */ }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera viewport */}
      <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Viewfinder overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-white/50 rounded-lg relative">
              {/* Corner accents */}
              <div className="absolute -top-px -left-px w-8 h-8 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-lg" />
              <div className="absolute -top-px -right-px w-8 h-8 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-lg" />
              <div className="absolute -bottom-px -left-px w-8 h-8 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-lg" />
              <div className="absolute -bottom-px -right-px w-8 h-8 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-lg" />

              {/* Scanning line */}
              <div
                className="absolute inset-x-2 h-0.5 bg-blue-400/80"
                style={{
                  animation: 'qr-scan-line 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Idle placeholder */}
        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
              <p className="text-sm">카메라 대기 중</p>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            스캔 시작
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
          >
            스캔 중지
          </button>
        )}
      </div>
    </div>
  );
}
