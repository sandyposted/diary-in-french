
import React from 'react';

interface DiaryInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const DiaryInput: React.FC<DiaryInputProps> = ({ value, onChange, onSubmit, disabled }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
      <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        Your Entry (Chinese or English)
      </label>
      <textarea
        className="w-full h-64 p-4 text-gray-800 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all resize-none text-lg leading-relaxed"
        placeholder="Today I visited a cafe and read a book under the sun..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {value.length} characters
        </span>
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className={`px-8 py-3 rounded-full font-semibold text-white transition-all transform active:scale-95 flex items-center gap-2 ${
            disabled || !value.trim() 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {disabled ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : 'Traduire & Analyser'}
        </button>
      </div>
    </div>
  );
};

export default DiaryInput;
