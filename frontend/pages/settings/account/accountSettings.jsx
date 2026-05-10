import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "../../../styles/settings.styles";
import Header from "../../../components/static/header";
import { useThemeColors } from "../../../constants/useThemeColors";
import { useTheme } from "../../../state/SettingsContext";

const AccountSettingItem = ({
  title,
  icon,
  onPress,
  IconComponent = Ionicons,
  showBorder = true,
}) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <TouchableOpacity
      style={[styles.settingsItem, showBorder && styles.settingsItemBorder]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIconWrap}>
          <IconComponent name={icon} size={22} color={colors.primaryBlue} />
        </View>
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textFaded} />
    </TouchableOpacity>
  );
};

const AccountSettings = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const navigateToChangeUsername = () => {
    navigation.navigate("ChangeUsername");
  };

  const navigateToChangeEmail = () => {
    navigation.navigate("ChangeEmail");
  };

  const navigateToChangePassword = () => {
    navigation.navigate("ChangePassword");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Account Settings" leftComponent={{ type: "back" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.settingsGroup}>
          <AccountSettingItem
            title="Change Username"
            icon="person-outline"
            onPress={navigateToChangeUsername}
          />
          <AccountSettingItem
            title="Change Email"
            icon="mail-outline"
            onPress={navigateToChangeEmail}
          />
          <AccountSettingItem
            title="Change Password"
            icon="lock-closed-outline"
            onPress={navigateToChangePassword}
            showBorder={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountSettings;
