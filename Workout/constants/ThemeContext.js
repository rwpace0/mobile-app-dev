import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system'); // 'system', 'light', 'dark'
  const [actualTheme, setActualTheme] = useState('dark'); // the actual theme being used

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setActualTheme(colorScheme === 'light' ? 'light' : 'dark');
      }
    });

    return () => subscription?.remove();
  }, [theme]);

  // Update actual theme when theme setting changes
  useEffect(() => {
    if (theme === 'system') {
      const systemTheme = Appearance.getColorScheme();
      setActualTheme(systemTheme === 'light' ? 'light' : 'dark');
    } else {
      setActualTheme(theme);
    }
  }, [theme]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const changeTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value = {
    theme,
    actualTheme,
    changeTheme,
    isLight: actualTheme === 'light',
    isDark: actualTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 