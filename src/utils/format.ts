// Utility function to format sensitivity with smart decimal places
export const formatSensitivity = (value: number): string => {
  const toThreeDecimals = value.toFixed(3);
  // If the third decimal is 0, show only 2 decimals
  if (toThreeDecimals.endsWith('0')) {
    return toThreeDecimals.slice(0, -1); // Remove the last character (the 0)
  }
  return toThreeDecimals;
};