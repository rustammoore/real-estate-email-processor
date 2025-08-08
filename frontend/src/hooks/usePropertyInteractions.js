import { useState } from 'react';
import { toggleLike, toggleLove, setRating, toggleArchive } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const usePropertyInteractions = (property, onUpdate) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleInteraction = async (action, actionFunction, successMessage) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await actionFunction(property.id);
      showToast(result.message || successMessage, 'success');
      
      // Update the property data
      if (onUpdate) {
        onUpdate({
          ...property,
          ...result
        });
      }
      
      return result;
    } catch (error) {
      showToast(error.message || 'Action failed', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => handleInteraction('like', toggleLike, 'Property liked');
  const handleLove = () => handleInteraction('love', toggleLove, 'Property loved');
  const handleArchive = () => handleInteraction('archive', toggleArchive, 'Property archived');

  const handleRating = async (rating) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await setRating(property.id, rating);
      const message = rating > 0 ? `Property rated ${rating}/10` : 'Property rating removed';
      showToast(result.message || message, 'success');
      
      // Update the property data
      if (onUpdate) {
        onUpdate({
          ...property,
          rating: result.rating
        });
      }
      
      return result;
    } catch (error) {
      showToast(error.message || 'Failed to set rating', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLike,
    handleLove,
    handleRating,
    handleArchive
  };
}; 