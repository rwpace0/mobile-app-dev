import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "../../styles/settings.styles";
import Header from "../../components/static/header";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { useAuth } from "../../API/auth/authContext";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";

const SettingsItem = ({ icon, title, IconComponent = Ionicons, onPress }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <IconComponent name={icon} size={24} color={colors.textPrimary} style={styles.icon} />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textFaded} />
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title }) => {
  const { isDark } = useTheme();
  const styles = createStyles(isDark);
  
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
};

const Settings = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { alertState, showError, hideAlert } = useAlertModal();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      showError("Error", error.message || "Failed to logout");
      console.log(error);
    }
  };

  const navigateToSettings = (type) => {
    navigation.navigate('SettingsPage', { type });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" leftComponent={{ type: "back" }} />
      <ScrollView>
        <SectionHeader title="Account" />
        <SettingsItem 
          icon="person-outline" 
          title="Profile" 
          onPress={() => navigation.navigate('EditProfile')}
        />
        <SettingsItem 
          icon="lock-closed-outline" 
          title="Account" 
          onPress={() => navigation.navigate('AccountSettings')}
        />
        <SettingsItem 
          icon="star-outline" 
          title="Manage Subscription" 
          onPress={() => navigateToSettings('account')}
        />
        <SettingsItem 
          icon="notifications-outline" 
          title="Notifications" 
          onPress={() => navigateToSettings('account')}
        />
        <SettingsItem
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
        />

        <SectionHeader title="Preferences" />
        <SettingsItem 
          icon="barbell-outline" 
          title="Workouts" 
          onPress={() => navigateToSettings('workouts')}
        />
        <SettingsItem
          IconComponent={Feather}
          icon="shield"
          title="Privacy & Social"
          onPress={() => navigateToSettings('privacy')}
        />
        <SettingsItem
          IconComponent={MaterialIcons}
          icon="straighten"
          title="Units"
          onPress={() => navigateToSettings('units')}
        />
        <SettingsItem
          IconComponent={FontAwesome5}
          icon="flag"
          title="Language"
          onPress={() => navigateToSettings('account')}
        />
        <SettingsItem
          IconComponent={Ionicons}
          icon="moon-outline"
          title="Theme"
          onPress={() => navigateToSettings('theme')}
        />
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

export default Settings;
