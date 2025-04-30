import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/constants';
import { Save, IndianRupee } from 'lucide-react';

interface RateSettings {
  id: number;
  hourly_rate: number;
}

const AdminRates: React.FC = () => {
  const [rate, setRate] = useState('');
  const [currentRate, setCurrentRate] = useState<number>(0); // Initialize with 0 instead of null
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRate();
  }, []);

  const fetchRate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/rate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we always get a number
      const rate = Number(response.data?.hourly_rate) || 0;
      setCurrentRate(rate);
      setRate(rate.toString());
    } catch (error) {
      toast.error('Failed to fetch current rate');
      console.error('Fetch rate error:', error);
      setCurrentRate(0); // Set default value on error
      setRate('0');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const hourlyRate = parseFloat(rate);
      
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        toast.error('Please enter a valid hourly rate');
        return;
      }
      
      await axios.post(`${API_URL}/admin/rate`, { hourly_rate: hourlyRate }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrentRate(hourlyRate);
      toast.success('Hourly rate updated successfully');
    } catch (error) {
      toast.error('Failed to update hourly rate');
      console.error('Update rate error:', error);
    } finally {
      setSaving(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Set Parking Rates</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <IndianRupee className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  The hourly rate will be applied globally to all parking locations.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Hourly Rate</h3>
              <p className="text-3xl font-bold text-blue-600">
              ₹{currentRate.toFixed(2)} {/* Safe to call now as currentRate is always a number */}
              </p>
            </div>
            <IndianRupee className="h-12 w-12 text-blue-400" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rate" className="block text-gray-700 text-sm font-medium mb-2">
              New Hourly Rate (₹)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                name="rate"
                id="rate"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">per hour</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center px-4 py-2 ${
                saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-md transition-colors`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Update Rate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRates;