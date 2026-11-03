import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Fingerprint, RefreshCw, X } from 'lucide-react';
import { Employee } from '../types';

interface BiometricModalProps {
  isOpen: boolean;
  employee: Employee;
  onClose: () => void;
  onSave: (photoData: string) => Promise<void>;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  employee,
  onClose,
  onSave,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        setCameraError(null);
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        setStream(activeStream);
        if (videoRef.current) videoRef.current.srcObject = activeStream;
      } catch {
        setCameraError('Kamera tidak dapat diakses. Izinkan akses kamera lalu buka kembali menu ini.');
      }
    };

    startCamera();
    return () => {
      activeStream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
  }, [isOpen]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  if (!isOpen) return null;

  const capturePhoto = () => {
    if (!videoRef.current || !stream) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL('image/jpeg', 0.9));
  };

  const handleSave = async () => {
    if (!preview) return;
    setIsSaving(true);
    try {
      await onSave(preview);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-2 backdrop-blur-sm sm:p-4">
      <div className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl sm:my-4">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Ganti Biometrik Wajah</h3>
              <p className="text-xs text-slate-500">Profil: {employee.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            {preview ? (
              <img src={preview} alt="Pratinjau biometrik baru" className="w-full h-full object-cover" />
            ) : stream ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-xs text-slate-400">
                {cameraError || 'Menyiapkan kamera...'}
              </div>
            )}

            {!preview && stream && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none [--face-target-width:5rem] [--face-target-height:6.5rem] sm:[--face-target-width:6rem] sm:[--face-target-height:7.5rem]"
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    maskImage:
                      'radial-gradient(ellipse var(--face-target-width) var(--face-target-height) at center, transparent 0 99%, black 100%)',
                    WebkitMaskImage:
                      'radial-gradient(ellipse var(--face-target-width) var(--face-target-height) at center, transparent 0 99%, black 100%)',
                  }}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-40 h-52 sm:w-48 sm:h-60 rounded-[48%] border-2 border-white/70 border-dashed shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                    <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Gunakan foto wajah terbaru yang terang, menghadap kamera, dan tanpa penutup wajah. Foto ini menjadi referensi untuk setiap presensi berikutnya.
          </div>

          {cameraError && <p className="text-xs text-rose-600">{cameraError}</p>}

          <div className="flex gap-2">
            {preview && (
              <button type="button" onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Foto Ulang
              </button>
            )}
            {!preview && (
              <button type="button" disabled={!stream} onClick={capturePhoto} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4" /> Ambil Foto Biometrik
              </button>
            )}
            {preview && (
              <button type="button" disabled={isSaving} onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Simpan Biometrik
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
