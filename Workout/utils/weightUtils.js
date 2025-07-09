/**
 * Weight conversion utilities for handling kg/lbs conversions
 */

// Conversion constants
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

/**
 * Smart number formatting that removes unnecessary .0 decimals
 * @param {number} num - The number to format
 * @param {number} maxDecimals - Maximum decimal places to show
 * @returns {string} Formatted number string
 */
const formatSmartDecimals = (num, maxDecimals = 1) => {
  // First, round to a reasonable precision to avoid floating point issues
  // Round to 6 decimal places first to eliminate floating point errors
  const precisionFixed = Math.round(num * 1000000) / 1000000;
  
  // Then round to the desired decimal places
  const rounded = Math.round(precisionFixed * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  
  // If it's a whole number, don't show decimals
  if (rounded % 1 === 0) {
    return rounded.toString();
  }
  
  // Otherwise, show up to maxDecimals, removing trailing zeros
  return rounded.toFixed(maxDecimals).replace(/\.?0+$/, '');
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
    const formattedValue = formatSmartDecimals(convertedWeight, maxDecimals);
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
    return formatSmartDecimals(convertedWeight, maxDecimals);
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
 * @returns {number} Weight converted to kg for storage
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