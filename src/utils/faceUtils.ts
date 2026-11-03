/**
 * Utility functions for camera capture, biometric watermark, and face verification simulation.
 */

export interface WatermarkData {
  employeeName: string;
  nik: string;
  timestamp: string;
  type: 'MASUK' | 'PULANG';
  latitude: number;
  longitude: number;
  locationName: string;
  distanceMeters: number;
  matchScore: number;
}

/**
 * Creates a watermarked attendance snapshot from video element
 */
export function captureWatermarkedPhoto(
  videoElement: HTMLVideoElement,
  data: WatermarkData
): string {
  const canvas = document.createElement('canvas');
  const width = videoElement.videoWidth || 640;
  const height = videoElement.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw video frame
  ctx.drawImage(videoElement, 0, 0, width, height);

  // Overlay gradient at the bottom for crisp readability
  const gradientHeight = 130;
  const gradient = ctx.createLinearGradient(
    0,
    height - gradientHeight,
    0,
    height
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

  // Top verification badge overlay
  ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'; // emerald
  ctx.beginPath();
  ctx.roundRect(16, 16, 170, 32, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('✓ WAJAH TERVERIFIKASI', 26, 36);

  // Watermark details at the bottom
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`${data.employeeName} (${data.nik})`, 20, height - 90);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`Presensi: ABSEN ${data.type} • ${data.timestamp}`, 20, height - 70);
  ctx.fillText(
    `GPS: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)} (${data.distanceMeters}m dari ${data.locationName})`,
    20,
    height - 50
  );

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(
    `ID: AUTH-${Date.now().toString(36).toUpperCase()} • BIOMETRIC MATCH: ${data.matchScore.toFixed(1)}%`,
    20,
    height - 28
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Creates a synthetic watermarked photo when webcam is not accessible or in simulation mode
 */
export function generateSyntheticAttendancePhoto(
  avatarUrl: string,
  data: WatermarkData
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = avatarUrl;
    img.onload = () => {
      // Draw background dark slate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);

      // Draw avatar centered nicely
      const size = 320;
      const x = (640 - size) / 2;
      const y = (480 - size) / 2 - 20;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();

      // Draw oval guide border
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(320, 210, 140, 170, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Top badge
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.beginPath();
      ctx.roundRect(20, 20, 180, 34, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('✓ WAJAH TERVERIFIKASI', 30, 42);

      // Bottom bar
      const gradient = ctx.createLinearGradient(0, 360, 0, 480);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.85)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 360, 640, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${data.employeeName} (${data.nik})`, 24, 400);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Presensi: ABSEN ${data.type} • ${data.timestamp}`, 24, 422);
      ctx.fillText(
        `GPS: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)} (${data.distanceMeters}m dari ${data.locationName})`,
        24,
        442
      );

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `ID: AUTH-${Date.now().toString(36).toUpperCase()} • BIOMETRIC MATCH: ${data.matchScore.toFixed(1)}%`,
        24,
        462
      );

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => {
      // Fallback if image fails to load
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.employeeName, 320, 240);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
  });
}
