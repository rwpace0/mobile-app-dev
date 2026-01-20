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

const SettingsItem = ({
  icon,
  title,
  IconComponent = Ionicons,
  onPress,
  iconColor,
  textColor,
  showBorder = true,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <TouchableOpacity
      style={[styles.settingsItem, showBorder && styles.settingsItemBorder]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <IconComponent
          name={icon}
          size={24}
          color={iconColor || colors.primaryBlue}
          style={styles.icon}
        />
        <Text
          style={[styles.settingsItemText, textColor && { color: textColor }]}
        >
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textFaded} />
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title }) => {
  const { isDark } = useTheme();
  const styles = createStyles(isDark);

  return <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>;
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
    navigation.navigate("SettingsPage", { type });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" leftComponent={{ type: "back" }} />
      <ScrollView>
        <SectionHeader title="Account" />
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="person-outline"
            title="Profile"
            onPress={() => navigation.navigate("EditProfile")}
            showBorder={true}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Account"
            onPress={() => navigation.navigate("AccountSettings")}
            showBorder={true}
          />
          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => navigateToSettings("account")}
            showBorder={false}
          />
        </View>

        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleLogout}
            iconColor={colors.accentRed}
            textColor={colors.accentRed}
            showBorder={false}
          />
        </View>

        <SectionHeader title="Preferences" />
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="barbell-outline"
            title="Workouts"
            onPress={() => navigateToSettings("workouts")}
            showBorder={true}
          />
          <SettingsItem
            IconComponent={MaterialIcons}
            icon="straighten"
            title="Units"
            onPress={() => navigateToSettings("units")}
            showBorder={true}
          />
          <SettingsItem
            IconComponent={Ionicons}
            icon="moon-outline"
            title="Theme"
            onPress={() => navigateToSettings("theme")}
            showBorder={false}
          />
        </View>
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
