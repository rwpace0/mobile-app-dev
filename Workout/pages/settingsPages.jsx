import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createStyles } from "../styles/settings.styles";
import Header from "../components/header";
import { getColors } from "../constants/colors";
import { useSettings, useTheme } from "../state/SettingsContext";

const SettingToggle = ({
  title,
  value,
  onValueChange,
  icon,
  IconComponent = Ionicons,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <IconComponent
          name={icon}
          size={24}
          color={colors.textPrimary}
          style={styles.icon}
        />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderColor, true: colors.primaryBlue }}
        thumbColor={value ? "#fff" : "#fff"}
        ios_backgroundColor={colors.borderColor}
      />
    </View>
  );
};

const SettingDropdown = ({
  title,
  value,
  options,
  onSelect,
  icon,
  IconComponent = Ionicons,
}) => {
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
          <IconComponent
            name={icon}
            size={24}
            color={colors.textPrimary}
            style={styles.icon}
          />
          <Text style={styles.settingsItemText}>{title}</Text>
        </View>
        <View style={styles.dropdownValue}>
          <Text style={styles.dropdownValueText}>{displayValue}</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
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
              const displayOption =
                option.charAt(0).toUpperCase() + option.slice(1);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    value === option && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      value === option && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {displayOption}
                  </Text>
                  {value === option && (
                    <Ionicons
                      name="checkmark"
                      size={24}
                      color={colors.primaryBlue}
                    />
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

const AccountSettingItem = ({ title, icon, onPress, IconComponent = Ionicons }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <IconComponent
          name={icon}
          size={24}
          color={colors.textPrimary}
          style={styles.icon}
        />
        <View>
          <Text style={styles.settingsItemText}>{title}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textFaded} />
    </TouchableOpacity>
  );
};

const AccountFormField = ({ title, value, onChangeText, placeholder, secureTextEntry = false }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <View style={styles.formField}>
      <Text style={styles.formFieldLabel}>{title}</Text>
      <TextInput
        style={styles.formFieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaded}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const SettingsPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, subtype } = route.params;
  const { theme, changeTheme, isDark } = useTheme();
  const { settings, updateSetting } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  // Account form state
  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const toggleSetting = (key) => {
    updateSetting(key, !settings[key]);
  };

  const themeOptions = ["system", "light", "dark"];

  const handleAccountFormChange = (field, value) => {
    setAccountForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const navigateToAccountSetting = (accountType) => {
    navigation.navigate('SettingsPage', { type: 'account', subtype: accountType });
  };

  const getPageContent = () => {
    switch (type) {
      case "account":
        if (subtype === 'username') {
          return (
            <>
              <AccountFormField
                title="Current Username"
                value={accountForm.username}
                onChangeText={(value) => handleAccountFormChange('username', value)}
                placeholder="Enter current username"
              />
              <AccountFormField
                title="New Username"
                value={accountForm.username}
                onChangeText={(value) => handleAccountFormChange('username', value)}
                placeholder="Enter new username"
              />
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </>
          );
        } else if (subtype === 'email') {
          return (
            <>
              <AccountFormField
                title="Current Email"
                value={accountForm.email}
                onChangeText={(value) => handleAccountFormChange('email', value)}
                placeholder="Enter current email"
              />
              <AccountFormField
                title="New Email"
                value={accountForm.email}
                onChangeText={(value) => handleAccountFormChange('email', value)}
                placeholder="Enter new email"
              />
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </>
          );
        } else if (subtype === 'password') {
          return (
            <>
              <AccountFormField
                title="Current Password"
                value={accountForm.currentPassword}
                onChangeText={(value) => handleAccountFormChange('currentPassword', value)}
                placeholder="Enter current password"
                secureTextEntry={true}
              />
              <AccountFormField
                title="New Password"
                value={accountForm.newPassword}
                onChangeText={(value) => handleAccountFormChange('newPassword', value)}
                placeholder="Enter new password"
                secureTextEntry={true}
              />
              <AccountFormField
                title="Confirm New Password"
                value={accountForm.confirmPassword}
                onChangeText={(value) => handleAccountFormChange('confirmPassword', value)}
                placeholder="Confirm new password"
                secureTextEntry={true}
              />
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Update Password</Text>
              </TouchableOpacity>
            </>
          );
        } else {
          return (
            <>
              <AccountSettingItem
                title="Change Username"
                icon="person-outline"
                onPress={() => navigateToAccountSetting('username')}
              />
              <AccountSettingItem
                title="Change Email"
                icon="mail-outline"
                onPress={() => navigateToAccountSetting('email')}
              />
              <AccountSettingItem
                title="Update Password"
                icon="lock-closed-outline"
                onPress={() => navigateToAccountSetting('password')}
              />
            </>
          );
        }
      case "workouts":
        return (
          <>
            <SettingToggle
              title="Show Previous Performance"
              value={settings.showPreviousPerformance}
              onValueChange={() => toggleSetting("showPreviousPerformance")}
              icon="analytics-outline"
            />
            <SettingToggle
              title="Auto Rest Timer"
              value={settings.autoRestTimer}
              onValueChange={() => toggleSetting("autoRestTimer")}
              icon="timer-outline"
            />
            <SettingToggle
              title="Show Weight History"
              value={settings.showWeightHistory}
              onValueChange={() => toggleSetting("showWeightHistory")}
              icon="bar-chart-outline"
            />
            <SettingToggle
              title="Countdown Timer"
              value={settings.countdownTimer}
              onValueChange={() => toggleSetting("countdownTimer")}
              icon="time-outline"
            />
          </>
        );
      case "privacy":
        return (
          <>
            <SettingToggle
              title="Share Workouts"
              value={settings.shareWorkouts}
              onValueChange={() => toggleSetting("shareWorkouts")}
              IconComponent={Feather}
              icon="share-2"
            />
            <SettingToggle
              title="Show Profile"
              value={settings.showProfile}
              onValueChange={() => toggleSetting("showProfile")}
              icon="person-outline"
            />
            <SettingToggle
              title="Allow Comments"
              value={settings.allowComments}
              onValueChange={() => toggleSetting("allowComments")}
              icon="chatbubble-outline"
            />
          </>
        );
      case "units":
        return (
          <>
            <SettingToggle
              title="Use Metric System"
              value={settings.useMetric}
              onValueChange={() => toggleSetting("useMetric")}
              IconComponent={MaterialIcons}
              icon="straighten"
            />
            <SettingToggle
              title="24-Hour Time"
              value={settings.use24Hour}
              onValueChange={() => toggleSetting("use24Hour")}
              icon="time-outline"
            />
          </>
        );
      case "theme":
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
      case "account":
        if (subtype === 'username') {
          return "Change Username";
        } else if (subtype === 'email') {
          return "Change Email";
        } else if (subtype === 'password') {
          return "Update Password";
        } else {
          return "Account Settings";
        }
      case "workouts":
        return "Workout Settings";
      case "privacy":
        return "Privacy & Social";
      case "units":
        return "Units";
      case "theme":
        return "Theme";
      default:
        return "Settings";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={getPageTitle()} leftComponent={{ type: "back" }} />
      <ScrollView>{getPageContent()}</ScrollView>
    </SafeAreaView>
  );
};

export default SettingsPage;
