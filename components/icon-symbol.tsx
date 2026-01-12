import { Platform, StyleProp, ViewStyle } from 'react-native';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { IconSymbol as MaterialIconSymbol } from './icon-symbol.material';
import { IconSymbol as CupertinoIconSymbol } from './icon-symbol.cupertino';

// Define a clear, unified interface for the component's props.
// This interface includes the 'weight' prop, making it valid for all platforms.
export interface IconSymbolProps {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}

export function IconSymbol(props: IconSymbolProps) {
  if (Platform.OS === 'ios') {
    return <CupertinoIconSymbol {...props} />;
  }

  // For non-iOS platforms, we pass all props to the Material component.
  // The Material component is designed to ignore the 'weight' prop, so no filtering is needed.
  return <MaterialIconSymbol {...props} />;
}
