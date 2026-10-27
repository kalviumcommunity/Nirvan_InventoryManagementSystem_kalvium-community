import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WelcomeScreen } from './src/features/auth/WelcomeScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';

function MainNavigator() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'Welcome' | 'Login' | 'Dashboard'>('Welcome');

  useEffect(() => {
    if (user) {
      setCurrentScreen('Dashboard');
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A5D4E" />
      </View>
    );
  }

  // If user is authenticated, prioritize Dashboard
  if (user && currentScreen === 'Dashboard') {
    return <DashboardScreen onLogout={() => setCurrentScreen('Login')} />;
  }

  if (currentScreen === 'Welcome') {
    return <WelcomeScreen onNavigateLogin={() => setCurrentScreen('Login')} />;
  }

  return (
    <LoginScreen 
      onLogin={() => setCurrentScreen('Dashboard')} 
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});