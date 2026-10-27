import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { DashboardData } from '../../store/mockData';

interface DashboardTabProps {
  data: DashboardData;
  displayName: string;
  initial: string;
  onNavigateTab: (tabIndex: number) => void;
  onOpenProfile: () => void;
  onNewRental: () => void;
}

const ProgressBar = ({ available, total }: { available: number; total: number }) => {
  const percentage = Math.min(100, Math.max(0, (available / total) * 100));
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
    </View>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  displayName,
  initial,
  onNavigateTab,
  onOpenProfile,
  onNewRental,
}) => {
  const { stats, upcomingReturn, inventory, date } = data;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>📦 Rentory</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconCircle}
              onPress={() => onNavigateTab(1)}
            >
              <Text>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconCircle, styles.avatarCircle]}
              onPress={onOpenProfile}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.greeting}>Good morning, {displayName}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main 3 Metrics */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{stats.available}</Text>
            <Text style={styles.statLabel}>AVAILABLE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.rented}</Text>
            <Text style={styles.statLabel}>RENTED</Text>
          </View>
        </View>

        {/* Section: Upcoming Return Alert */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>UPCOMING RETURN</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{upcomingReturn.status}</Text></View>
        </View>
        
        <TouchableOpacity 
          style={styles.returnCard} 
          activeOpacity={0.8}
          onPress={() => onNavigateTab(2)}
        >
          <View style={styles.returnIconBox}><Text style={{ fontSize: 20 }}>📦</Text></View>
          <View style={styles.returnDetails}>
            <Text style={styles.returnTitle}>{upcomingReturn.title}</Text>
            <Text style={styles.returnSubtitle}>{upcomingReturn.details} • {upcomingReturn.dueTime}</Text>
          </View>
          <View style={styles.chevron}><Text style={styles.chevronText}>›</Text></View>
        </TouchableOpacity>

        {/* Section: Quick Inventory Status */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Quick Inventory Status</Text>
            <Text style={styles.sectionSub}>Real-time availability balance</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab(1)}>
            <Text style={styles.viewAll}>View All ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inventoryCard}>
          {inventory.map((item, index) => (
            <View key={item.id} style={[styles.inventoryItem, index === inventory.length - 1 && styles.noBorder]}>
              <View style={styles.inventoryItemHeader}>
                <Text style={styles.inventoryItemName}>
                  {item.icon === 'volume-high' ? '🔊 ' : item.icon === 'mic' ? '🎤 ' : item.icon === 'fog' ? '🌫️ ' : '💡 '}
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

        {/* Section: Recent Dispatch Feed */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Recent Fleet Activity</Text>
            <Text style={styles.sectionSub}>Latest dispatches and warehouse check-ins</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab(2)}>
            <Text style={styles.viewAll}>Rentals ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#2563EB' }]} />
            <View style={styles.activityTextCol}>
              <Text style={styles.activityTitle}>RN-8042 dispatched to Sharma Wedding</Text>
              <Text style={styles.activityTime}>4x JBL Speakers • Today at 10:30 AM</Text>
            </View>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#16A34A' }]} />
            <View style={styles.activityTextCol}>
              <Text style={styles.activityTitle}>RN-8041 returned from Tech Summit</Text>
              <Text style={styles.activityTime}>8x Wireless Mics • Verified & restocked</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.85}
        onPress={onNewRental}
      >
        <Text style={styles.fabText}>+ New Rental</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  avatarCircle: { backgroundColor: '#E8F3EA', borderWidth: 1.5, borderColor: '#4A5D4E' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#4A5D4E' },
  date: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  statsCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 20, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#EFEFEF', marginHorizontal: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5 },
  badge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },
  returnCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 28 },
  returnIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  returnDetails: { flex: 1 },
  returnTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  returnSubtitle: { fontSize: 13, color: '#666' },
  chevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  chevronText: { fontSize: 18, color: '#666', lineHeight: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  sectionHeading: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  sectionSub: { fontSize: 12, color: '#888' },
  viewAll: { fontSize: 13, color: '#4A5D4E', fontWeight: '600', marginBottom: 2 },
  inventoryCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 24 },
  inventoryItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  noBorder: { borderBottomWidth: 0 },
  inventoryItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inventoryItemName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  inventoryItemCount: { fontSize: 13, color: '#888' },
  boldCount: { fontWeight: '700', color: '#1A1A1A' },
  progressContainer: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4A5D4E', borderRadius: 3 },
  activityCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 24 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  activityTextCol: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  activityTime: { fontSize: 12, color: '#6B7280' },
  activityDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: '#4A5D4E', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 26, shadowColor: '#4A5D4E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  fabText: { color: 'white', fontSize: 15, fontWeight: '600' }
});
