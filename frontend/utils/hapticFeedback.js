import * as Haptics from 'expo-haptics';

// Different types of haptic feedback
export const hapticTypes = {
  // Light impact - for subtle interactions
  light: 'light',
  // Medium impact - for standard interactions
  medium: 'medium',
  // Heavy impact - for important interactions
  heavy: 'heavy',
  // Success notification
  success: 'success',
  // Warning notification
  warning: 'warning',
  // Error notification
  error: 'error',
  // Selection change
  selection: 'selection',
};

/**
 * Trigger haptic feedback
 * @param {string} type - The type of haptic feedback to trigger
 */
export const triggerHaptic = async (type = hapticTypes.light) => {
  try {
    switch (type) {
      case hapticTypes.light:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case hapticTypes.medium:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case hapticTypes.heavy:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case hapticTypes.success:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case hapticTypes.warning:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case hapticTypes.error:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case hapticTypes.selection:
        await Haptics.selectionAsync();
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Light haptic feedback for subtle interactions
 */
export const hapticLight = () => triggerHaptic(hapticTypes.light);

/**
 * Medium haptic feedback for standard interactions
 */
export const hapticMedium = () => triggerHaptic(hapticTypes.medium);

/**
 * Heavy haptic feedback for important interactions
 */
export const hapticHeavy = () => triggerHaptic(hapticTypes.heavy);

/**
 * Success haptic feedback
 */
export const hapticSuccess = () => triggerHaptic(hapticTypes.success);

/**
 * Warning haptic feedback
 */
export const hapticWarning = () => triggerHaptic(hapticTypes.warning);

/**
 * Error haptic feedback
 */
export const hapticError = () => triggerHaptic(hapticTypes.error);

/**
 * Selection haptic feedback
 */
export const hapticSelection = () => triggerHaptic(hapticTypes.selection);

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = async () => {
  try {
    return await Haptics.isAvailableAsync();
  } catch (error) {
    return false;
  }
};

/**
 * Test haptic feedback functionality
 */
export const testHapticFeedback = async () => {
  try {
    const isSupported = await isHapticSupported();
    console.log('Haptic feedback supported:', isSupported);
    
    if (isSupported) {
      await hapticLight();
      console.log('Haptic feedback test successful');
      return true;
    } else {
      console.log('Haptic feedback not supported on this device');
      return false;
    }
  } catch (error) {
    console.error('Haptic feedback test failed:', error);
    return false;
  }
};

export default {
  triggerHaptic,
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticSelection,
  isHapticSupported,
  testHapticFeedback,
  hapticTypes,
}; 