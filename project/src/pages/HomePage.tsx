import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ParkingLocationCard from '../components/ParkingLocationCard';
import { MapPin } from 'lucide-react';
import { API_URL } from '../config/constants';

interface ParkingLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  available_slots: number;
  distance?: number;
}

const HomePage: React.FC = () => {
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    // Get user's location continuously with high accuracy
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location access denied. Please enable location services.';
          }
          setLocationError(errorMessage);
          toast.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
    }

    // Fetch parking locations
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${API_URL}/locations`);
        setLocations(response.data);
      } catch (error) {
        toast.error('Failed to fetch parking locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();

    // Cleanup watchPosition on unmount
    return () => {
      if (navigator.geolocation && watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Add distance to each location if user location is available
  const locationsWithDistance = userLocation
    ? locations
        .map((location) => ({
          ...location,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            location.latitude,
            location.longitude
          ),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    : locations;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Find Available Parking Spots Near You
          </h1>
          <p className="text-xl mb-6">
            ParkEase helps you locate and reserve parking spaces in real-time.
          </p>

          {/* Location Status */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-700">
            {locationError ? (
              <span className="flex items-center text-yellow-300">
                <MapPin className="h-5 w-5 mr-2" />
                {locationError}
              </span>
            ) : userLocation ? (
              <span className="flex items-center text-green-300">
                <MapPin className="h-5 w-5 mr-2" />
                Location detected successfully
              </span>
            ) : (
              <span className="flex items-center text-blue-300">
                <MapPin className="h-5 w-5 mr-2" />
                Detecting location...
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Parking Locations Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Available Parking Locations
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : locationsWithDistance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationsWithDistance.map((location) => (
              <ParkingLocationCard
                key={location.id}
                id={location.id}
                name={location.name}
                totalSlots={location.total_slots}
                availableSlots={location.available_slots}
                distance={location.distance}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-600">No parking locations found in your area.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
