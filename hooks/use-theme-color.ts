/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/colors';

export function useThemeColor(
  colorName: keyof typeof Colors
) {
  // This hook no longer distinguishes between light and dark themes.
  // It directly returns the color from the consolidated Colors object.
  return Colors[colorName];
}
