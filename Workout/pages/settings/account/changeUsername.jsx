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

const ChangeUsername = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const [formData, setFormData] = useState({
    currentUsername: '',
    newUsername: '',
  });

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement username change logic
    console.log('Saving username change:', formData);
    // After successful save, navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Change Username" leftComponent={{ type: "back" }} />
      <ScrollView style={styles.scrollView}>
        <AccountFormField
          title="Current Username"
          value={formData.currentUsername}
          onChangeText={(value) => handleFormChange('currentUsername', value)}
          placeholder="Enter current username"
        />
        <AccountFormField
          title="New Username"
          value={formData.newUsername}
          onChangeText={(value) => handleFormChange('newUsername', value)}
          placeholder="Enter new username"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangeUsername;
