// URL configuration for deep linking
// This handles both development (Expo Go) and production URLs
const IP = "192.168.1.85";

const isDevelopment = __DEV__;

export const URL_CONFIG = {
  // App scheme for deep linking
  scheme: "workout",

  // Development URLs (for Expo Go)
  development: {
    // For Expo Go, use exp:// protocol with your project slug
    baseUrl: `exp://${IP}:8081`, // Replace with your local IP
    // Alternative format for newer Expo versions
    expUrl: "exp://exp.host/@username/Workout", // Replace with your Expo username

    // Deep link paths
    emailVerification: `exp://${IP}:8081/--/auth/welcome`,
    resetPassword: `exp://${IP}:8081/--/auth/reset-password`,
  },

  // Production URLs (for standalone app)
  production: {
    baseUrl: "workout://",

    // Deep link paths
    emailVerification: "workout://auth/welcome",
    resetPassword: "workout://auth/reset-password",
  },
};

// Get the appropriate URL configuration based on environment
export const getUrlConfig = () => {
  return isDevelopment ? URL_CONFIG.development : URL_CONFIG.production;
};

// Helper function to get the full URL for email redirects
export const getEmailRedirectUrl = (path) => {
  const config = getUrlConfig();

  if (isDevelopment) {
    // For development, use the specific path format
    return config[path] || `${config.baseUrl}/--/${path}`;
  } else {
    // For production, use the scheme format
    return config[path] || `${config.baseUrl}${path}`;
  }
};

// Helper function to construct URLs for the backend
export const getBackendRedirectUrls = () => {
  return {
    emailVerification: getEmailRedirectUrl("emailVerification"),
    resetPassword: getEmailRedirectUrl("resetPassword"),
  };
};

// Environment-specific configuration that can be used by backend
export const BACKEND_URL_CONFIG = {
  development: {
    FRONTEND_URL: `exp://${IP}:8081/--`,
    EMAIL_VERIFICATION_URL: `exp://${IP}:8081/--/auth/welcome`,
    RESET_PASSWORD_URL: `exp://${IP}:8081/--/auth/reset-password`,
  },
  production: {
    FRONTEND_URL: "workout://",
    EMAIL_VERIFICATION_URL: "workout://auth/welcome",
    RESET_PASSWORD_URL: "workout://auth/reset-password",
  },
};

export default URL_CONFIG;
