import { usePendingReview } from './usePendingReview';

export const usePendingReviewCount = () => {
  const { pendingProperties, loading } = usePendingReview();
  
  return { 
    count: pendingProperties.length, 
    loading
  };
}; 