import { useState } from 'react';
import { toggleLike, toggleLove, setRating, toggleArchive } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const usePropertyInteractions = (property, onUpdate) => {
  const [loading, setLoading] = useState(false);
  const { showToast, showError } = useToast();

  const handleInteraction = async (action, actionFunction, successMessage) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await actionFunction(property.id);
      // Build consistent blue (info) toast in top-right
      let message = result.message || successMessage || 'Updated';
      if (action === 'like' && typeof result.liked === 'boolean') {
        message = result.liked ? 'Liked property' : 'Removed Like';
      } else if (action === 'love' && typeof result.loved === 'boolean') {
        message = result.loved ? 'Loved property' : 'Removed Love';
      } else if (action === 'archive' && typeof result.archived === 'boolean') {
        message = result.archived ? 'Archived property' : 'Unarchived property';
      }
      showToast({ title: 'Action', message, severity: 'info', autoHideDuration: 3500 });
      
      // Update the property data
      if (onUpdate) {
        onUpdate({
          ...property,
          ...result
        });
      }

      // Broadcast update so other views (e.g., dashboard) can react immediately
      try {
        window.dispatchEvent(new CustomEvent('property:updated', { detail: { ...property, ...result } }));
      } catch (_) {
        // no-op
      }
      
      return result;
    } catch (error) {
      showError(error.message || 'Action failed', 'Error');
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
      const message = rating > 0 ? `Rated property ${rating}/10` : 'Removed rating';
      showToast({ title: 'Action', message, severity: 'info', autoHideDuration: 3500 });
      
      // Update the property data
      if (onUpdate) {
        onUpdate({
          ...property,
          ...result
        });
      }
      
      return result;
    } catch (error) {
      showError(error.message || 'Failed to set rating', 'Error');
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