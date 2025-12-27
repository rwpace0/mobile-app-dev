// URL configuration for backend - easily switch between dev/production
// This file centralizes all URL configuration for email redirects
// change in supabase
const IP = "192.168.1.212";

const isDevelopment = process.env.NODE_ENV !== "production";

export const URL_CONFIG = {
  development: {
    // Expo Go development URLs
    // Replace 192.168.1.155 with your actual local IP address
    FRONTEND_URL: `exp://${IP}:8081/--`,
    EMAIL_VERIFICATION_URL: `exp://${IP}:8081/--/auth/welcome`,
    RESET_PASSWORD_URL: `exp://${IP}:8081/--/auth/reset-password`,

    // Alternative format for newer Expo versions (uncomment if needed)
    // FRONTEND_URL: 'exp://exp.host/@your-username/Workout/--',
    // EMAIL_VERIFICATION_URL: 'exp://exp.host/@your-username/Workout/--/auth/verify-email',
    // RESET_PASSWORD_URL: 'exp://exp.host/@your-username/Workout/--/auth/reset-password',
  },

  production: {
    // Production app URLs using custom scheme
    FRONTEND_URL: "workout://",
    EMAIL_VERIFICATION_URL: "workout://auth/welcome",
    RESET_PASSWORD_URL: "workout://auth/reset-password",
  },
};

// Get environment-specific URLs
export const getUrls = () => {
  return isDevelopment ? URL_CONFIG.development : URL_CONFIG.production;
};

// Helper functions for specific URLs
export const getFrontendUrl = () => getUrls().FRONTEND_URL;
export const getEmailVerificationUrl = () => getUrls().EMAIL_VERIFICATION_URL;
export const getResetPasswordUrl = () => getUrls().RESET_PASSWORD_URL;

// Export individual URLs for easy import
const urls = getUrls();
export const FRONTEND_URL = urls.FRONTEND_URL;
export const EMAIL_VERIFICATION_URL = urls.EMAIL_VERIFICATION_URL;
export const RESET_PASSWORD_URL = urls.RESET_PASSWORD_URL;

export default URL_CONFIG;
