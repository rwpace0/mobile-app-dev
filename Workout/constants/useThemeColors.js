import { useTheme } from './ThemeContext';
import { getColors } from './colors';

export const useThemeColors = () => {
  const { isDark } = useTheme();
  return getColors(isDark);
};

export default useThemeColors; 