import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useAuthCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const checkAdminAuth = async (): Promise<boolean> => {
    if (!apiService.isAuthenticated()) {
      setIsAdmin(false);
      return false;
    }

    try {
      const result = await apiService.verifyToken();
      if (result.valid) {
        setIsAdmin(true);
        return true;
      } else {
        await apiService.logout();
        setIsAdmin(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await apiService.logout();
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAdminAuth();
      setCheckingAuth(false);
    };
    initializeAuth();
  }, []);

  return {
    isAdmin,
    checkingAuth,
    checkAdminAuth
  };
};