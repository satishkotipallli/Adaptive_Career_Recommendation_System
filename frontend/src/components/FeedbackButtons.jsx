import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import RatingStars from './RatingStars';

const FeedbackButtons = ({ career, onFeedback, currentLike, currentDislike, currentRating = 0 }) => {
  const [rating, setRating] = useState(currentRating);
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionType) => {
    if (!onFeedback) return;
    setLoading(true);
    await onFeedback({ career, action: actionType, rating: actionType === 'like' || actionType === 'dislike' ? rating : rating });
    setLoading(false);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 p-3 bg-slate-50">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleAction('like')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${currentLike ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
          disabled={loading}
        >
          <ThumbsUp className="h-4 w-4" /> Like
        </button>
        <button
          type="button"
          onClick={() => handleAction('dislike')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${currentDislike ? 'bg-rose-500 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
          disabled={loading}
        >
          <ThumbsDown className="h-4 w-4" /> Not Interested
        </button>
      </div>
      <RatingStars
        rating={rating}
        onChange={(value) => setRating(value)}
        readOnly={false}
        label="Your rating"
      />
      <button
        type="button"
        onClick={() => onFeedback({ career, action: 'rating', rating })}
        className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        disabled={loading || rating === 0}
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
};

export default FeedbackButtons;
