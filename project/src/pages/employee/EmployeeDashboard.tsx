import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Car, 
  MapPin, 
  Clock, 
  LogIn, 
  LogOut, 
  CheckSquare,
  XSquare
} from 'lucide-react';

interface ParkingLocation {
  id: number;
  name: string;
  total_slots: number;
  available_slots: number;
}

interface Vehicle {
  id: number;
  license_plate: string;
  entry_time: string;
  exit_time: string | null;
  cost: number | null;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState<ParkingLocation | null>(null);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [licensePlace, setLicensePlate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [hourlyRate, setHourlyRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch assigned location
        const locationResponse = await axios.get(`${API_URL}/employee/location`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch recent vehicles
        const vehiclesResponse = await axios.get(`${API_URL}/employee/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch hourly rate
        const rateResponse = await axios.get(`${API_URL}/settings/rate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setLocation(locationResponse.data);
        setRecentVehicles(vehiclesResponse.data);
        setHourlyRate(rateResponse.data.hourly_rate);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licensePlace.trim()) {
      toast.error('Please enter a license plate number');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/employee/checkin`, { 
        license_plate: licensePlace 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Vehicle checked in successfully');
      setLicensePlate('');
      
      // Refresh data
      const locationResponse = await axios.get(`${API_URL}/employee/location`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const vehiclesResponse = await axios.get(`${API_URL}/employee/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLocation(locationResponse.data);
      setRecentVehicles(vehiclesResponse.data);
    } catch (error) {
      toast.error('Failed to check in vehicle. No parking spaces available.');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedVehicle) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/employee/checkout`, { 
        vehicle_id: selectedVehicle.id 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Vehicle checked out. Cost: $${response.data.cost.toFixed(2)}`);
      setSelectedVehicle(null);
      
      // Refresh data
      const locationResponse = await axios.get(`${API_URL}/employee/location`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const vehiclesResponse = await axios.get(`${API_URL}/employee/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLocation(locationResponse.data);
      setRecentVehicles(vehiclesResponse.data);
    } catch (error) {
      toast.error('Failed to check out vehicle');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </div>

      {/* Location Info Card */}
      {location && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">{location.name}</h2>
              </div>
              <p className="text-gray-600">Your assigned parking location</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="bg-blue-100 px-4 py-3 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Available Parking Spaces</p>
                <p className="text-3xl font-bold">
                  {location.available_slots} <span className="text-lg text-blue-500">/ {location.total_slots}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${(location.available_slots / location.total_slots) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Check-in Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <LogIn className="h-5 w-5 text-green-600 mr-2" />
            Vehicle Check-In
          </h2>
          
          {location && location.available_slots > 0 ? (
            <form onSubmit={handleCheckIn}>
              <div className="mb-4">
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate Number
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  value={licensePlace}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter license plate"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                <Car className="h-5 w-5 mr-2" />
                Check In Vehicle
              </button>
            </form>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XSquare className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    No parking spaces available. Check-in is disabled.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Check-out Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <LogOut className="h-5 w-5 text-red-600 mr-2" />
            Vehicle Check-Out
          </h2>
          
          {recentVehicles.filter(v => v.exit_time === null).length > 0 ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle to Check Out
                </label>
                <select
                  value={selectedVehicle?.id || ''}
                  onChange={(e) => {
                    const vehicle = recentVehicles.find(v => v.id === parseInt(e.target.value));
                    setSelectedVehicle(vehicle || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a vehicle</option>
                  {recentVehicles
                    .filter(vehicle => vehicle.exit_time === null)
                    .map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.license_plate} - In at {formatDateTime(vehicle.entry_time)}
                      </option>
                    ))}
                </select>
              </div>
              
              <button
                onClick={handleCheckOut}
                disabled={!selectedVehicle}
                className={`w-full ${
                  !selectedVehicle 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center`}
              >
                <CheckSquare className="h-5 w-5 mr-2" />
                Check Out Vehicle
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Car className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    No vehicles currently checked in.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        
        {recentVehicles.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Car className="h-5 w-5 text-gray-600 mr-2" />
                          <span className="font-medium">{vehicle.license_plate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          {formatDateTime(vehicle.entry_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.exit_time ? (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-green-500 mr-1" />
                            {formatDateTime(vehicle.exit_time)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
  {vehicle.cost !== null && !isNaN(Number(vehicle.cost)) ? (
    <span className="font-medium text-green-600">₹{Number(vehicle.cost).toFixed(2)}</span>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>



                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.exit_time === null ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Parked
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
            <p className="text-gray-500">
              Vehicle activity will appear here once you start checking in vehicles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;