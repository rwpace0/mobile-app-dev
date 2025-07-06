import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createStyles } from "../../styles/settings.styles";
import Header from "../../components/header";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";

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

const AccountSettings = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { subtype } = route.params || {};
  const { isDark } = useTheme();
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

  const handleAccountFormChange = (field, value) => {
    setAccountForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const navigateToAccountSetting = (accountType) => {
    navigation.navigate('AccountSettings', { subtype: accountType });
  };

  const getPageContent = () => {
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
  };

  const getPageTitle = () => {
    if (subtype === 'username') {
      return "Change Username";
    } else if (subtype === 'email') {
      return "Change Email";
    } else if (subtype === 'password') {
      return "Update Password";
    } else {
      return "Account Settings";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={getPageTitle()} leftComponent={{ type: "back" }} />
      <ScrollView>{getPageContent()}</ScrollView>
    </SafeAreaView>
  );
};

export default AccountSettings; 