import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../API/auth/authContext";
import { createStyles } from "../../styles/profile.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import Header from "../../components/static/header";
import workoutAPI from "../../API/workoutAPI";
import { mediaCache } from "../../API/local/MediaCache";
import { profileAPI } from "../../API/profileAPI";
import { useFocusEffect } from "@react-navigation/native";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";

const Profile = ({ navigation }) => {
  const [workoutCount, setWorkoutCount] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { alertState, showInfo, hideAlert } = useAlertModal();

  const fetchWorkoutCount = async () => {
    try {
      const count = await workoutAPI.getTotalWorkoutCount();
      setWorkoutCount(count);
    } catch (error) {
      console.error("Error fetching workout count:", error);
      setWorkoutCount(0);
    }
  };

  const fetchProfileAvatar = async () => {
    if (user?.id) {
      try {
        const avatarPath = await mediaCache.getProfileAvatar(user.id);

        if (avatarPath) {
          setProfileAvatar(avatarPath);
        } else {
          setProfileAvatar(null);
        }
      } catch (error) {
        console.error("Error fetching profile avatar:", error);
        setProfileAvatar(null);
      }
    }
  };

  const fetchDisplayName = async () => {
    if (user?.id) {
      try {
        // First, try to get from local cache
        let profileData = await mediaCache.getLocalProfile(user.id);

        // If local data doesn't have username, try to get from cached profile API data first
        if (!profileData.username) {
          try {
            // Check if we have cached profile data from profileAPI
            const cachedProfile = profileAPI.getCachedProfile();
            if (cachedProfile && cachedProfile.username) {
              // Use cached data to update local database
              await mediaCache.updateLocalProfile(user.id, {
                display_name: cachedProfile.display_name || "",
                username: cachedProfile.username,
              });
              profileData = await mediaCache.getLocalProfile(user.id);
            } else {
              // Only fetch from backend if we don't have cached data
              const backendProfile = await profileAPI.getProfile(
                false,
                user.id
              );

              // Sync username to local database if it exists in backend
              if (backendProfile.username) {
                // Check if a profile with this username already exists in local database
                const { dbManager } = await import("../../API/local/dbManager");
                const [existingUsernameProfile] = await dbManager.query(
                  "SELECT user_id FROM profiles WHERE username = ?",
                  [backendProfile.username]
                );

                if (
                  existingUsernameProfile &&
                  existingUsernameProfile.user_id !== user.id
                ) {
                  // A profile with this username already exists for a different user
                  // Update the existing profile to use the current user's ID
                  await dbManager.execute(
                    'UPDATE profiles SET user_id = ?, display_name = ?, sync_status = ?, updated_at = datetime("now") WHERE username = ?',
                    [
                      user.id,
                      backendProfile.display_name || "",
                      "synced",
                      backendProfile.username,
                    ]
                  );
                } else {
                  // No conflict, proceed with normal update
                  await mediaCache.updateLocalProfile(user.id, {
                    display_name: backendProfile.display_name || "",
                    username: backendProfile.username,
                  });
                }

                // Get updated local profile data
                profileData = await mediaCache.getLocalProfile(user.id);
              }
            }
          } catch (backendError) {
            console.error("Error fetching profile from backend:", backendError);
            // Continue with local data even if backend fails
          }
        }

        // Try display name first, then username from local profile
        const finalDisplayName =
          profileData.display_name || profileData.username || "User";
        setDisplayName(finalDisplayName);

        // Set username for display (fallback to email if no username)
        setUsername(profileData.username || user.email || "");
      } catch (error) {
        console.error("Error fetching display name:", error);
        setDisplayName("User");
        setUsername(user?.email || "");
      }
    }
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      fetchWorkoutCount();
      fetchProfileAvatar();
      fetchDisplayName();

      // One-time delayed re-check to allow background avatar download to finish
      const timeoutId = setTimeout(() => {
        if (!profileAvatar) {
          fetchProfileAvatar();
        }
      }, 2500);

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  // Only refresh workout count when the screen is focused, not profile data
  useFocusEffect(
    React.useCallback(() => {
      if (user?.isAuthenticated) {
        fetchWorkoutCount();
        // Don't refetch profile data on every focus - it's already cached
        // Only refetch avatar if we don't have one
        if (!profileAvatar) {
          fetchProfileAvatar();
        }
      }
    }, [user, profileAvatar])
  );

  const renderProfile = () => (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate("EditProfile")}
        >
          {profileAvatar ? (
            <Image
              key={profileAvatar} // Force re-render when path changes
              source={{ uri: profileAvatar }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="person-outline"
              size={50}
              color={colors.textPrimary}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.username}>{username}</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workoutCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>
    </View>
  );

  const handleDashboardPress = (screen) => {
    switch (screen) {
      case "Exercises":
        navigation.navigate("ViewExercises");
        break;
      case "Calendar":
        navigation.navigate("Calendar");
        break;
      case "Statistics":
        navigation.navigate("StatisticsMain");
        break;
      case "Measures":
        showInfo(
          "Coming Soon",
          `The ${screen} feature will be available in a future update!`
        );
        break;
    }
  };

  const DashboardItem = ({ icon, title, onPress, showBorder }) => (
    <TouchableOpacity
      style={[styles.dashboardItem, showBorder && styles.dashboardItemBorder]}
      onPress={onPress}
    >
      <View style={styles.dashboardItemLeft}>
        <Ionicons name={icon} size={24} color={colors.primaryBlue} />
        <Text style={styles.dashboardItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textFaded} />
    </TouchableOpacity>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Dashboard</Text>
      <View style={styles.dashboardList}>
        <DashboardItem
          icon="stats-chart"
          title="Statistics"
          onPress={() => handleDashboardPress("Statistics")}
          showBorder={true}
        />
        <DashboardItem
          icon="barbell-outline"
          title="Exercises"
          onPress={() => handleDashboardPress("Exercises")}
          showBorder={true}
        />
        <DashboardItem
          icon="body-outline"
          title="Measurements"
          onPress={() => handleDashboardPress("Measures")}
          showBorder={false}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Profile"
        leftComponent={{
          type: "button",
          text: "Edit",
          onPress: () => navigation.navigate("EditProfile"),
        }}
        rightComponent={{
          type: "icon",
          icon: "settings-outline",
          onPress: () => navigation.navigate("Settings"),
        }}
      />
      <ScrollView>
        {renderProfile()}
        {renderDashboard()}
      </ScrollView>

      <AlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </SafeAreaView>
  );
};

export default Profile;
