'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

interface DetectedBarcode {
  rawValue: string;
}

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

function hasNativeBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

function createNativeDetector(): BarcodeDetectorInstance | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (window as any).BarcodeDetector;
    return new Ctor({ formats: ['qr_code'] }) as BarcodeDetectorInstance;
  } catch {
    return null;
  }
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>('');
  const lastResultRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const handleResult = useCallback((value: string) => {
    const now = Date.now();
    if (value && (value !== lastResultRef.current || now - lastScanTimeRef.current > 3000)) {
      lastResultRef.current = value;
      lastScanTimeRef.current = now;
      onScanRef.current(value);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
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
      setCameraInfo('');
      lastResultRef.current = '';

      // 1. Camera stream - high resolution for better QR detection
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();

      // 2. Continuous autofocus
      let focusApplied = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const caps = track.getCapabilities?.() as any;
        if (caps?.focusMode?.includes('continuous')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
          focusApplied = true;
        }
      } catch {
        // Not supported
      }

      // 3. Attach to video
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      setIsScanning(true);

      // 4. Choose decoder: native BarcodeDetector (best) or jsQR (fallback)
      const useNative = hasNativeBarcodeDetector();
      const nativeDetector = useNative ? createNativeDetector() : null;
      const decoderName = nativeDetector ? 'BarcodeDetector' : 'jsQR';

      setCameraInfo(
        `${settings.width}x${settings.height} | ` +
        `AF: ${focusApplied ? 'continuous' : 'auto'} | ` +
        decoderName
      );

      // Canvas setup (needed for jsQR fallback, also useful for native on some devices)
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 5. Decode loop
      const scanFrame = async () => {
        if (!streamRef.current || !video.videoWidth) {
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        if (nativeDetector) {
          // --- Native BarcodeDetector path (best performance) ---
          // Processes video element directly, no canvas copy needed
          try {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleResult(barcodes[0].rawValue);
            }
          } catch {
            // Detection error on this frame - skip
          }
        } else {
          // --- jsQR fallback path ---
          // Requires canvas pixel extraction
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code?.data) {
            handleResult(code.data);
          }
        }

        rafRef.current = requestAnimationFrame(scanFrame);
      };

      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(msg);
      onError?.(msg);
    }
  }, [onError, handleResult]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera viewport */}
      <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Viewfinder */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-white/50 rounded-lg relative">
              <div className="absolute -top-px -left-px w-8 h-8 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-lg" />
              <div className="absolute -top-px -right-px w-8 h-8 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-lg" />
              <div className="absolute -bottom-px -left-px w-8 h-8 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-lg" />
              <div className="absolute -bottom-px -right-px w-8 h-8 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-lg" />
              <div
                className="absolute inset-x-2 h-0.5 bg-blue-400/80"
                style={{ animation: 'qr-scan-line 2s ease-in-out infinite' }}
              />
            </div>
          </div>
        )}

        {/* Camera info */}
        {isScanning && cameraInfo && (
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="inline-block px-2 py-0.5 bg-black/60 text-white/80 text-[10px] rounded">
              {cameraInfo}
            </span>
          </div>
        )}

        {/* Idle */}
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

      {/* Error */}
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

      {isScanning && (
        <p className="text-center text-xs text-gray-400">
          QR 코드를 프레임 안에 맞춰주세요. 초점이 안 맞으면 거리를 조절해보세요.
        </p>
      )}
    </div>
  );
}
