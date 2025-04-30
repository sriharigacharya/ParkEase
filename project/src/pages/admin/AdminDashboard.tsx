import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Activity,
  BarChart4,
  Car 
} from 'lucide-react';

interface DashboardStats {
  totalLocations: number;
  totalEmployees: number;
  totalVehicles: number;
  hourlyRate: number;
  occupancyRate: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLocations: 0,
    totalEmployees: 0,
    totalVehicles: 0,
    hourlyRate: 0,
    occupancyRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Validate and convert all response data to numbers
        const data = {
          totalLocations: Number(response.data.totalLocations) || 0,
          totalEmployees: Number(response.data.totalEmployees) || 0,
          totalVehicles: Number(response.data.totalVehicles) || 0,
          hourlyRate: Number(response.data.hourlyRate) || 0,
          occupancyRate: Number(response.data.occupancyRate) || 0
        };
        
        setStats(data);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dashboardCards = [
    {
      title: 'Total Locations',
      value: stats.totalLocations,
      icon: <MapPin className="h-8 w-8 text-blue-500" />,
      linkTo: '/admin/locations',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: <Users className="h-8 w-8 text-green-500" />,
      linkTo: '/admin/employees',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Vehicles Managed',
      value: stats.totalVehicles,
      icon: <Car className="h-8 w-8 text-purple-500" />,
      linkTo: '/admin/vehicles',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Hourly Rate',
      value: `$${(stats.hourlyRate || 0).toFixed(2)}`,
      icon: <DollarSign className="h-8 w-8 text-yellow-500" />,
      linkTo: '/admin/rates',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate || 0}%`,
      icon: <Activity className="h-8 w-8 text-red-500" />,
      linkTo: '/admin/locations',
      color: 'bg-red-50 border-red-200'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <Link 
            key={index}
            to={card.linkTo}
            className={`${card.color} border rounded-lg p-6 transition-transform hover:scale-105`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="rounded-full p-3 bg-white shadow-sm">
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/admin/locations" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 text-center transition-colors"
          >
            <MapPin className="h-6 w-6 mx-auto mb-2" />
            <span>Manage Locations</span>
          </Link>
          
          <Link 
            to="/admin/employees" 
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 text-center transition-colors"
          >
            <Users className="h-6 w-6 mx-auto mb-2" />
            <span>Manage Employees</span>
          </Link>
          
          <Link 
            to="/admin/rates" 
            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg p-4 text-center transition-colors"
          >
            <DollarSign className="h-6 w-6 mx-auto mb-2" />
            <span>Set Hourly Rate</span>
          </Link>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Activity Overview</h2>
          <BarChart4 className="h-5 w-5 text-gray-500" />
        </div>
        <p className="text-gray-600 mb-4">
          This is a simplified prototype. In a full version, this would display charts and analytics of parking usage.
        </p>
        <div className="h-40 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">Activity charts would appear here</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;