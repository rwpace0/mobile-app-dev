import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../API/auth/authContext';
import { createStyles } from '../../styles/profile.styles';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../state/SettingsContext';
import Header from '../../components/static/header';
import workoutAPI from '../../API/workoutAPI';
import { mediaCache } from '../../API/local/MediaCache';
import { profileAPI } from '../../API/profileAPI';
import { useFocusEffect } from '@react-navigation/native';
import AlertModal from '../../components/modals/AlertModal';
import { useAlertModal } from '../../utils/useAlertModal';

const Profile = ({ navigation }) => {
  const [activeMetric, setActiveMetric] = useState('Duration');
  const [workoutCount, setWorkoutCount] = useState(0);
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const { user, logout, updateUsername } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { alertState, showInfo, hideAlert } = useAlertModal();

  const fetchWorkoutCount = async () => {
    try {
      const count = await workoutAPI.getTotalWorkoutCount();
      setWorkoutCount(count);
    } catch (error) {
      console.error('Error fetching workout count:', error);
      setWorkoutCount(0);
    }
  };

  const fetchProfileAvatar = async () => {
    if (user?.id) {
      try {
        const avatarPath = await mediaCache.getProfileAvatar(user.id);
        setProfileAvatar(avatarPath);
      } catch (error) {
        console.error('Error fetching profile avatar:', error);
        setProfileAvatar(null);
      }
    }
  };

  const fetchDisplayName = async () => {
    if (user?.id) {
      try {
        // First, try to get from local cache
        let profileData = await mediaCache.getLocalProfile(user.id);
        
        // If local data doesn't have username, fetch from backend and sync
        if (!profileData.username) {
          try {
            const backendProfile = await profileAPI.getProfile();
            
            // Sync username to local database if it exists in backend
            if (backendProfile.username) {
              await mediaCache.updateLocalProfile(user.id, {
                display_name: backendProfile.display_name || '',
                username: backendProfile.username
              });
              
              // Get updated local profile data
              profileData = await mediaCache.getLocalProfile(user.id);
            }
          } catch (backendError) {
            console.error('Error fetching profile from backend:', backendError);
            // Continue with local data even if backend fails
          }
        }
        
        // Try display name first, then username from local profile
        const finalDisplayName = profileData.display_name || profileData.username || 'User';
        setDisplayName(finalDisplayName);
      } catch (error) {
        console.error('Error fetching display name:', error);
        setDisplayName('User');
      }
    }
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      fetchWorkoutCount();
      fetchProfileAvatar();
      fetchDisplayName();
    }
  }, [user]);

  // Refresh workout count when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user?.isAuthenticated) {
        fetchWorkoutCount();
        fetchProfileAvatar();
        fetchDisplayName();
      }
    }, [user])
  );



  const renderProfile = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity 
          style={styles.avatar}
          onPress={() => navigation.navigate('EditProfile')}
        >
          {profileAvatar ? (
            <Image
              source={{ uri: profileAvatar }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person-outline" size={50} color={colors.textPrimary} />
          )}
          </TouchableOpacity>
        <Text style={styles.username}>{displayName}</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workoutCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
      </View>
    </View>
  );

  const handleDashboardPress = (screen) => {
    switch (screen) {
      case 'Exercises':
        navigation.navigate('ViewExercises');
        break;
      case 'Statistics':
      case 'Measures':
      case 'Calendar':
        showInfo(
          'Coming Soon',
          `The ${screen} feature will be available in a future update!`
        );
        break;
    }
  };

  const renderDashboard = () => (
    <View style={styles.dashboardSection}>
      <Text style={styles.dashboardTitle}>Dashboard</Text>
      <View style={styles.dashboardGrid}>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Statistics')}
        >
          <Ionicons name="stats-chart" size={24} color={colors.primaryBlue} />
          <Text style={styles.dashboardItemText}>Statistics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Exercises')}
        >
          <Ionicons name="barbell-outline" size={24} color={colors.primaryBlue} />
          <Text style={styles.dashboardItemText}>Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Measures')}
        >
          <Ionicons name="body-outline" size={24} color={colors.primaryBlue} />
          <Text style={styles.dashboardItemText}>Measures</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Calendar')}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.primaryBlue} />
          <Text style={styles.dashboardItemText}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Profile"
        leftComponent={{
          type: 'button',
          text: 'Edit',
          onPress: () => navigation.navigate('EditProfile')
        }}
        rightComponent={{
          type: 'icon',
          icon: 'settings-outline',
          onPress: () => navigation.navigate('Settings')
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