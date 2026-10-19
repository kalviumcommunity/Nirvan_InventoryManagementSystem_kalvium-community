import React, { useState } from 'react';
import { WelcomeScreen } from './src/features/auth/WelcomeScreen';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';

export default function App() {
  // Simple state-based navigation for demonstration purposes
  const [currentScreen, setCurrentScreen] = useState('Welcome');

  if (currentScreen === 'Welcome') {
    return <WelcomeScreen onNavigateLogin={() => setCurrentScreen('Login')} />;
  }

  if (currentScreen === 'Login') {
    return <LoginScreen onLogin={() => setCurrentScreen('Dashboard')} />;
  }

  return <DashboardScreen />;
} 