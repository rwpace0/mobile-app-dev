import { useSettings } from '../state/SettingsContext';
import { useMemo } from 'react';
import { 
  formatWeight, 
  formatWeightValue, 
  calculateVolume, 
  getUnitLabel,
  convertWeightForStorage,
  convertWeightFromStorage,
  roundToHalfIncrement,
  formatSmartDecimals
} from './weightUtils';

/**
 * Custom hook for weight formatting using user's preferred unit
 * @returns {object} Weight formatting functions and current unit
 */
export const useWeight = () => {
  const { weightUnit } = useSettings();

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when weightUnit changes
  return useMemo(() => {
    /**
     * Format weight for display with unit
     * @param {number} weight - Weight value (assumed to be in kg)
     * @param {number} decimals - Number of decimal places (optional)
     * @returns {string} Formatted weight with unit
     */
    const format = (weight, decimals = null) => {
      return formatWeight(weight, weightUnit, decimals);
    };

    /**
     * Format weight value only (no unit)
     * @param {number} weight - Weight value (assumed to be in kg)
     * @param {number} decimals - Number of decimal places (optional)
     * @returns {string} Formatted weight value
     */
    const formatValue = (weight, decimals = null) => {
      return formatWeightValue(weight, weightUnit, decimals);
    };

    /**
     * Calculate volume in user's preferred unit
     * @param {number} weight - Weight value (assumed to be in kg)
     * @param {number} reps - Number of reps
     * @returns {number} Volume in user's preferred unit
     */
    const volume = (weight, reps) => {
      return calculateVolume(weight, reps, weightUnit);
    };

    /**
     * Get the current unit label for display
     * @returns {string} Uppercase unit label (KG or LBS)
     */
    const unitLabel = () => {
      return getUnitLabel(weightUnit);
    };

    /**
     * Convert weight for storage (from user's unit to kg)
     * @param {number} weight - Weight value in user's unit
     * @returns {number} Weight converted to kg for storage
     */
    const toStorage = (weight) => {
      return convertWeightForStorage(weight, weightUnit);
    };

    /**
     * Convert weight from storage (from kg to user's unit)
     * @param {number} weight - Weight value in kg from storage
     * @returns {number} Weight converted to user's preferred unit
     */
    const fromStorage = (weight) => {
      return convertWeightFromStorage(weight, weightUnit);
    };

    /**
     * Format a set display (weight × reps)
     * @param {number} weight - Weight value (assumed to be in kg)
     * @param {number} reps - Number of reps
     * @param {number} decimals - Number of decimal places (optional)
     * @returns {string} Formatted set display
     */
    const formatSet = (weight, reps, decimals = null) => {
      const formattedWeight = formatWeightValue(weight, weightUnit, decimals);
      return `${formattedWeight}${weightUnit} × ${reps}`;
    };

    /**
     * Format volume for display
     * @param {number} totalVolume - Total volume value
     * @param {number} decimals - Number of decimal places (optional)
     * @returns {string} Formatted volume with unit
     */
    const formatVolume = (totalVolume, decimals = null) => {
      return formatWeight(totalVolume, weightUnit, decimals);
    };

    return {
      // Current unit
      unit: weightUnit,
      unitLabel,

      // Formatting functions
      format,
      formatValue,
      formatSet,
      formatVolume,

      // Calculation functions
      volume,

      // Conversion functions
      toStorage,
      fromStorage,

      // Rounding functions
      roundToHalf: roundToHalfIncrement,
      formatSmart: formatSmartDecimals,
    };
  }, [weightUnit]); // Only recreate when weightUnit changes
}; 