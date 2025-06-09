import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/header.styles';
import colors from '../constants/colors';

const Header = ({ title, leftComponent, rightComponent }) => {
  const navigation = useNavigation();

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
            name="chevron-back"
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
            color={colors.textWhite}
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
            color={colors.textWhite}
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