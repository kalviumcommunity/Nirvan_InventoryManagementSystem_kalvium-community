import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert 
} from 'react-native';
import { apiFetch, DEFAULT_RENTALS_LIST, RentalOrder } from '../../store/mockData';

export const RentalsTab: React.FC = () => {
  const [rentals, setRentals] = useState<RentalOrder[]>(DEFAULT_RENTALS_LIST);
  const [filter, setFilter] = useState<'all' | 'active' | 'due_today' | 'returned'>('all');
  const [search, setSearch] = useState('');

  // New Rental Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [equipment, setEquipment] = useState('JBL EON 15" Speakers');
  const [units, setUnits] = useState('2');
  const [dueTime, setDueTime] = useState('Tomorrow, 6:00 PM');

  useEffect(() => {
    let active = true;
    apiFetch('/rentals')
      .then(response => {
        if (!response.ok) throw new Error('Rentals request failed');
        return response.json();
      })
      .then((data: Array<Record<string, unknown>>) => {
        if (!active) return;
        setRentals(data.map(rental => ({
          id: String(rental.id),
          displayId: `RN-80${40 + Number(rental.id)}`,
          client: String(rental.client_name),
          contact: String(rental.contact || rental.client_name),
          phone: String(rental.phone || ''),
          equipName: `${rental.quantity}x ${rental.item_name}`,
          units: Number(rental.quantity),
          startDate: 'Today',
          returnDate: String(rental.due_date || ''),
          dueText: String(rental.due_time || ''),
          status: rental.status === 'RETURNED' ? 'returned' : 'active',
        })));
      })
      .catch(() => {
        // Keep the local data available when the API is offline.
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRentals = rentals.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.client.toLowerCase().includes(search.toLowerCase()) ||
                          r.displayId.toLowerCase().includes(search.toLowerCase()) ||
                          r.equipName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = rentals.filter(r => r.status === 'active' || r.status === 'due_today').length;
  const dueTodayCount = rentals.filter(r => r.status === 'due_today').length;

  const handleMarkReturned = (id: string) => {
    apiFetch(`/rentals/${id}/return`, { method: 'POST' })
      .then(response => {
        if (!response.ok) throw new Error('Unable to return rental');
        setRentals(prev => prev.map(r => r.id === id
          ? { ...r, status: 'returned', dueText: 'Returned today' }
          : r));
      })
      .catch(() => Alert.alert('Unable to return rental', 'The backend could not update this rental.'));
  };

  const handleCreateRental = async () => {
    if (!clientName.trim()) {
      Alert.alert('Required', 'Please enter client or event name.');
      return;
    }

    const quantity = parseInt(units, 10) || 1;
    try {
      const inventoryResponse = await apiFetch('/inventory');
      if (!inventoryResponse.ok) throw new Error('Inventory request failed');
      const inventory = await inventoryResponse.json();
      const item = inventory.find((entry: { name: string }) =>
        entry.name.toLowerCase().includes(equipment.trim().toLowerCase()));
      if (!item) {
        Alert.alert('Equipment not found', 'Choose an equipment name that exists in inventory.');
        return;
      }

      const response = await apiFetch('/rentals', {
        method: 'POST',
        body: JSON.stringify({
          client_name: clientName.trim(),
          item_id: item.id,
          quantity,
          due_time: dueTime || 'Tomorrow, 6:00 PM',
          phone: phone.trim() || null,
          contact: clientName.trim(),
        }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || 'Unable to create rental');
      }
      const rental = await response.json();
      setRentals(prev => [{
        id: String(rental.id),
        displayId: `RN-80${40 + Number(rental.id)}`,
        client: rental.client_name,
        contact: rental.contact || rental.client_name,
        phone: rental.phone || '',
        equipName: `${rental.quantity}x ${rental.item_name}`,
        units: rental.quantity,
        startDate: 'Today',
        returnDate: rental.due_date || '',
        dueText: rental.due_time || '',
        status: 'active',
      }, ...prev]);
      setClientName('');
      setPhone('');
      setUnits('2');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Unable to create rental', error instanceof Error ? error.message : 'The backend could not create this rental.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Rentals</Text>
          <View style={styles.badgeRow}>
            {dueTodayCount > 0 && (
              <View style={[styles.headerPill, styles.duePill]}>
                <Text style={styles.duePillText}>{dueTodayCount} Due Today</Text>
              </View>
            )}
            <View style={[styles.headerPill, styles.activePill]}>
              <Text style={styles.activePillText}>{activeCount} Active</Text>
            </View>
          </View>
        </View>
        <Text style={styles.subtitle}>Fleet dispatches, contracts & customer returns</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by client, ID or gear..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'due_today', 'active', 'returned'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.activeFilterChip]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.activeFilterChipText]}>
                {f === 'due_today' ? 'Due Today' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredRentals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
            <Text style={styles.emptyTitle}>No rentals match your filter</Text>
            <Text style={styles.emptySub}>Try selecting "All" or create a new dispatch order.</Text>
          </View>
        ) : (
          filteredRentals.map(rental => {
            const isDueToday = rental.status === 'due_today';
            const isReturned = rental.status === 'returned';

            return (
              <View key={rental.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.idBox}>
                    <Text style={styles.idText}>{rental.displayId}</Text>
                  </View>
                  <View 
                    style={[
                      styles.statusBadge, 
                      isDueToday ? styles.dueBadge : isReturned ? styles.returnedBadge : styles.activeBadge
                    ]}
                  >
                    <Text 
                      style={[
                        styles.statusBadgeText,
                        isDueToday ? styles.dueBadgeText : isReturned ? styles.returnedBadgeText : styles.activeBadgeText
                      ]}
                    >
                      {isDueToday ? '⚠️ 1 Due Today' : isReturned ? '✓ Returned' : '● Active Dispatch'}
                    </Text>
                  </View>
                </View>

                {/* Client & Equipment */}
                <Text style={styles.clientTitle}>{rental.client}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📦</Text>
                  <Text style={styles.detailEquipment}>{rental.equipName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👤</Text>
                  <Text style={styles.detailContact}>{rental.contact} • {rental.phone}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>⏰</Text>
                  <Text style={styles.detailDue}>
                    {rental.dueText} ({rental.returnDate})
                  </Text>
                </View>

                {/* Actions */}
                {!isReturned ? (
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.markReturnedBtn}
                      onPress={() => handleMarkReturned(rental.id)}
                    >
                      <Text style={styles.markReturnedText}>📥 Mark as Returned</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.returnedRow}>
                    <Text style={styles.returnedLabel}>Completed & Inspected in Warehouse</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Add Rental Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ New Rental</Text>
      </TouchableOpacity>

      {/* New Rental Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Rental Dispatch</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Client / Event Name</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="e.g. Royal Banquet Hall"
              value={clientName}
              onChangeText={setClientName}
            />

            <Text style={styles.modalLabel}>Contact Phone</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="+91 98..."
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <Text style={styles.modalLabel}>Equipment</Text>
                <TextInput 
                  style={styles.modalInput}
                  placeholder="e.g. JBL Speakers"
                  value={equipment}
                  onChangeText={setEquipment}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.modalLabel}>Units</Text>
                <TextInput 
                  style={styles.modalInput}
                  placeholder="2"
                  keyboardType="numeric"
                  value={units}
                  onChangeText={setUnits}
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>Return Due Date / Time</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="e.g. Tomorrow, 6:00 PM"
              value={dueTime}
              onChangeText={setDueTime}
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateRental}>
              <Text style={styles.modalSubmitText}>Confirm & Dispatch Gear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  headerPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  duePill: { backgroundColor: '#FEE2E2' },
  duePillText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  activePill: { backgroundColor: '#E8F3EA' },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#4A5D4E' },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  clearIcon: { fontSize: 14, color: '#9CA3AF', padding: 4 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E5E7EB' },
  activeFilterChip: { backgroundColor: '#4A5D4E' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  activeFilterChipText: { color: 'white' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  emptyCard: { backgroundColor: 'white', borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  idBox: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  idText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  activeBadge: { backgroundColor: '#DCFCE7' },
  activeBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '700' },
  dueBadge: { backgroundColor: '#FEE2E2' },
  dueBadgeText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },
  returnedBadge: { backgroundColor: '#F3F4F6' },
  returnedBadgeText: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  clientTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailIcon: { fontSize: 14, marginRight: 8, width: 20 },
  detailEquipment: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  detailContact: { fontSize: 13, color: '#4B5563' },
  detailDue: { fontSize: 13, color: '#D97706', fontWeight: '500' },
  cardActions: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 8 },
  markReturnedBtn: { backgroundColor: '#E8F3EA', paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#C6E3CB' },
  markReturnedText: { fontSize: 13, fontWeight: '700', color: '#2B5738' },
  returnedRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 8, alignItems: 'center' },
  returnedLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: '#4A5D4E', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 26, shadowColor: '#4A5D4E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  fabText: { color: 'white', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: 'white', borderRadius: 20, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  modalClose: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14 },
  twoColRow: { flexDirection: 'row' },
  modalSubmitBtn: { backgroundColor: '#4A5D4E', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  modalSubmitText: { color: 'white', fontSize: 15, fontWeight: '600' }
});
