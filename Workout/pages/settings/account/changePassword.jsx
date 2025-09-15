import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "../../../styles/settings.styles";
import Header from "../../../components/static/header";
import { getColors } from "../../../constants/colors";
import { useTheme } from "../../../state/SettingsContext";

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

const ChangePassword = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement password change logic
    console.log('Saving password change:', formData);
    // After successful save, navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Update Password" leftComponent={{ type: "back" }} />
      <ScrollView style={styles.scrollView}>
        <AccountFormField
          title="Current Password"
          value={formData.currentPassword}
          onChangeText={(value) => handleFormChange('currentPassword', value)}
          placeholder="Enter current password"
          secureTextEntry={true}
        />
        <AccountFormField
          title="New Password"
          value={formData.newPassword}
          onChangeText={(value) => handleFormChange('newPassword', value)}
          placeholder="Enter new password"
          secureTextEntry={true}
        />
        <AccountFormField
          title="Confirm New Password"
          value={formData.confirmPassword}
          onChangeText={(value) => handleFormChange('confirmPassword', value)}
          placeholder="Confirm new password"
          secureTextEntry={true}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Update Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePassword;
