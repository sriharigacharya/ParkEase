import React from 'react';
import { Car } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Car className="h-6 w-6 mr-2" />
            <span className="text-lg font-bold">ParkEase</span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-400">
              &copy; {currentYear} ParkEase. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Smart Parking Management System
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;