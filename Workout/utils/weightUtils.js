/**
 * Weight conversion utilities for handling kg/lbs conversions
 */

// Conversion constants
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

/**
 * Round weight to only allow whole numbers and .5 increments
 * @param {number} weight - The weight value to round
 * @returns {number} Rounded weight (only whole numbers and .5)
 */
const roundToHalfIncrement = (weight) => {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return 0;
  }
  // First fix floating point precision issues by rounding to 10 decimal places
  const precisionFixed = Math.round(weight * 10000000000) / 10000000000;
  // Then round to nearest 0.5
  return Math.round(precisionFixed * 2) / 2;
};

/**
 * Smart number formatting that removes unnecessary .0 decimals
 * Only allows whole numbers and .5 increments
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
const formatSmartDecimals = (num) => {
  // First, round to half increments
  const rounded = roundToHalfIncrement(num);
  
  // If it's a whole number, don't show decimals
  if (rounded % 1 === 0) {
    return rounded.toString();
  }
  
  // Otherwise, show as .5
  return rounded.toFixed(1);
};

/**
 * Convert weight from one unit to another
 * @param {number} weight - The weight value to convert
 * @param {string} fromUnit - The source unit ('kg' or 'lbs')
 * @param {string} toUnit - The target unit ('kg' or 'lbs')
 * @returns {number} The converted weight value
 */
export const convertWeight = (weight, fromUnit, toUnit) => {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return 0;
  }

  if (fromUnit === toUnit) {
    return weight;
  }

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * KG_TO_LBS;
  }

  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight * LBS_TO_KG;
  }

  return weight;
};

/**
 * Format weight for display with proper unit
 * @param {number} weight - The weight value (assumed to be in kg)
 * @param {string} preferredUnit - User's preferred unit ('kg' or 'lbs')
 * @param {number} decimals - Number of decimal places (default: smart formatting)
 * @returns {string} Formatted weight string with unit
 */
export const formatWeight = (weight, preferredUnit = 'kg', decimals = null) => {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return `0 ${preferredUnit}`;
  }

  // Convert from kg (assumed storage unit) to preferred unit
  const convertedWeight = convertWeight(weight, 'kg', preferredUnit);
  
  // Use smart formatting if no specific decimal count is provided
  if (decimals === null) {
    const maxDecimals = preferredUnit === 'lbs' ? 1 : 1; // Allow 1 decimal for both units
    const formattedValue = formatSmartDecimals(convertedWeight);
    return `${formattedValue} ${preferredUnit}`;
  } else {
    // Use specific decimal count if provided
    return `${convertedWeight.toFixed(decimals)} ${preferredUnit}`;
  }
};

/**
 * Format weight for display without unit
 * @param {number} weight - The weight value (assumed to be in kg)
 * @param {string} preferredUnit - User's preferred unit ('kg' or 'lbs')
 * @param {number} decimals - Number of decimal places (default: smart formatting)
 * @returns {string} Formatted weight string without unit
 */
export const formatWeightValue = (weight, preferredUnit = 'kg', decimals = null) => {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return '0';
  }

  // Convert from kg (assumed storage unit) to preferred unit
  const convertedWeight = convertWeight(weight, 'kg', preferredUnit);
  
  // Use smart formatting if no specific decimal count is provided
  if (decimals === null) {
    const maxDecimals = preferredUnit === 'lbs' ? 1 : 1; // Allow 1 decimal for both units
    return formatSmartDecimals(convertedWeight);
  } else {
    // Use specific decimal count if provided
    return convertedWeight.toFixed(decimals);
  }
};

/**
 * Calculate volume (weight × reps) in user's preferred unit
 * @param {number} weight - Weight value (assumed to be in kg)
 * @param {number} reps - Number of reps
 * @param {string} preferredUnit - User's preferred unit ('kg' or 'lbs')
 * @returns {number} Volume in preferred unit
 */
export const calculateVolume = (weight, reps, preferredUnit = 'kg') => {
  if (typeof weight !== 'number' || typeof reps !== 'number' || isNaN(weight) || isNaN(reps)) {
    return 0;
  }

  const convertedWeight = convertWeight(weight, 'kg', preferredUnit);
  return convertedWeight * reps;
};

/**
 * Get the unit label for display
 * @param {string} unit - The unit ('kg' or 'lbs')
 * @returns {string} Uppercase unit label
 */
export const getUnitLabel = (unit) => {
  return unit.toUpperCase();
};

/**
 * Convert weight for storage (convert user input to kg for consistent storage)
 * @param {number} weight - The weight value entered by user
 * @param {string} userUnit - The unit the user entered ('kg' or 'lbs')
 * @returns {number} Weight converted to kg for storage (rounded to .5 increments)
 */
export const convertWeightForStorage = (weight, userUnit) => {
  return convertWeight(weight, userUnit, 'kg');
};

/**
 * Convert weight from storage (convert stored kg to user's preferred unit)
 * @param {number} weight - The weight value from storage (in kg)
 * @param {string} preferredUnit - User's preferred unit ('kg' or 'lbs')
 * @returns {number} Weight converted to user's preferred unit
 */
export const convertWeightFromStorage = (weight, preferredUnit) => {
  return convertWeight(weight, 'kg', preferredUnit);
};

// Export the roundToHalfIncrement function
export { roundToHalfIncrement, formatSmartDecimals };