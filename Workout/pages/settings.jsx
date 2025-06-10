import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles/settings.styles";
import Header from "../components/header";
import colors from "../constants/colors";
import { useAuth } from "../API/authContext";

const SettingsItem = ({ icon, title, IconComponent = Ionicons, onPress }) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
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
  const { logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await logout();
      
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to logout");
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" leftComponent={{ type: "back" }} />
      <ScrollView>
        <SectionHeader title="Account" />
        <SettingsItem icon="person-outline" title="Profile" />
        <SettingsItem icon="lock-closed-outline" title="Account" />
        <SettingsItem icon="star-outline" title="Manage Subscription" />
        <SettingsItem icon="notifications-outline" title="Notifications" />
        <SettingsItem
          color={colors.primaryBlue}
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
        />

        <SectionHeader title="Preferences" />
        <SettingsItem icon="barbell-outline" title="Workouts" />
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
    </SafeAreaView>
  );
};

export default Settings;