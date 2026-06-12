import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function NellaHeader() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/LOGO SIN FONDO.png')}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 130,
    height: 90,
  },
});
