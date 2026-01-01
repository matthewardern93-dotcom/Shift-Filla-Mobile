import { Platform } from 'react-native';
import { IconSymbol as MaterialIconSymbol } from './icon-symbol.material';
import { IconSymbol as CupertinoIconSymbol } from './icon-symbol.cupertino';

export function IconSymbol(props) {
  if (Platform.OS === 'ios') {
    return <CupertinoIconSymbol {...props} />;
  } else {
    return <MaterialIconSymbol {...props} />;
  }
}
