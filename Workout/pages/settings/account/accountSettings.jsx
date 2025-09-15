import React from "react";
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
import { getColors } from "../../../constants/colors";
import { useTheme } from "../../../state/SettingsContext";

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

const AccountSettings = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const navigateToChangeUsername = () => {
    navigation.navigate('ChangeUsername');
  };

  const navigateToChangeEmail = () => {
    navigation.navigate('ChangeEmail');
  };

  const navigateToChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Account Settings" leftComponent={{ type: "back" }} />
      <ScrollView>
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
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountSettings; 