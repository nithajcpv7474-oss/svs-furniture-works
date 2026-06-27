import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';

export const usePermission = (moduleKey) => {
  const { user } = useContext(AuthContext);
  
  if (!user || !user.role) {
    return 'none';
  }
  
  return PERMISSIONS[user.role]?.[moduleKey] || 'none';
};
