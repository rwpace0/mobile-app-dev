import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "./authAPI";
import getBaseUrl from "../utils/getBaseUrl";
import { storage } from "../local/tokenStorage";
import { tokenManager } from "../utils/tokenManager";

const AuthContext = createContext(null);

// Track avatar download to prevent duplicates
let avatarDownloadInProgress = false;

// Helper function to download user avatar
const downloadUserAvatarOnce = async (userId) => {
  if (avatarDownloadInProgress) {
    return;
  }

  avatarDownloadInProgress = true;

  try {
    const { mediaCache } = await import("../local/MediaCache");

    // Check if avatar already exists locally first
    const existingAvatar = await mediaCache.getProfileAvatar(userId);
    if (existingAvatar) {
      console.log(
        "[AuthContext] Avatar already cached locally, skipping download"
      );
      return;
    }

    // Check local database for profile data (avoid API call)
    const localProfile = await mediaCache.getLocalProfile(userId);

    if (localProfile?.avatar_url) {
      console.log("[AuthContext] Downloading avatar from URL in local DB");
      await mediaCache.downloadUserAvatarIfNeeded(
        userId,
        localProfile.avatar_url
      );
    } else {
      console.log(
        "[AuthContext] No avatar URL found in local DB, skipping download"
      );
    }
  } catch (error) {
    console.error("[AuthContext] Failed to download user avatar:", error);
    // Don't throw error - avatar download is not critical
  } finally {
    // Reset the flag after a short delay to allow for proper completion
    setTimeout(() => {
      avatarDownloadInProgress = false;
    }, 5000);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // check if user is authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // First, check if we have any tokens at all
      const { accessToken, refreshToken } = await storage.getTokens();

      if (!accessToken && !refreshToken) {
        console.log("[AuthContext] No tokens found, user is not authenticated");
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if we have cached user data - OFFLINE FIRST
      // Use cached data immediately if available and token exists
      const cachedUserData = await storage.getItem("cached_user_data");
      if (cachedUserData && accessToken) {
        try {
          const userData = JSON.parse(cachedUserData);

          // Check if token is expired
          const isExpired = await storage.isTokenExpired();

          if (!isExpired) {
            // Token is still valid, use cached data immediately
            console.log(
              "[AuthContext] Using cached user data with valid token (offline-first)"
            );
            setUser({
              ...userData,
              isAuthenticated: !!userData.email_confirmed_at,
            });

            // Check if avatar download is needed (but don't fetch profile from server)
            if (userData.email_confirmed_at) {
              setTimeout(() => downloadUserAvatarOnce(userData.id), 1500);
            }

            setLoading(false);
            return;
          } else if (refreshToken) {
            // Token expired but we have refresh token - refresh silently
            console.log(
              "[AuthContext] Token expired, refreshing with refresh token"
            );
            try {
              const newAccessToken = await tokenManager.refreshAccessToken(
                refreshToken
              );
              if (newAccessToken) {
                // Successfully refreshed, use cached user data
                console.log(
                  "[AuthContext] Token refreshed successfully, using cached user data"
                );
                setUser({
                  ...userData,
                  isAuthenticated: !!userData.email_confirmed_at,
                });

                if (userData.email_confirmed_at) {
                  setTimeout(() => downloadUserAvatarOnce(userData.id), 1500);
                }

                setLoading(false);
                return;
              }
            } catch (refreshError) {
              console.log(
                "[AuthContext] Token refresh failed, will clear cache"
              );
              // Continue to clear tokens below
            }
          }

          // If we get here, token refresh failed
          console.log(
            "[AuthContext] Token refresh failed or no refresh token, clearing cache"
          );
          await tokenManager.clearTokens();
          await storage.removeItem("cached_user_data");
          setUser(null);
          setLoading(false);
          return;
        } catch (error) {
          console.log("[AuthContext] Failed to parse cached user data:", error);
          // Continue to fetch from server
        }
      }

      // No cached user data - need to authenticate with server
      // This should only happen on first login or after cache is cleared
      console.log(
        "[AuthContext] No cached user data, authenticating with server"
      );

      // Check if token is expired
      const isExpired = await storage.isTokenExpired();

      if (isExpired && !refreshToken) {
        console.log(
          "[AuthContext] Token expired and no refresh token available"
        );
        await tokenManager.clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }

      // Get valid token (this will refresh if needed)
      let validToken = accessToken;
      if (isExpired && refreshToken) {
        try {
          validToken = await tokenManager.refreshAccessToken(refreshToken);
        } catch (error) {
          console.log("[AuthContext] Failed to refresh token");
          await tokenManager.clearTokens();
          setUser(null);
          setLoading(false);
          return;
        }
      }

      if (!validToken) {
        console.log("[AuthContext] No valid token available");
        await tokenManager.clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch user data from server (only when no cached data exists)
      try {
        const response = await fetch(`${getBaseUrl()}/auth/me`, {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();

          // Cache the user data permanently (until logout or token invalidation)
          await storage.setItem("cached_user_data", JSON.stringify(userData));

          // Only set user as authenticated if email is verified
          if (userData.email_confirmed_at) {
            setUser({
              ...userData,
              isAuthenticated: true,
            });

            // Download user's avatar in the background after server auth
            setTimeout(() => downloadUserAvatarOnce(userData.id), 2000);
          } else {
            setUser({
              ...userData,
              isAuthenticated: false,
            });
          }
        } else {
          // Token is invalid on server, clear local tokens and cache
          console.log(
            "[AuthContext] Token invalid on server, clearing local tokens"
          );
          await tokenManager.clearTokens();
          await storage.removeItem("cached_user_data");
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthContext] Auth check failed:", error);
        await tokenManager.clearTokens();
        await storage.removeItem("cached_user_data");
        setUser(null);
      }

      setLoading(false);
    } catch (error) {
      console.error("[AuthContext] Auth check failed:", error);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);

      const data = await authAPI.login(email, password);
      console.log("[AuthContext] Login successful");

      // Check email verification status
      const response = await fetch(`${getBaseUrl()}/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user data");
      }

      const userData = await response.json();

      if (!userData.email_confirmed_at) {
        setUser({ ...userData, isAuthenticated: false });
        throw new Error("Please verify your email before logging in");
      }

      setUser({ ...userData, isAuthenticated: true });

      // Cache user data for offline use
      await storage.setItem("cached_user_data", JSON.stringify(userData));

      // Fetch profile data and cache it in local database (for avatar URL and display name)
      try {
        const { profileAPI } = await import("../profileAPI");
        await profileAPI.getProfile(false, userData.id);
        console.log("[AuthContext] Profile data cached successfully");
      } catch (profileError) {
        console.log(
          "[AuthContext] Failed to pre-fetch profile data:",
          profileError.message
        );
      }

      // Download user's avatar in the background after successful login
      setTimeout(() => downloadUserAvatarOnce(userData.id), 1000);

      return data;
    } catch (error) {
      console.error("[AuthContext] Login failed:", error);
      const errorMessage =
        error.message || "Failed to login. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (email, password, username) => {
    try {
      setError(null);

      const data = await authAPI.signup(email, password, username);
      console.log("Signup successful:");

      // Set user as unverified after signup
      setUser({ ...data.user, isAuthenticated: false });
      return data;
    } catch (error) {
      console.error("Signup failed:", error);
      const errorMessage =
        error.message || "Failed to sign up. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authAPI.logout();
      await tokenManager.clearTokens();
      // Clear cached user data
      await storage.removeItem("cached_user_data");

      // Clear profile cache
      const { profileAPI } = await import("../profileAPI");
      profileAPI.clearCache();

      // Clear local database
      const { dbManager } = await import("../local/dbManager");
      console.log("Clearing local database");
      await dbManager.clearAllData();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      const errorMessage =
        error.message || "Failed to logout. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      return await authAPI.requestPasswordReset(email);
    } catch (error) {
      console.error("Password reset request failed:", error);
      const errorMessage =
        error.message || "Failed to request password reset. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPasswordWithToken = async (token_hash, type, password) => {
    try {
      setError(null);
      const response = await authAPI.resetPasswordWithToken(
        token_hash,
        type,
        password
      );
      // If password reset is successful, store the session tokens
      if (response.session?.access_token) {
        await storage.setTokens(
          response.session.access_token,
          response.session.refresh_token,
          response.session.expires_in
        );
        // Update user state
        setUser({ ...response.user, isAuthenticated: true });
      }
      return response;
    } catch (error) {
      console.error("Password reset with token failed:", error);
      const errorMessage =
        error.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyEmail = async (token_hash, type) => {
    try {
      setError(null);
      const response = await authAPI.verifyEmail(token_hash, type);
      await checkAuth(); // Refresh user data after verification
      return response;
    } catch (error) {
      console.error("Email verification failed:", error);
      const errorMessage =
        error.message || "Failed to verify email. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const changeUsername = async (username) => {
    try {
      setError(null);
      const response = await authAPI.changeUsername(username);
      setUser((prev) => ({ ...prev, username }));
      return response;
    } catch (error) {
      console.error("Username change failed:", error);
      const errorMessage =
        error.error ||
        error.message ||
        "Failed to change username. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update user password using recovery session
  const updateUserPassword = async (password, access_token, refresh_token) => {
    try {
      setError(null);

      // Use Supabase's updateUser method for password reset with recovery tokens
      const response = await authAPI.updateUserPassword(
        password,
        access_token,
        refresh_token
      );

      // If password update is successful, the user is now logged in
      if (response.session?.access_token) {
        await storage.setTokens(
          response.session.access_token,
          response.session.refresh_token,
          response.session.expires_in
        );

        // Update user state with new session
        setUser({ ...response.user, isAuthenticated: true });

        // Cache the updated user data
        await storage.setItem(
          "cached_user_data",
          JSON.stringify(response.user)
        );
      }

      return response;
    } catch (error) {
      console.error("Password update failed:", error);
      const errorMessage =
        error.message || "Failed to update password. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    requestPasswordReset,
    resetPasswordWithToken,
    verifyEmail,
    changeUsername,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
