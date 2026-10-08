import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';

interface WelcomeScreenProps {
  onNavigateLogin: () => void;
  brandName?: string;
  tagline?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onNavigateLogin,
  brandName = 'Assetly',
  tagline = '"Everything in its place, everywhere you go."'
}) => {
  return (
    <ImageBackground 
      source={require('../../assets/welcome-bg.png')} 
      style={styles.background}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <View style={styles.topIconContainer}>
          <View style={styles.iconBox}>
            <View style={styles.gridIcon} />
          </View>
        </View>
        
        <View style={styles.bottomContent}>
          <Text style={styles.title}>Welcome to {brandName}</Text>
          <Text style={styles.subtitle}>{tagline}</Text>
          
          <TouchableOpacity style={styles.button} onPress={onNavigateLogin}>
            <Text style={styles.buttonText}>Login / Sign up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  topIconContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIcon: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 4,
    borderStyle: 'dashed',
  },
  bottomContent: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: 'white',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4A5D4E',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});
