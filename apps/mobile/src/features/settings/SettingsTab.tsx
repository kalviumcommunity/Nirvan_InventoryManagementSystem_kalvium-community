import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_SETTINGS_DATA } from '../../store/mockData';

interface SettingsTabProps {
  onLogout?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onLogout }) => {
  const { user, signOut, isFirebaseLive, resetPassword } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_DATA);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [lowStockWarning, setLowStockWarning] = useState(true);
  const [autoReceipts, setAutoReceipts] = useState(true);

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : settings.userName);
  const displayEmail = user?.email || 'name@rentory.supply';
  const initial = (displayName ? displayName[0] : 'S').toUpperCase();

  const handleSignOut = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out from Firebase?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            if (onLogout) onLogout();
          }
        }
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!displayEmail) return;
    try {
      await resetPassword(displayEmail);
      Alert.alert('Reset Link Dispatched', `A password reset link was sent to ${displayEmail}.`);
    } catch {
      Alert.alert('Error', 'Could not send reset email. Verify Firebase configuration.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Operator profile, warehouse configuration & Firebase Auth</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{settings.userRole} • {settings.userCompany}</Text>
            </View>
          </View>
        </View>

        {/* Firebase Authentication & Security Section */}
        <Text style={styles.sectionHeader}>AUTHENTICATION & SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Auth Status</Text>
              <Text style={styles.rowSubtitle}>Identity provider connection</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: isFirebaseLive ? '#DCFCE7' : '#FEF3C7' }]}>
              <View style={[styles.statusDot, { backgroundColor: isFirebaseLive ? '#16A34A' : '#D97706' }]} />
              <Text style={[styles.statusText, { color: isFirebaseLive ? '#15803D' : '#B45309' }]}>
                {isFirebaseLive ? 'Firebase Live' : 'Demo Mode'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Terminal Identifier</Text>
              <Text style={styles.rowSubtitle}>Registered warehouse workstation</Text>
            </View>
            <Text style={styles.rowValue}>Terminal 07</Text>
          </View>

          {user?.uid && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View>
                  <Text style={styles.rowTitle}>Firebase UID</Text>
                  <Text style={styles.rowSubtitle}>Cloud auth token identifier</Text>
                </View>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {user.uid.substring(0, 14)}...
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetPassword}>
            <Text style={styles.resetBtnText}>🔑 Send Password Reset Email</Text>
          </TouchableOpacity>
        </View>

        {/* Warehouse Terminal Settings */}
        <Text style={styles.sectionHeader}>WAREHOUSE PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Logistics Hub</Text>
              <Text style={styles.rowSubtitle}>Central dispatch warehouse</Text>
            </View>
            <Text style={styles.rowValue}>Apex Hub (Bay 4)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Gate Working Hours</Text>
              <Text style={styles.rowSubtitle}>Equipment check-in window</Text>
            </View>
            <Text style={styles.rowValue}>07:00 AM - 10:00 PM</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Overdue Return Alerts</Text>
              <Text style={styles.rowSubtitle}>Push notification when equipment is past due</Text>
            </View>
            <Switch 
              value={overdueAlerts}
              onValueChange={setOverdueAlerts}
              trackColor={{ false: '#E5E7EB', true: '#4A5D4E' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Low Inventory Warnings</Text>
              <Text style={styles.rowSubtitle}>Highlight gear with &le; 3 available units</Text>
            </View>
            <Switch 
              value={lowStockWarning}
              onValueChange={setLowStockWarning}
              trackColor={{ false: '#E5E7EB', true: '#4A5D4E' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Auto-Generate Return Slips</Text>
              <Text style={styles.rowSubtitle}>Create digital inspection receipt on return</Text>
            </View>
            <Switch 
              value={autoReceipts}
              onValueChange={setAutoReceipts}
              trackColor={{ false: '#E5E7EB', true: '#4A5D4E' }}
            />
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>🚪 Log Out from Firebase</Text>
        </TouchableOpacity>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Rentory Supply Ledger v1.2.0 • Build 2026.10</Text>
          <Text style={styles.footerText}>Encrypted with Firebase Auth & JWT</Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F3EA', borderWidth: 2, borderColor: '#4A5D4E', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#4A5D4E' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  profileEmail: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  roleTag: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleTagText: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  rowSubtitle: { fontSize: 12, color: '#9CA3AF' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  resetBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, marginVertical: 4 },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: '#4A5D4E' },
  signOutButton: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 20 },
  signOutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  footerInfo: { alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 }
});
