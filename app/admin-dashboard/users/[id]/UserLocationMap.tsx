'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_POSITION: [number, number] = [0, 0];
const DEFAULT_ZOOM = 2;

const fetchGeocode = async (query: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&limit=1`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to geocode location');
  }
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (!data.length) {
    return null;
  }
  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    label: data[0].display_name,
  };
};

const MapLoader = () => (
  <div className='h-80 rounded-lg border border-gray-200 bg-muted/40 dark:border-gray-800' />
);

const useGeocodedLocation = (query: string | null) => {
  const [state, setState] = useState<{
    position: [number, number];
    label: string;
    status: 'idle' | 'loading' | 'ready' | 'error' | 'empty';
  }>({
    position: DEFAULT_POSITION,
    label: '',
    status: 'idle',
  });

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ position: DEFAULT_POSITION, label: '', status: 'idle' });
      return;
    }

    let cancelled = false;

    const loadGeocode = async () => {
      setState((prev) => ({ ...prev, status: 'loading' }));

      try {
        const result = await fetchGeocode(query);
        if (cancelled) return;

        if (!result) {
          setState({ position: DEFAULT_POSITION, label: '', status: 'empty' });
          return;
        }
        setState({ position: [result.lat, result.lng], label: result.label, status: 'ready' });
      } catch {
        if (cancelled) return;
        setState({ position: DEFAULT_POSITION, label: '', status: 'error' });
      }
    };

    loadGeocode();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
};

const buildQuery = (parts: Array<string | undefined | null>) => {
  const filtered = parts.filter(Boolean) as string[];
  if (!filtered.length) return null;
  return filtered.join(', ');
};

const UserLocationMap = ({
  streetAddress,
  city,
  postalCode,
  country,
  name,
}: {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  name?: string;
}) => {
  const query = useMemo(
    () => buildQuery([streetAddress, postalCode, city, country]),
    [streetAddress, postalCode, city, country]
  );
  const { position, label, status } = useGeocodedLocation(query);

  if (!query) {
    return <p className='text-sm text-gray-500 dark:text-gray-400'>No address to map.</p>;
  }

  if (status === 'loading') return <MapLoader />;
  if (status === 'error') {
    return <p className='text-sm text-red-500'>Could not load map. Please try again later.</p>;
  }
  if (status === 'empty') {
    return <p className='text-sm text-gray-500 dark:text-gray-400'>Location not found.</p>;
  }

  return (
    <div className='space-y-3'>
      <div className='text-sm text-gray-600 dark:text-gray-400'>{label}</div>
      <MapContainer
        center={position}
        zoom={12}
        minZoom={DEFAULT_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        className='h-80 w-full rounded-lg border border-gray-200 dark:border-gray-800'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={position}>
          <Popup>
            <div className='text-sm font-medium'>{name || 'User'}</div>
            <div className='text-xs text-gray-600'>{label}</div>
          </Popup>
        </Marker>
        <ZoomControl position='bottomright' />
      </MapContainer>
    </div>
  );
};

export default UserLocationMap;
