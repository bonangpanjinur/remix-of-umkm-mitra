import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, Loader2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateDistance } from '@/lib/codSecurity';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number }) => void;
  merchantLocation?: { lat: number; lng: number } | null;
  onDistanceChange?: (distanceKm: number) => void;
  disabled?: boolean;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({
  value,
  onChange,
  merchantLocation,
  onDistanceChange,
  disabled,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Default center (Tasikmalaya)
  const defaultCenter = { lat: -7.3274, lng: 108.2207 };
  const currentCenter = value || defaultCenter;

  // Calculate distance when location changes
  useEffect(() => {
    if (value && merchantLocation && onDistanceChange) {
      const distance = calculateDistance(
        value.lat,
        value.lng,
        merchantLocation.lat,
        merchantLocation.lng
      );
      onDistanceChange(distance);
    }
  }, [value, merchantLocation, onDistanceChange]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!disabled) {
      onChange({ lat, lng });
    }
  }, [onChange, disabled]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Titik Lokasi Pengiriman</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={loading || disabled}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LocateFixed className="h-4 w-4 mr-1" />
              Lokasi Saya
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* OpenStreetMap */}
      <div className="rounded-lg border border-border overflow-hidden" style={{ height: '250px' }}>
        <MapContainer
          center={[currentCenter.lat, currentCenter.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} />
              <RecenterMap lat={value.lat} lng={value.lng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Location status */}
      <div className="rounded-lg border border-border p-3 bg-secondary/30">
        {value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Lokasi Dipilih</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Klik pada peta atau gunakan "Lokasi Saya" untuk menentukan titik pengiriman
          </p>
        )}
      </div>
    </div>
  );
}