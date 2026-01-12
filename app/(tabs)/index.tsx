import { Platform, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.titleContainer}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Welcome!</Text>
      </View>
      <View style={styles.stepContainer}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>Step 1: Try it</Text>
        <Text>
          Edit <Text style={{fontWeight: 'bold'}}>app/(tabs)/index.tsx</Text> to see changes.
          Press{' '}
          <Text style={{fontWeight: 'bold'}}>
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </Text>{' '}
          to open developer tools.
        </Text>
      </View>
      <View style={styles.stepContainer}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>Step 2: Explore</Text>
        <Text>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </Text>
      </View>
      <View style={styles.stepContainer}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>Step 3: Get a fresh start</Text>
        <Text>
          {`When you're ready, run `}
          <Text style={{fontWeight: 'bold'}}>npm run reset-project</Text> to get a fresh{' '}
          <Text style={{fontWeight: 'bold'}}>app</Text> directory. This will move the current{' '}
          <Text style={{fontWeight: 'bold'}}>app</Text> to{' '}
          <Text style={{fontWeight: 'bold'}}>app-example</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
