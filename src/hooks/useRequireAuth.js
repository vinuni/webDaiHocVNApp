import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';

/**
 * Hook to require authentication for a screen.
 * If user is not authenticated, navigate to Login screen.
 * 
 * @param {string} message - Optional message to show (can be used for alerts)
 * @returns {boolean} - Returns true if authenticated, false otherwise
 */
export function useRequireAuth(message = null) {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login', params: { message } });
    }
  }, [isAuthenticated, navigation, message]);

  return isAuthenticated;
}
