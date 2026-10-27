import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../store/mockData';
import { InventoryTab } from '../inventory/InventoryTab';
import { RentalsTab } from '../rentals/RentalsTab';
import { SettingsTab } from '../settings/SettingsTab';
import { DashboardTab } from './DashboardTab';

interface DashboardScreenProps {
  onLogout?: () => void;
}

const TABS = ['Dashboard', 'Inventory', 'Rentals', 'Settings'] as const;

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onLogout }) => {
  const { data, loading } = useDashboardData();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A5D4E" />
      </SafeAreaView>
    );
  }

  const displayName =
    authUser?.displayName ||
    (authUser?.email ? authUser.email.split('@')[0] : data.user.firstName);
  const initial = (displayName ? displayName[0] : 'S').toUpperCase();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 1:
        return <InventoryTab />;
      case 2:
        return <RentalsTab />;
      case 3:
        return <SettingsTab onLogout={onLogout} />;
      default:
        return (
          <DashboardTab
            data={data}
            displayName={displayName}
            initial={initial}
            onNavigateTab={setActiveTab}
            onOpenProfile={() => setActiveTab(3)}
            onNewRental={() => setActiveTab(2)}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{renderActiveTab()}</View>
      <View style={styles.bottomNav}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.navItem}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === index }}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.navIcon, activeTab === index && styles.activeNavIcon]}>
              {index === 0 ? '📊' : index === 1 ? '📦' : index === 2 ? '📅' : '⚙️'}
            </Text>
            <Text style={[styles.navText, activeTab === index && styles.activeNavText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    height: 74,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    paddingVertical: 6,
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.55,
    marginBottom: 3,
  },
  activeNavIcon: {
    opacity: 1,
  },
  navText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#4A5D4E',
    fontWeight: '700',
  },
});
