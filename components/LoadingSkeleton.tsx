
import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-white rounded-2xl h-48 w-full border border-gray-100"></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl h-64 border border-gray-100"></div>
        <div className="bg-white rounded-2xl h-64 border border-gray-100"></div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl h-64 border border-gray-100"></div>
        <div className="bg-white rounded-2xl h-64 border border-gray-100"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
