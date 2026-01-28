'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

type OrderMapProps = {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  customerEmail?: string;
  orderId?: string; // Optional order ID for admin view
};

export type OrderMapHandle = {
  refetchCourierLocation: () => Promise<void>;
};

// Custom icons for different markers
const createCustomIcon = (color: string) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const courierIcon = createCustomIcon('red');
const customerIcon = createCustomIcon('blue');

// Component to update map view when locations change
function MapUpdater({
  coordinates,
  courierLocation,
  hasCustomerLocation,
}: {
  coordinates: [number, number] | null;
  courierLocation: [number, number] | null;
  hasCustomerLocation: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    let center: [number, number];
    let zoom: number;

    if (courierLocation && coordinates && hasCustomerLocation) {
      // Calculate center point between courier and customer
      center = [
        (coordinates[0] + courierLocation[0]) / 2,
        (coordinates[1] + courierLocation[1]) / 2,
      ];
      zoom = 14;
    } else if (courierLocation) {
      // Only courier location
      center = courierLocation;
      zoom = 15;
    } else if (coordinates) {
      // Only customer location
      center = coordinates;
      zoom = 15;
    } else {
      return;
    }

    map.setView(center, zoom);
  }, [map, coordinates, courierLocation, hasCustomerLocation]);

  return null;
}

const OrderMap = forwardRef<OrderMapHandle, OrderMapProps>(
  ({ address, city, postalCode, country, customerEmail, orderId }, ref) => {
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courierLoading, setCourierLoading] = useState(false);
    const isMountedRef = useRef(true);

    // Expose refetch method to parent component
    useImperativeHandle(ref, () => ({
      refetchCourierLocation: fetchCourierLocation,
    }));

    // Fetch courier location every 60 seconds
    const fetchCourierLocation = async () => {
      if (!isMountedRef.current) return;

      try {
        setCourierLoading(true);

        // Use different endpoint based on whether orderId is provided (admin view) or not (courier view)
        const endpoint = orderId
          ? `/api/orders/courier-location?orderId=${orderId}`
          : '/api/my-delivery/location';

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const { latitude, longitude } = data.location || {};

          // Validate that we have valid numeric coordinates
          if (
            typeof latitude === 'number' &&
            typeof longitude === 'number' &&
            !isNaN(latitude) &&
            !isNaN(longitude)
          ) {
            if (isMountedRef.current) {
              setCourierLocation([latitude, longitude]);
            }
          } else {
            console.warn('Invalid courier location data:', data.location);
            if (isMountedRef.current) {
              setCourierLocation(null);
            }
          }
        } else {
          console.error('Failed to fetch courier location:', res.status);
        }
      } catch (err) {
        console.error('Failed to fetch courier location:', err);
      } finally {
        if (isMountedRef.current) {
          setCourierLoading(false);
        }
      }
    };

    useEffect(() => {
      isMountedRef.current = true;

      const geocodeAddress = async () => {
        try {
          setLoading(true);

          // Only geocode if we have all required address components
          if (!address || !city || !postalCode || !country) {
            if (isMountedRef.current) {
              setCoordinates(null);
              setError(null);
            }
            return;
          }

          // Format address for geocoding
          const fullAddress = `${address}, ${city}, ${postalCode}, ${country}`;
          const encodedAddress = encodeURIComponent(fullAddress);

          // Using Nominatim (OpenStreetMap) for geocoding - free and no API key required
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
          );

          if (!response.ok) {
            throw new Error('Failed to geocode address');
          }

          const data = await response.json();

          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            if (isMountedRef.current) {
              setCoordinates([parseFloat(lat), parseFloat(lon)]);
              setError(null);
            }
          } else {
            // Fallback to city-level geocoding if full address fails
            const cityResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                city + ', ' + country
              )}&limit=1`
            );
            const cityData = await cityResponse.json();

            if (cityData && cityData.length > 0) {
              const { lat, lon } = cityData[0];
              if (isMountedRef.current) {
                setCoordinates([parseFloat(lat), parseFloat(lon)]);
                setError('Showing approximate location (city center)');
              }
            } else {
              if (isMountedRef.current) {
                setError('Unable to locate address on map');
              }
            }
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          if (isMountedRef.current) {
            setError('Failed to load map location');
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      geocodeAddress();

      // Fetch immediately on mount
      fetchCourierLocation();

      // Set interval for polling every 60 seconds
      const interval = setInterval(fetchCourierLocation, 60000);

      return () => {
        isMountedRef.current = false;
        clearInterval(interval);
      };
    }, [address, city, postalCode, country, orderId]);

    if (loading && address && city && postalCode && country) {
      return (
        <div className='border rounded-lg p-4 h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900'>
          <p className='text-muted-foreground'>Loading map...</p>
        </div>
      );
    }

    if (error && !coordinates) {
      return (
        <div className='border rounded-lg p-4 h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900'>
          <div className='text-center'>
            <p className='text-red-600 mb-2'>{error}</p>
            {address && city && postalCode && country && (
              <p className='text-sm text-muted-foreground'>
                {address}, {city}, {postalCode}, {country}
              </p>
            )}
          </div>
        </div>
      );
    }

    // If no coordinates and no courier location, show loading
    if (!coordinates && !courierLocation) {
      return (
        <div className='border rounded-lg p-4 h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900'>
          <p className='text-muted-foreground'>Waiting for location...</p>
        </div>
      );
    }

    // Determine map center based on what we have
    let mapCenter: [number, number] = [20, 0]; // Default fallback
    let mapZoom = 2;

    if (coordinates && courierLocation) {
      // Both courier and customer location - center between them
      mapCenter = [
        (coordinates[0] + courierLocation[0]) / 2,
        (coordinates[1] + courierLocation[1]) / 2,
      ];
      mapZoom = 14;
    } else if (courierLocation) {
      // Only courier location
      mapCenter = courierLocation;
      mapZoom = 15;
    } else if (coordinates) {
      // Only customer location
      mapCenter = coordinates;
      mapZoom = 15;
    }

    const hasCustomerLocation = coordinates !== null;

    return (
      <div className='border rounded-lg overflow-hidden'>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {/* Component to update map view when locations change */}
          <MapUpdater
            coordinates={coordinates}
            courierLocation={courierLocation}
            hasCustomerLocation={hasCustomerLocation}
          />

          {/* Draw route line if courier location is available and customer location exists */}
          {courierLocation && coordinates && (
            <Polyline
              positions={[courierLocation, coordinates]}
              color='#3b82f6'
              weight={2}
              opacity={0.7}
              dashArray='5, 5'
            />
          )}

          {/* Courier Location Marker (Red) */}
          {courierLocation && courierLocation.length === 2 && (
            <Marker position={courierLocation} icon={courierIcon}>
              <Popup>
                <div className='text-sm'>
                  <p className='font-semibold mb-1 text-red-600'>Courier Location</p>
                  <p className='text-xs text-gray-600'>
                    {courierLoading ? 'Updating...' : 'Live Position'}
                  </p>
                  <p className='text-xs'>
                    Lat: {courierLocation[0]?.toFixed(4) ?? 'N/A'}, Lon:{' '}
                    {courierLocation[1]?.toFixed(4) ?? 'N/A'}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Customer Location Marker (Blue) - only show if we have customer location */}
          {coordinates && (
            <Marker position={coordinates} icon={customerIcon}>
              <Popup>
                <div className='text-sm'>
                  <p className='font-semibold mb-1'>Delivery Location</p>
                  {customerEmail && <p className='text-xs text-gray-600 mb-1'>{customerEmail}</p>}
                  {address && <p className='text-xs'>{address}</p>}
                  {city && postalCode && (
                    <p className='text-xs'>
                      {city}, {postalCode}
                    </p>
                  )}
                  {country && <p className='text-xs'>{country}</p>}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        {error && (
          <div className='bg-amber-50 border-t border-amber-200 px-3 py-2'>
            <p className='text-xs text-amber-800'>{error}</p>
          </div>
        )}
      </div>
    );
  }
);

OrderMap.displayName = 'OrderMap';
export default OrderMap;
