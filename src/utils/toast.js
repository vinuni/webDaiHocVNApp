/**
 * Simple toast notification utility
 * Uses browser alert for now - can be upgraded to react-native-toast-message
 */

export const toast = {
  /**
   * Show success message
   */
  success(message) {
    if (typeof window !== 'undefined') {
      // For web, use a simple alert or console
      console.log('✅ Success:', message);
      // You can integrate react-native-toast-message here later
      if (window.alert) {
        window.alert(`✅ ${message}`);
      }
    }
  },

  /**
   * Show error message
   */
  error(message) {
    if (typeof window !== 'undefined') {
      console.error('❌ Error:', message);
      if (window.alert) {
        window.alert(`❌ ${message}`);
      }
    }
  },

  /**
   * Show info message
   */
  info(message) {
    if (typeof window !== 'undefined') {
      console.log('ℹ️ Info:', message);
      if (window.alert) {
        window.alert(`ℹ️ ${message}`);
      }
    }
  },

  /**
   * Show warning message
   */
  warning(message) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Warning:', message);
      if (window.alert) {
        window.alert(`⚠️ ${message}`);
      }
    }
  },
};

/**
 * Extract user-friendly error message from API error
 */
export function getErrorMessage(error) {
  if (!error) return 'Đã xảy ra lỗi không xác định';
  
  // Check if error has body with message
  if (error.body) {
    if (error.body.message) return error.body.message;
    
    // Laravel validation errors
    if (error.body.errors) {
      const firstKey = Object.keys(error.body.errors)[0];
      if (firstKey && error.body.errors[firstKey][0]) {
        return error.body.errors[firstKey][0];
      }
    }
  }
  
  // Check error message
  if (error.message) {
    // Don't show raw HTTP errors to users
    if (!error.message.startsWith('HTTP ')) {
      return error.message;
    }
  }
  
  // Status-based messages
  switch (error.status) {
    case 401:
      return 'Vui lòng đăng nhập để tiếp tục';
    case 403:
      return 'Bạn không có quyền thực hiện hành động này';
    case 404:
      return 'Không tìm thấy tài nguyên';
    case 422:
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại';
    case 429:
      return 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
    case 500:
      return 'Lỗi máy chủ. Vui lòng thử lại sau';
    default:
      return `Lỗi ${error.status || 'không xác định'}`;
  }
}
