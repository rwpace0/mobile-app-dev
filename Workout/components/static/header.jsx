import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createStyles } from '../../styles/header.styles';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../state/SettingsContext';

const Header = ({ title, leftComponent, rightComponent }) => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const renderLeftComponent = () => {
    if (!leftComponent) {
      return <View style={styles.leftContainer} />;
    }

    if (leftComponent.type === 'back') {
      return (
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name={leftComponent.icon || "chevron-back"}
              size={24}
              color={colors.primaryBlue}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (leftComponent.type === 'custom') {
      return (
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={leftComponent.onPress}
          >
            <Ionicons
              name={leftComponent.icon}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (leftComponent.type === 'down') {
      return (
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={leftComponent.onPress}
          >
            <Ionicons
              name="chevron-down-outline"
              size={24}
              color={colors.primaryBlue}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (leftComponent.type === 'button') {
      return (
        <View style={styles.leftContainer}>
          <TouchableOpacity
            style={styles.textButton}
            onPress={leftComponent.onPress}
            disabled={leftComponent.disabled}
          >
            <Text style={[
              styles.buttonText,
              leftComponent.disabled && styles.buttonTextDisabled
            ]}>
              {leftComponent.text}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const renderRightComponent = () => {
    if (!rightComponent) {
      return <View style={styles.rightContainer} />;
    }

    if (rightComponent.type === 'icon') {
      return (
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={rightComponent.onPress}
          >
            <Ionicons
              name={rightComponent.icon}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (rightComponent.type === 'button') {
      return (
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.textButton}
            onPress={rightComponent.onPress}
            disabled={rightComponent.disabled}
          >
            <Text style={[
              styles.buttonText,
              rightComponent.disabled && styles.buttonTextDisabled
            ]}>
              {rightComponent.text}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (rightComponent.type === 'text') {
      return (
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.textButton}
            onPress={rightComponent.onPress}
            disabled={rightComponent.disabled}
          >
            <Text style={[
              styles.buttonText,
              rightComponent.disabled && styles.buttonTextDisabled
            ]}>
              {rightComponent.text}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderLeftComponent()}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {renderRightComponent()}
    </View>
  );
};

export default Header; 