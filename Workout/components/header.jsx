import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createStyles } from '../styles/header.styles';
import { getColors } from '../constants/colors';
import { useTheme } from '../state/SettingsContext';

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
        <TouchableOpacity
          style={[styles.leftContainer, styles.iconButton]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name={leftComponent.icon || "chevron-back"}
            size={24}
            color={colors.primaryBlue}
          />
        </TouchableOpacity>
      );
    }

    if (leftComponent.type === 'custom') {
      return (
        <TouchableOpacity
          style={[styles.leftContainer, styles.iconButton]}
          onPress={leftComponent.onPress}
        >
          <Ionicons
            name={leftComponent.icon}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      );
    }

    if (leftComponent.type === 'down') {
      return (
        <TouchableOpacity
          style={[styles.leftContainer, styles.iconButton]}
          onPress={leftComponent.onPress}
        >
          <Ionicons
            name="chevron-down-outline"
            size={24}
            color={colors.primaryBlue}
          />
        </TouchableOpacity>
      );
    }
  };

  const renderRightComponent = () => {
    if (!rightComponent) {
      return <View style={styles.rightContainer} />;
    }

    if (rightComponent.type === 'icon') {
      return (
        <TouchableOpacity
          style={[styles.rightContainer, styles.iconButton]}
          onPress={rightComponent.onPress}
        >
          <Ionicons
            name={rightComponent.icon}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      );
    }

    if (rightComponent.type === 'button') {
      return (
        <TouchableOpacity
          style={styles.rightContainer}
          onPress={rightComponent.onPress}
        >
          <Text style={styles.buttonText}>{rightComponent.text}</Text>
        </TouchableOpacity>
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