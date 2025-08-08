import { useDeletedProperties } from './useDeletedProperties';

export const useDeletedCount = () => {
  const { deletedProperties } = useDeletedProperties();
  
  return { 
    count: deletedProperties.length
  };
}; 