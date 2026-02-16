'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

type RestaurantLocationProps = {
  latitude?: number | null;
  longitude?: number | null;
  name?: string;
  address?: string;
};

const restaurantIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RestaurantLocation = ({ latitude, longitude, name, address }: RestaurantLocationProps) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <div className='h-[400px] flex items-center justify-center text-muted-foreground'>
        Location unavailable
      </div>
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      className='h-full w-full'
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker position={[latitude, longitude]} icon={restaurantIcon}>
        <Popup>
          <div className='space-y-1'>
            {name && <div className='font-medium'>{name}</div>}
            {address && <div className='text-sm text-muted-foreground'>{address}</div>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default RestaurantLocation;
