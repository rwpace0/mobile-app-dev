import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useThemeColors } from "../../constants/useThemeColors";
import { useTheme } from "../../state/SettingsContext";
import Header from "../../components/static/header";
import workoutAPI from "../../API/workoutAPI";
import { mediaCache } from "../../API/local/MediaCache";
import { profileAPI } from "../../API/profileAPI";
import { useFocusEffect } from "@react-navigation/native";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";
import { hapticLight } from "../../utils/hapticFeedback";
import planAPI from "../../API/planAPI";

const DashboardItem = ({ icon, title, onPress, showBorder, colors, styles }) => (
  <TouchableOpacity
    style={[styles.dashboardItem, showBorder && styles.dashboardItemBorder]}
    onPress={onPress}
    activeOpacity={0.65}
  >
    <View style={styles.dashboardItemLeft}>
      <View style={styles.dashboardIconWrap}>
        <Ionicons name={icon} size={22} color={colors.primaryBlue} />
      </View>
      <Text style={styles.dashboardItemText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.textFaded} />
  </TouchableOpacity>
);

const Profile = ({ navigation }) => {
  const [workoutCount, setWorkoutCount] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const { alertState, showInfo, hideAlert } = useAlertModal();

  const fetchWorkoutStats = async () => {
    try {
      const [total, thisWeek, streak] = await Promise.all([
        workoutAPI.getTotalWorkoutCount(),
        workoutAPI.getWorkoutCountThisWeek(),
        workoutAPI.getWorkoutStreakDays(),
      ]);
      setWorkoutCount(total);
      setWorkoutsThisWeek(thisWeek);
      setWorkoutStreak(streak);
    } catch (error) {
      console.error("Error fetching workout stats:", error);
      setWorkoutCount(0);
      setWorkoutsThisWeek(0);
      setWorkoutStreak(0);
    }
  };

  const fetchProfileAvatar = async () => {
    if (user?.id) {
      try {
        const avatarPath = await mediaCache.getProfileAvatar(user.id);
        setProfileAvatar(avatarPath || null);
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
                user.id,
              );

              // Sync username to local database if it exists in backend
              if (backendProfile.username) {
                // Check if a profile with this username already exists in local database
                const { dbManager } = await import("../../API/local/dbManager");
                const [existingUsernameProfile] = await dbManager.query(
                  "SELECT user_id FROM profiles WHERE username = ?",
                  [backendProfile.username],
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
                    ],
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
      fetchWorkoutStats();
      fetchProfileAvatar();
      fetchDisplayName();

      // Delayed re-check to allow background avatar download to finish
      const timeoutId = setTimeout(() => {
        if (!profileAvatar) {
          fetchProfileAvatar();
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  // Refresh data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user?.isAuthenticated) {
        fetchWorkoutStats();
        // Always refetch avatar on focus to catch updates from edit screen
        fetchProfileAvatar();
      }
    }, [user]),
  );

  const renderProfile = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarRing}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              hapticLight();
              navigation.navigate("EditProfile");
            }}
            activeOpacity={0.85}
          >
            {profileAvatar ? (
              <Image
                key={profileAvatar}
                source={{ uri: profileAvatar }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setProfileAvatar(null)}
              />
            ) : (
              <Ionicons
                name="person-outline"
                size={48}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        {username ? (
          <Text style={styles.username} numberOfLines={1}>
            {username.includes("@") ? username : `@${username}`}
          </Text>
        ) : null}
      </View>
      <View style={styles.statsCard}>
        <View style={styles.statCell}>
          <View style={styles.statIconWrap}>
            <Ionicons
              name="barbell-outline"
              size={20}
              color={colors.primaryBlue}
            />
          </View>
          <Text style={styles.statValue}>{workoutCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <View style={styles.statIconWrap}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primaryBlue}
            />
          </View>
          <Text style={styles.statValue}>{workoutsThisWeek}</Text>
          <Text style={styles.statLabel}>This week</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <View style={styles.statIconWrap}>
            <Ionicons name="flame-outline" size={20} color={colors.primaryBlue} />
          </View>
          <Text style={styles.statValue}>{workoutStreak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>
    </View>
  );

  const handlePlanPress = useCallback(async () => {
    try {
      const plan = await planAPI.getActivePlan();
      if (plan) {
        navigation.navigate("PlanPage");
      } else {
        navigation.navigate("PlanSetup");
      }
    } catch (err) {
      console.error("Failed to check active plan:", err);
      navigation.navigate("PlanPage");
    }
  }, [navigation]);

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
    }
  };

  const renderDashboard = () => (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Dashboard</Text>
      <View style={styles.dashboardList}>
        <DashboardItem
          icon="calendar-outline"
          title="Plan"
          onPress={handlePlanPress}
          showBorder={true}
          colors={colors}
          styles={styles}
        />
        <DashboardItem
          icon="stats-chart"
          title="Statistics"
          onPress={() => handleDashboardPress("Statistics")}
          showBorder={true}
          colors={colors}
          styles={styles}
        />
        <DashboardItem
          icon="barbell-outline"
          title="Exercises"
          onPress={() => handleDashboardPress("Exercises")}
          showBorder={false}
          colors={colors}
          styles={styles}
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
          onPress: () => {
            hapticLight();
            navigation.navigate("EditProfile");
          },
        }}
        rightComponent={{
          type: "icon",
          icon: "settings-outline",
          onPress: () => navigation.navigate("Settings"),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
