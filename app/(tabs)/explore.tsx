import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.titleContainer}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Explore</Text>
      </View>
      <Text>This app includes example code to help you get started.</Text>
      <Text style={{fontSize: 16, fontWeight: 'bold'}}>File-based routing</Text>
      <Text>
        This app has two screens:{' '}
        <Text style={{fontWeight: 'bold'}}>app/(tabs)/index.tsx</Text> and{' '}
        <Text style={{fontWeight: 'bold'}}>app/(tabs)/explore.tsx</Text>
      </Text>
      <Text>
        The layout file in <Text style={{fontWeight: 'bold'}}>app/(tabs)/_layout.tsx</Text>{' '}
        sets up the tab navigator.
      </Text>
      <Text style={{color: 'blue'}}>Learn more</Text>
      <Text style={{fontSize: 16, fontWeight: 'bold'}}>Android, iOS, and web support</Text>
      <Text>
        You can open this project on Android, iOS, and the web. To open the web version, press{' '}
        <Text style={{fontWeight: 'bold'}}>w</Text> in the terminal running this project.
      </Text>
      <Text style={{fontSize: 16, fontWeight: 'bold'}}>Images</Text>
      <Text>
        For static images, you can use the <Text style={{fontWeight: 'bold'}}>@2x</Text> and{' '}
        <Text style={{fontWeight: 'bold'}}>@3x</Text> suffixes to provide files for
        different screen densities
      </Text>
      <Image
        source={require('../../assets/images/react-logo.png')}
        style={{ width: 100, height: 100, alignSelf: 'center' }}
      />
      <Text style={{color: 'blue'}}>Learn more</Text>
      <Text style={{fontSize: 16, fontWeight: 'bold'}}>Light and dark mode components</Text>
      <Text>
        This template has light and dark mode support. The{' '}
        <Text style={{fontWeight: 'bold'}}>useColorScheme()</Text> hook lets you inspect
        what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
      </Text>
      <Text style={{color: 'blue'}}>Learn more</Text>
      <Text style={{fontSize: 16, fontWeight: 'bold'}}>Animations</Text>
      <Text>
        This template includes an example of an animated component. The{' '}
        <Text style={{fontWeight: 'bold'}}>components/HelloWave.tsx</Text> component uses
        the powerful{' '}
        <Text style={{fontWeight: 'bold'}}>
          react-native-reanimated
        </Text>{' '}
        library to create a waving hand animation.
      </Text>
      {Platform.select({
        ios: (
          <Text>
            The <Text style={{fontWeight: 'bold'}}>components/ParallaxScrollView.tsx</Text>{' '}
            component provides a parallax effect for the header image.
          </Text>
        ),
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
