import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, onChange, readOnly = false, label = 'Rating' }) => {
  const handleClick = (value) => {
    if (readOnly || !onChange) return;
    onChange(value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          return (
            <button
              type="button"
              key={value}
              onClick={() => handleClick(value)}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(value)}
              aria-label={`${value} star`}
              className={`rounded-full p-1 transition ${readOnly ? '' : 'hover:bg-slate-100'}`}
              style={{ color: value <= rating ? '#fbbf24' : '#cbd5e1' }}
            >
              <Star className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RatingStars;
