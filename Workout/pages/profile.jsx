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
import styles from '../styles/profile.styles';
import colors from '../constants/colors';
import WorkoutCountGraph from '../graphs/WorkoutCountGraph';

const Profile = ({ navigation }) => {
  const [activeMetric, setActiveMetric] = useState('Duration');
  const { user, logout, updateUsername } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditProfile = () => {
    // For now, just show an alert
    Alert.alert(
      'Edit Profile',
      'This feature will be available soon!'
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={handleEditProfile}>
        <Text style={{ color: colors.primaryBlue }}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={24} color={colors.textWhite} />
      </TouchableOpacity>
    </View>
  );

  const renderProfile = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={50} color={colors.textLight} />
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
          <Ionicons name="stats-chart" size={24} color={colors.textWhite} />
          <Text style={styles.dashboardItemText}>Statistics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Exercises')}
        >
          <Ionicons name="barbell-outline" size={24} color={colors.textWhite} />
          <Text style={styles.dashboardItemText}>Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Measures')}
        >
          <Ionicons name="body-outline" size={24} color={colors.textWhite} />
          <Text style={styles.dashboardItemText}>Measures</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dashboardItem}
          onPress={() => handleDashboardPress('Calendar')}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.textWhite} />
          <Text style={styles.dashboardItemText}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView>
        {renderProfile()}
        {renderDashboard()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile; 