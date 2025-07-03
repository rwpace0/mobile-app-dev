import { useMemo } from 'react';
import { getColors } from './colors';
import { useTheme } from '../state/SettingsContext';

export const useThemeColors = () => {
  const { isDark } = useTheme();
  return useMemo(() => getColors(isDark), [isDark]);
};

export default useThemeColors;
