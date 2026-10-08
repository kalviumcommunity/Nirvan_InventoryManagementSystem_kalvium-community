import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDashboardData } from '../../store/mockData';

const ProgressBar = ({ available, total }: { available: number, total: number }) => {
  const percentage = Math.min(100, Math.max(0, (available / total) * 100));
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
    </View>
  );
};

export const DashboardScreen = () => {
  const { data, loading } = useDashboardData();

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A5D4E" />
      </SafeAreaView>
    );
  }

  const { user, stats, upcomingReturn, inventory, date } = data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>📦 Rentory</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconCircle}><Text>🔍</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle}><Text style={styles.avatarText}>{user.firstName[0]}</Text></TouchableOpacity>
          </View>
        </View>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.greeting}>Good morning, {user.firstName}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsCard}>
           <View style={styles.statItem}>
             <Text style={styles.statValue}>{stats.total}</Text>
             <Text style={styles.statLabel}>TOTAL</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
             <Text style={styles.statValue}>{stats.available}</Text>
             <Text style={styles.statLabel}>AVAILABLE</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
             <Text style={styles.statValue}>{stats.rented}</Text>
             <Text style={styles.statLabel}>RENTED</Text>
           </View>
        </View>

        {/* Upcoming Return */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>UPCOMING RETURN</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{upcomingReturn.status}</Text></View>
        </View>
        
        <View style={styles.returnCard}>
           <View style={styles.returnIconBox}><Text>📦</Text></View>
           <View style={styles.returnDetails}>
             <Text style={styles.returnTitle}>{upcomingReturn.title}</Text>
             <Text style={styles.returnSubtitle}>{upcomingReturn.details} • {upcomingReturn.dueTime}</Text>
           </View>
           <TouchableOpacity style={styles.chevron}><Text style={styles.chevronText}>›</Text></TouchableOpacity>
        </View>

        {/* Quick Inventory Status */}
        <View style={styles.sectionHeaderRow}>
           <View>
             <Text style={styles.inventoryTitle}>Quick Inventory Status</Text>
             <Text style={styles.inventorySubtitle}>Real-time availability balance</Text>
           </View>
           <TouchableOpacity><Text style={styles.viewAll}>View All ›</Text></TouchableOpacity>
        </View>

        <View style={styles.inventoryCard}>
          {inventory.map((item, index) => (
            <View key={item.id} style={[styles.inventoryItem, index === inventory.length - 1 && styles.noBorder]}>
              <View style={styles.inventoryItemHeader}>
                <Text style={styles.inventoryItemName}>
                   {item.icon === 'volume-high' ? '🔊 ' : item.icon === 'mic' ? '🎤 ' : '💡 '}
                   {item.name}
                </Text>
                <Text style={styles.inventoryItemCount}>
                  <Text style={styles.boldCount}>{item.available}</Text> of {item.total} available
                </Text>
              </View>
              <ProgressBar available={item.available} total={item.total} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+ New Rental</Text>
      </TouchableOpacity>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {['Dashboard', 'Inventory', 'Rentals', 'Settings'].map((tab, idx) => (
          <TouchableOpacity key={tab} style={styles.navItem}>
            <Text style={[styles.navIcon, idx === 0 && styles.activeNavIcon]}>
               {idx === 0 ? '📊' : idx === 1 ? '📦' : idx === 2 ? '📅' : '⚙️'}
            </Text>
            <Text style={[styles.navText, idx === 0 && styles.activeNavText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 24, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#4A5D4E' },
  date: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  statsCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 20, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 32 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5 },
  badge: { backgroundColor: '#E8F3EA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#4A5D4E', fontSize: 11, fontWeight: '600' },
  returnCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 32 },
  returnIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  returnDetails: { flex: 1 },
  returnTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  returnSubtitle: { fontSize: 13, color: '#666' },
  chevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  chevronText: { fontSize: 18, color: '#666', lineHeight: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  inventoryTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  inventorySubtitle: { fontSize: 13, color: '#888' },
  viewAll: { fontSize: 13, color: '#4A5D4E', fontWeight: '600', marginBottom: 2 },
  inventoryCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 100 },
  inventoryItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  noBorder: { borderBottomWidth: 0 },
  inventoryItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  inventoryItemName: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  inventoryItemCount: { fontSize: 13, color: '#888' },
  boldCount: { fontWeight: '700', color: '#1A1A1A' },
  progressContainer: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4A5D4E', borderRadius: 3 },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: '#4A5D4E', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, shadowColor: '#4A5D4E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  fabText: { color: 'white', fontSize: 15, fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: 20 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 12 },
  navIcon: { fontSize: 20, marginBottom: 4, opacity: 0.5 },
  activeNavIcon: { opacity: 1 },
  navText: { fontSize: 10, color: '#888', fontWeight: '500' },
  activeNavText: { color: '#4A5D4E', fontWeight: '600' }
});
