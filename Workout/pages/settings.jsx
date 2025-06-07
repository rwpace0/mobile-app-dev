import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import styles from '../styles/settings.styles';

const SettingsItem = ({ icon, title, IconComponent = Ionicons }) => (
  <TouchableOpacity style={styles.settingsItem}>
    <View style={styles.settingsItemLeft}>
      <IconComponent name={icon} size={24} color="#fff" style={styles.icon} />
      <Text style={styles.settingsItemText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#666" />
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const Settings = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <SectionHeader title="Account" />
      <SettingsItem icon="person-outline" title="Profile" />
      <SettingsItem icon="lock-closed-outline" title="Account" />
      <SettingsItem icon="star-outline" title="Manage Subscription" />
      <SettingsItem icon="notifications-outline" title="Notifications" />

      <SectionHeader title="Preferences" />
      <SettingsItem 
        icon="barbell-outline" 
        title="Workouts" 
      />
      <SettingsItem 
        IconComponent={Feather}
        icon="shield" 
        title="Privacy & Social" 
      />
      <SettingsItem 
        IconComponent={MaterialIcons}
        icon="straighten" 
        title="Units" 
      />
      <SettingsItem 
        IconComponent={FontAwesome5}
        icon="flag" 
        title="Language" 
      />
      <SettingsItem 
        IconComponent={Ionicons}
        icon="heart-outline" 
        title="Apple Health" 
      />
      <SettingsItem 
        IconComponent={Feather}
        icon="link" 
        title="Integrations" 
      />
      <SettingsItem 
        IconComponent={Ionicons}
        icon="moon-outline" 
        title="Theme" 
      />
    </ScrollView>
  );
};

export default Settings; 