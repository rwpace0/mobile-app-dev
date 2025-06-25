import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../API/authContext';
import { createStyles } from '../styles/profile.styles';
import { getColors } from '../constants/colors';
import { useTheme } from '../constants/ThemeContext';
import Header from '../components/header';

const Profile = ({ navigation }) => {
  const [activeMetric, setActiveMetric] = useState('Duration');
  const { user, logout, updateUsername } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'This feature will be available soon!'
    );
  };

  const renderProfile = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={50} color={colors.textPrimary} />
        </View>
        <Text style={styles.username}>{user?.username}</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.workout_count || 0}</Text>
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
        Alert.alert(
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
          <Ionicons name="stats-chart" size={24} color={colors.textPrimary} />
          <Text style={styles.dashboardItemText}>Statistics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Exercises')}
        >
          <Ionicons name="barbell-outline" size={24} color={colors.textPrimary} />
          <Text style={styles.dashboardItemText}>Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Measures')}
        >
          <Ionicons name="body-outline" size={24} color={colors.textPrimary} />
          <Text style={styles.dashboardItemText}>Measures</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Calendar')}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
          <Text style={styles.dashboardItemText}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Profile"
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
    </SafeAreaView>
  );
};

export default Profile; 