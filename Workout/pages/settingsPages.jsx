import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createStyles } from '../styles/settings.styles';
import Header from '../components/header';
import colors, { getColors } from '../constants/colors';
import { useTheme } from '../constants/ThemeContext';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

const SettingToggle = ({ title, value, onValueChange, icon, IconComponent = Ionicons }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  
  return (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <IconComponent name={icon} size={24} color={colors.textWhite} style={styles.icon} />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.divider, true: colors.primaryBlue }}
        thumbColor={value ? '#fff' : '#fff'}
        ios_backgroundColor={colors.divider}
      />
    </View>
  );
};

const SettingDropdown = ({ title, value, options, onSelect, icon, IconComponent = Ionicons }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  
  // Capitalize first letter for display
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <>
      <TouchableOpacity 
        style={styles.settingsItem}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.settingsItemLeft}>
          <IconComponent name={icon} size={24} color={colors.textWhite} style={styles.icon} />
          <Text style={styles.settingsItemText}>{title}</Text>
        </View>
        <View style={styles.dropdownValue}>
          <Text style={styles.dropdownValueText}>{displayValue}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaded} />
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            {options.map((option) => {
              const displayOption = option.charAt(0).toUpperCase() + option.slice(1);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    value === option && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    value === option && styles.dropdownOptionTextSelected
                  ]}>
                    {displayOption}
                  </Text>
                  {value === option && (
                    <Ionicons name="checkmark" size={24} color={colors.primaryBlue} />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const SettingsPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params;
  const { theme, changeTheme, isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  // State for different settings
  const [settings, setSettings] = useState({
    // Account settings
    emailNotifications: false,
    workoutReminders: false,
    achievementAlerts: false,
    
    // Workout settings
    autoRestTimer: false,
    showWeightHistory: true,
    countdownTimer: true,
    
    // Privacy settings
    shareWorkouts: false,
    showProfile: true,
    allowComments: false,
    
    // Units settings
    useMetric: true,
    use24Hour: true,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const themeOptions = ['system', 'light', 'dark'];

  const getPageContent = () => {
    switch (type) {
      case 'account':
        return (
          <>
            <SettingToggle
              title="Email Notifications"
              value={settings.emailNotifications}
              onValueChange={() => toggleSetting('emailNotifications')}
              icon="mail-outline"
            />
            <SettingToggle
              title="Workout Reminders"
              value={settings.workoutReminders}
              onValueChange={() => toggleSetting('workoutReminders')}
              icon="notifications-outline"
            />
            <SettingToggle
              title="Achievement Alerts"
              value={settings.achievementAlerts}
              onValueChange={() => toggleSetting('achievementAlerts')}
              icon="trophy-outline"
            />
          </>
        );
      case 'workouts':
        return (
          <>
            <SettingToggle
              title="Auto Rest Timer"
              value={settings.autoRestTimer}
              onValueChange={() => toggleSetting('autoRestTimer')}
              icon="timer-outline"
            />
            <SettingToggle
              title="Show Weight History"
              value={settings.showWeightHistory}
              onValueChange={() => toggleSetting('showWeightHistory')}
              icon="bar-chart-outline"
            />
            <SettingToggle
              title="Countdown Timer"
              value={settings.countdownTimer}
              onValueChange={() => toggleSetting('countdownTimer')}
              icon="time-outline"
            />
          </>
        );
      case 'privacy':
        return (
          <>
            <SettingToggle
              title="Share Workouts"
              value={settings.shareWorkouts}
              onValueChange={() => toggleSetting('shareWorkouts')}
              IconComponent={Feather}
              icon="share-2"
            />
            <SettingToggle
              title="Show Profile"
              value={settings.showProfile}
              onValueChange={() => toggleSetting('showProfile')}
              icon="person-outline"
            />
            <SettingToggle
              title="Allow Comments"
              value={settings.allowComments}
              onValueChange={() => toggleSetting('allowComments')}
              icon="chatbubble-outline"
            />
          </>
        );
      case 'units':
        return (
          <>
            <SettingToggle
              title="Use Metric System"
              value={settings.useMetric}
              onValueChange={() => toggleSetting('useMetric')}
              IconComponent={MaterialIcons}
              icon="straighten"
            />
            <SettingToggle
              title="24-Hour Time"
              value={settings.use24Hour}
              onValueChange={() => toggleSetting('use24Hour')}
              icon="time-outline"
            />
          </>
        );
      case 'theme':
        return (
          <>
            <SettingDropdown
              title="Theme"
              value={theme}
              options={themeOptions}
              onSelect={(value) => changeTheme(value)}
              icon="moon-outline"
            />
          </>
        );
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (type) {
      case 'account': return 'Account Settings';
      case 'workouts': return 'Workout Settings';
      case 'privacy': return 'Privacy & Social';
      case 'units': return 'Units';
      case 'theme': return 'Theme';
      default: return 'Settings';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={getPageTitle()} 
        leftComponent={{ type: 'back' }}
      />
      <ScrollView>
        {getPageContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsPage; 