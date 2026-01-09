
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-12 px-6 text-center">
      <div className="flex justify-center items-center gap-3 mb-4">
        <span className="text-4xl">🇫🇷</span>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
          L'Atelier du Journal
        </h1>
      </div>
      <p className="text-gray-600 text-lg max-w-2xl mx-auto italic">
        "Transformez vos pensées quotidiennes en élégance française."
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">Translation</span>
        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium border border-red-100">Grammar</span>
        <span className="bg-white text-gray-600 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">Cultural Insights</span>
      </div>
    </header>
  );
};

export default Header;
