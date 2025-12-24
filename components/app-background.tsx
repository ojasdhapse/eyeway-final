import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
};

export default function AppBackground({ children, contentContainerStyle }: Props) {
  return (
    <ImageBackground
      source={require('../assets/images/bg.jpg')}
      style={styles.background}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      {/* Overlay to reduce bg image opacity */}
      <View style={styles.overlay} pointerEvents="none" />
      <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a1a2f', // fallback bg color
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 26, 47, 0.45)', // dark overlay, adjust alpha as needed
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingLeft: 16,
    paddingRight: 16,
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
});
