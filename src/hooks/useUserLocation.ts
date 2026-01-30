import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLocation {
  lat: number;
  lng: number;
  source: 'gps' | 'profile' | 'default';
  district?: string;
}

const DEFAULT_LOCATION: UserLocation = {
  lat: -7.3274, // Default to Tasikmalaya area
  lng: 108.2207,
  source: 'default',
};

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number | null | undefined,
  lng2: number | null | undefined
): number {
  if (lat2 == null || lng2 == null) return Infinity;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Sort items by distance from user
export function sortByDistance<T extends { locationLat?: number | null; locationLng?: number | null }>(
  items: T[],
  userLat: number,
  userLng: number
): T[] {
  return [...items].sort((a, b) => {
    const distA = calculateDistance(userLat, userLng, a.locationLat, a.locationLng);
    const distB = calculateDistance(userLat, userLng, b.locationLat, b.locationLng);
    return distA - distB;
  });
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to get location from GPS
  const requestGPSLocation = useCallback(() => {
    return new Promise<UserLocation | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: 'gps',
          });
        },
        () => {
          resolve(null);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }, []);

  // Try to get location from user profile (saved address)
  const getProfileLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // First check saved addresses
      const { data: addresses } = await supabase
        .from('saved_addresses')
        .select('lat, lng, district_name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      if (addresses?.lat && addresses?.lng) {
        return {
          lat: addresses.lat,
          lng: addresses.lng,
          source: 'profile',
          district: addresses.district_name || undefined,
        };
      }

      // Fallback to profile district - try to find village location
      const { data: profile } = await supabase
        .from('profiles')
        .select('district_name, village_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.village_id) {
        const { data: village } = await supabase
          .from('villages')
          .select('location_lat, location_lng')
          .eq('id', profile.village_id)
          .maybeSingle();

        if (village?.location_lat && village?.location_lng) {
          return {
            lat: Number(village.location_lat),
            lng: Number(village.location_lng),
            source: 'profile',
            district: profile.district_name || undefined,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  // Initialize location
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);

      try {
        // Check localStorage for cached location
        const cached = localStorage.getItem('user_location');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Use cache if less than 1 hour old
          if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
            setLocation(parsed);
            setLoading(false);
            return;
          }
        }

        // Try GPS first
        const gpsLocation = await requestGPSLocation();
        if (gpsLocation) {
          localStorage.setItem('user_location', JSON.stringify({ ...gpsLocation, timestamp: Date.now() }));
          setLocation(gpsLocation);
          setLoading(false);
          return;
        }

        // Fallback to profile
        const profileLocation = await getProfileLocation();
        if (profileLocation) {
          localStorage.setItem('user_location', JSON.stringify({ ...profileLocation, timestamp: Date.now() }));
          setLocation(profileLocation);
          setLoading(false);
          return;
        }

        // Use default
        setLocation(DEFAULT_LOCATION);
      } catch (err) {
        setError('Failed to get location');
        setLocation(DEFAULT_LOCATION);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [requestGPSLocation, getProfileLocation]);

  // Refresh location (force GPS)
  const refreshLocation = useCallback(async () => {
    setLoading(true);
    const gpsLocation = await requestGPSLocation();
    if (gpsLocation) {
      localStorage.setItem('user_location', JSON.stringify({ ...gpsLocation, timestamp: Date.now() }));
      setLocation(gpsLocation);
    }
    setLoading(false);
  }, [requestGPSLocation]);

  return {
    location,
    loading,
    error,
    refreshLocation,
  };
}
