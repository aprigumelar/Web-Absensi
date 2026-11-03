import { OfficeLocation } from '../types';

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters to human-readable Indonesian string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Checks if coordinate is inside office geofence radius
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  office: OfficeLocation
): { isInside: boolean; distanceMeters: number } {
  const distance = calculateDistance(
    userLat,
    userLng,
    office.latitude,
    office.longitude
  );
  return {
    isInside: distance <= office.radiusMeters,
    distanceMeters: distance,
  };
}

/**
 * Default Office Location Presets in Indonesia
 */
export const DEFAULT_OFFICES: OfficeLocation[] = [
  {
    id: 'office-jkt-scbd',
    name: 'Kantor Pusat SCBD Jakarta',
    address: 'Treasury Tower Lt. 28, District 8 SCBD, Jakarta Selatan',
    latitude: -6.225588,
    longitude: 106.809424,
    radiusMeters: 100, // 100 meters radius
  },
  {
    id: 'office-bdg',
    name: 'Kantor Cabang Bandung',
    address: 'Jl. Ir. H. Juanda No. 108, Dago, Kota Bandung',
    latitude: -6.88934,
    longitude: 107.61632,
    radiusMeters: 150,
  },
  {
    id: 'office-sby',
    name: 'Kantor Cabang Surabaya',
    address: 'Pakuwon Tower Lt. 15, Jl. Embong Malang, Surabaya',
    latitude: -7.26252,
    longitude: 112.73886,
    radiusMeters: 120,
  },
];
