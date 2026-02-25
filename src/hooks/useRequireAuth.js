import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';

/**
 * Hook to require authentication for a screen.
 * If user is not authenticated, navigate to Login screen and store the current screen to return to.
 * 
 * @param {string} message - Optional message to show on login screen
 * @returns {boolean} - Returns true if authenticated, false otherwise
 */
export function useRequireAuth(message = null) {
  const { isAuthenticated, setReturnTo } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    if (!isAuthenticated) {
      // Store current route to return to after login
      setReturnTo({
        screen: route.name,
        params: route.params,
      });
      navigation.navigate('Auth', { screen: 'Login', params: { message } });
    }
  }, [isAuthenticated, navigation, route, message, setReturnTo]);

  return isAuthenticated;
}

/**
 * Check if user is authenticated before performing an action.
 * If not authenticated, navigate to login with a message.
 * 
 * @param {object} auth - Auth context from useAuth()
 * @param {object} navigation - Navigation object
 * @param {string} message - Optional message to show
 * @returns {boolean} - Returns true if authenticated, false otherwise
 */
export function requireAuthForAction(auth, navigation, message = 'Vui lòng đăng nhập để tiếp tục') {
  if (!auth.isAuthenticated) {
    navigation.navigate('Auth', { screen: 'Login', params: { message } });
    return false;
  }
  return true;
}
