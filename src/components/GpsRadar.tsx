import React from 'react';
import { OfficeLocation } from '../types';
import { calculateDistance, formatDistance } from '../utils/geoUtils';
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Building,
  Crosshair,
  Navigation,
} from 'lucide-react';

interface GpsRadarProps {
  currentLat: number;
  currentLng: number;
  accuracy: number;
  office: OfficeLocation;
  onRefreshGps: () => void;
  onSimulateLocation: (lat: number, lng: number) => void;
  isRealGpsActive: boolean;
}

export const GpsRadar: React.FC<GpsRadarProps> = ({
  currentLat,
  currentLng,
  accuracy,
  office,
  onRefreshGps,
  onSimulateLocation,
  isRealGpsActive,
}) => {
  const distance = calculateDistance(
    currentLat,
    currentLng,
    office.latitude,
    office.longitude
  );
  const isInside = distance <= office.radiusMeters;

  // Radar coordinates relative to center (scaled for canvas visualization)
  // 1 meter = 1.2 pixels on radar scale (capped for display)
  const maxVisualRadius = 140;
  const normalizedDistance = Math.min(
    (distance / Math.max(office.radiusMeters * 2, 200)) * maxVisualRadius,
    maxVisualRadius - 10
  );

  // Bearing simulation angle
  const angle = Math.atan2(
    currentLng - office.longitude,
    currentLat - office.latitude
  );
  const userX = Math.sin(angle) * normalizedDistance;
  const userY = -Math.cos(angle) * normalizedDistance;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900 text-base">
              Radar Geofencing Lokasi Real-Time
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isRealGpsActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isRealGpsActive ? '● GPS Nyata Aktif' : '⚡ Mode Uji Lokasi'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem memverifikasi posisi presensi terhadap koordinat resmi kantor
          </p>
        </div>

        <button
          onClick={onRefreshGps}
          className="inline-flex items-center self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5 mr-1.5" />
          Perbarui Titik GPS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
        {/* Radar Circular Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative h-[min(72vw,18rem)] w-[min(72vw,18rem)] max-w-full rounded-full border-4 border-slate-800 bg-slate-900 shadow-inner overflow-hidden flex items-center justify-center">
            {/* Grid concentric rings */}
            <div className="absolute inset-4 rounded-full border border-slate-800/80"></div>
            <div className="absolute inset-12 rounded-full border border-slate-800/80"></div>
            <div className="absolute inset-20 rounded-full border border-emerald-500/30 bg-emerald-500/5"></div>

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-[1px] bg-slate-800"></div>
            <div className="absolute h-full w-[1px] bg-slate-800"></div>

            {/* Sweeping radar scanner effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full animate-spin [animation-duration:5s]"></div>

            {/* Center Office Marker */}
            <div className="absolute z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-500/30">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-300 bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 border border-blue-500/30">
                Titik Kantor
              </span>
            </div>

            {/* Geofence Perimeter Label */}
            <div className="absolute bottom-3 text-[10px] text-emerald-400 font-mono">
              Radius Izin: {office.radiusMeters}m
            </div>

            {/* User Position Pin on Radar */}
            <div
              className="absolute z-20 transition-all duration-700 flex flex-col items-center"
              style={{
                transform: `translate(${userX}px, ${userY}px)`,
              }}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xl ${
                  isInside
                    ? 'bg-emerald-500 ring-4 ring-emerald-400/40 animate-pulse'
                    : 'bg-rose-500 ring-4 ring-rose-400/40'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
              </div>
              <span
                className={`text-[9px] font-bold px-1 rounded mt-0.5 whitespace-nowrap ${
                  isInside
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                }`}
              >
                Posisi Anda ({formatDistance(distance)})
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>
              Pusat Kantor
            </span>
            <span className="flex items-center">
              <span
                className={`w-2.5 h-2.5 rounded-full mr-1.5 ${
                  isInside ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
              Perangkat Karyawan
            </span>
          </div>
        </div>

        {/* Location Metrics & Quick Test Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              isInside
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isInside ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isInside
                  ? 'Lokasi Terverifikasi di Dalam Radius Kantor'
                  : 'Di Luar Radius Kantor - Presensi Terkunci'}
              </p>
              <p className="text-xs mt-1 text-slate-600">
                {isInside
                  ? `Jarak Anda ${formatDistance(
                      distance
                    )} dari ${office.name}. Sesuai dengan batas maksimal ${office.radiusMeters} meter.`
                  : `Jarak Anda ${formatDistance(
                      distance
                    )} dari kantor. Anda harus berada maksimal ${office.radiusMeters} meter dari kantor untuk melakukan absensi.`}
              </p>
            </div>
          </div>

          {/* Metric Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Jarak Ke Kantor
              </p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">
                {formatDistance(distance)}
              </p>
              <p className="text-[11px] text-slate-400">
                Batas Radius: {office.radiusMeters}m
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Presisi GPS (Akurasi)
              </p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">
                ±{accuracy.toFixed(0)} meter
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                Kualitas Sinyal Baik
              </p>
            </div>
          </div>

          {/* Coordinates Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <span className="text-slate-500">Koordinat Anda:</span>
              <span className="font-semibold text-slate-800">
                {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <span className="text-slate-500">Koordinat Kantor:</span>
              <span className="font-semibold text-slate-800">
                {office.latitude.toFixed(6)}, {office.longitude.toFixed(6)}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-1">
              <span className="text-slate-500">Lokasi Kantor:</span>
              <span className="font-sans font-medium text-slate-700 truncate max-w-[200px]">
                {office.name}
              </span>
            </div>
          </div>

          {/* Quick Simulation Testing Presets (for testing both inside & outside geofence without physically walking) */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center">
              <Compass className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Simulasi Cepat Uji Geofencing (Fitur Testing):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onSimulateLocation(
                    office.latitude + 0.00015,
                    office.longitude + 0.0001
                  )
                }
                className="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors text-center"
              >
                ✓ Set Posisi Dalam Kantor (~20m)
              </button>

              <button
                type="button"
                onClick={() =>
                  onSimulateLocation(
                    office.latitude + 0.012,
                    office.longitude + 0.008
                  )
                }
                className="px-3 py-2 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors text-center"
              >
                ✕ Set Posisi Luar Kantor (~1.5 km)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};