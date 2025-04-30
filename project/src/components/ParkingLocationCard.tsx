import React from 'react';
import { MapPin } from 'lucide-react';

interface ParkingLocationCardProps {
  id: number;
  name: string;
  totalSlots: number;
  availableSlots: number;
  distance?: number; // Optional - only for guest view
  onClick?: () => void;
}

const ParkingLocationCard: React.FC<ParkingLocationCardProps> = ({
  name,
  totalSlots,
  availableSlots,
  distance,
  onClick
}) => {
  // Calculate occupancy percentage
  const occupancyPercentage = Math.round((availableSlots / totalSlots) * 100);
  
  // Determine status color based on availability
  let statusColor = 'bg-green-500';
  let statusText = 'Available';
  
  if (occupancyPercentage <= 10) {
    statusColor = 'bg-red-500';
    statusText = 'Almost Full';
  } else if (occupancyPercentage <= 30) {
    statusColor = 'bg-yellow-500';
    statusText = 'Filling Up';
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <div className={`${statusColor} text-white text-xs py-1 px-2 rounded-full`}>
            {statusText}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Available:</span>
            <span className="font-medium">{availableSlots} / {totalSlots} spots</span>
          </div>
          
          {distance !== undefined && (
            <div className="flex items-center text-gray-600 mt-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} away</span>
            </div>
          )}
        </div>
        
        {/* Progress bar for availability */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                occupancyPercentage > 50 ? 'bg-green-500' : 
                occupancyPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingLocationCard;