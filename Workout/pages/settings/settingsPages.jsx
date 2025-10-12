import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createStyles } from "../../styles/settings.styles";
import Header from "../../components/static/header";
import { getColors } from "../../constants/colors";
import { useSettings, useTheme } from "../../state/SettingsContext";
import BottomSheetModal from "../../components/modals/bottomModal";

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

const ThemeSelector = ({ title, value, onSelect, icon }) => {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const themeOptions = ["system", "light", "dark"];

  // Capitalize first letter for display
  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  const getThemeIcon = (theme) => {
    switch (theme) {
      case "system":
        return "phone-portrait-outline";
      case "light":
        return "sunny-outline";
      case "dark":
        return "moon-outline";
      default:
        return "moon-outline";
    }
  };

  const getThemeLabel = (theme) => {
    switch (theme) {
      case "system":
        return "System";
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return theme;
    }
  };

  const themeActions = themeOptions.map((theme) => ({
    title: getThemeLabel(theme),
    icon: getThemeIcon(theme),
    onPress: () => onSelect(theme),
    showChevron: value === theme,
  }));

  return (
    <>
      <TouchableOpacity
        style={styles.settingsItem}
        onPress={() => setShowThemeModal(true)}
      >
        <View style={styles.settingsItemLeft}>
          <Ionicons
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

      <BottomSheetModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Choose Theme"
        actions={themeActions}
        showHandle={true}
      />
    </>
  );
};

const SegmentedControl = ({ title, value, options, onSelect }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <View style={styles.unitSection}>
      <Text style={styles.unitSectionTitle}>{title}</Text>
      <View style={styles.segmentedControl}>
        {options.map((option) => {
          const isActive = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.segmentedOption,
                isActive
                  ? styles.segmentedOptionActive
                  : styles.segmentedOptionInactive,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.segmentedOptionText,
                  isActive
                    ? styles.segmentedOptionTextActive
                    : styles.segmentedOptionTextInactive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const SettingsPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, subtype } = route.params || {};
  const { theme, changeTheme, isDark } = useTheme();
  const { settings, updateSetting } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const toggleSetting = (key) => {
    updateSetting(key, !settings[key]);
  };

  const themeOptions = ["system", "light", "dark"];

  // Check if this is accessed from active workout (modal navigation)
  const isFromActiveWorkout = route.name === "WorkoutSettings";

  const getHeaderLeftComponent = () => {
    if (isFromActiveWorkout) {
      return {
        type: "down",
        onPress: () => navigation.goBack(),
      };
    }
    return { type: "back" };
  };

  const getPageContent = () => {
    switch (type) {
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
              title="Show RIR"
              value={settings.showRir}
              onValueChange={() => toggleSetting("showRir")}
              icon="fitness-outline"
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
            <SegmentedControl
              title="Weight"
              value={settings.weightUnit}
              options={["kg", "lbs"]}
              onSelect={(value) => updateSetting("weightUnit", value)}
            />
            <SegmentedControl
              title="Distance"
              value={settings.distanceUnit}
              options={["kilometers", "miles"]}
              onSelect={(value) => updateSetting("distanceUnit", value)}
            />
            <SegmentedControl
              title="Body Measurements"
              value={settings.bodyMeasurementUnit}
              options={["cm", "in"]}
              onSelect={(value) => updateSetting("bodyMeasurementUnit", value)}
            />
          </>
        );
      case "theme":
        return (
          <>
            <ThemeSelector
              title="Theme"
              value={theme}
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
      case "workouts":
        return "Workout Settings";
      case "privacy":
        return "Privacy & Social";
      case "units":
        return "Select Units";
      case "theme":
        return "Theme";
      default:
        return "Settings";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={getPageTitle()} leftComponent={getHeaderLeftComponent()} />
      <ScrollView>{getPageContent()}</ScrollView>
    </SafeAreaView>
  );
};

export default SettingsPage;
