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
import { apiFetch, DEFAULT_DETAILED_INVENTORY, DetailedInventoryItem } from '../../store/mockData';

export const InventoryTab: React.FC = () => {
  const [items, setItems] = useState<DetailedInventoryItem[]>(DEFAULT_DETAILED_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'audio' | 'lighting' | 'effects'>('all');
  
  // Add Equipment Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'audio' | 'lighting' | 'effects'>('audio');
  const [newTotal, setNewTotal] = useState('');
  const [newRate, setNewRate] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch('/inventory')
      .then(response => {
        if (!response.ok) throw new Error('Inventory request failed');
        return response.json();
      })
      .then((data: Array<Record<string, unknown>>) => {
        if (!active) return;
        setItems(data.map(item => {
          const category = String(item.category || '').toLowerCase();
          return {
            id: String(item.id),
            name: String(item.name),
            shortName: String(item.short_name || item.name),
            category: category.includes('light') ? 'lighting' : category.includes('fx') ? 'effects' : 'audio',
            total: Number(item.total),
            available: Number(item.available),
            rented: Number(item.rented),
            rate: Number(item.rate_per_day || 0),
            icon: category.includes('light') ? 'bulb' : category.includes('mic') ? 'mic' : category.includes('fx') ? 'fog' : 'volume-high',
          };
        }));
      })
      .catch(() => {
        // Keep the local data available when the API is offline.
      });
    return () => {
      active = false;
    };
  }, []);

  // Filtering
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalAvailable = items.reduce((sum, it) => sum + it.available, 0);
  const totalRented = items.reduce((sum, it) => sum + it.rented, 0);

  // Dispatch (Check out 1 unit)
  const handleCheckOut = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.available > 0) {
        return { ...item, available: item.available - 1, rented: item.rented + 1 };
      }
      return item;
    }));
  };

  // Return (Check in 1 unit)
  const handleCheckIn = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.rented > 0) {
        return { ...item, available: item.available + 1, rented: item.rented - 1 };
      }
      return item;
    }));
  };

  // Add equipment submit
  const handleAddEquipment = () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Please enter equipment name.');
      return;
    }
    const count = parseInt(newTotal, 10) || 5;
    const rate = parseInt(newRate, 10) || 30;

    const newItem: DetailedInventoryItem = {
      id: String(Date.now()),
      name: newName.trim(),
      shortName: newName.trim(),
      category: newCategory,
      total: count,
      available: count,
      rented: 0,
      rate: rate,
      icon: newCategory === 'audio' ? 'volume-high' : newCategory === 'lighting' ? 'bulb' : 'fog',
      location: 'Warehouse Bay 01',
    };

    apiFetch('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: newItem.name,
        short_name: newItem.shortName,
        category: newCategory === 'effects' ? 'FX' : newCategory,
        total: newItem.total,
        rate_per_day: newItem.rate,
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Unable to save equipment');
        return response.json();
      })
      .then(item => {
        setItems(prev => [{
          ...newItem,
          id: String(item.id),
        }, ...prev]);
      })
      .catch(() => Alert.alert('Unable to save', 'The backend could not save this equipment.'));
    setNewName('');
    setNewTotal('');
    setNewRate('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Inventory</Text>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>{totalAvailable} Available</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Fleet stock, availability & equipment warehouse</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search equipment or category..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.categoryRow}>
          {(['all', 'audio', 'lighting', 'effects'] as const).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.activeCategoryChip]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.activeCategoryChipText]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Stats Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>IN WAREHOUSE</Text>
            <Text style={[styles.overviewVal, { color: '#16A34A' }]}>{totalAvailable}</Text>
            <View style={styles.overviewBarBg}>
              <View style={[styles.overviewBarFill, { width: `${(totalAvailable / (totalAvailable + totalRented)) * 100}%`, backgroundColor: '#16A34A' }]} />
            </View>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>RENTED OUT</Text>
            <Text style={[styles.overviewVal, { color: '#D97706' }]}>{totalRented}</Text>
            <View style={styles.overviewBarBg}>
              <View style={[styles.overviewBarFill, { width: `${(totalRented / (totalAvailable + totalRented)) * 100}%`, backgroundColor: '#D97706' }]} />
            </View>
          </View>
        </View>

        {/* Equipment Items List */}
        <Text style={styles.listHeader}>Equipment Items ({filteredItems.length})</Text>

        {filteredItems.map(item => {
          const percentage = Math.min(100, Math.max(0, (item.available / item.total) * 100));
          const isLowStock = item.available <= 3;

          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.iconBox}>
                  <Text style={styles.itemEmoji}>
                    {item.icon === 'volume-high' ? '🔊' : item.icon === 'mic' ? '🎤' : item.icon === 'fog' ? '🌫️' : '💡'}
                  </Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{item.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.rateText}>${item.rate}/day</Text>
                    {item.location && <Text style={styles.locationText}>• {item.location}</Text>}
                  </View>
                </View>
                <View style={[styles.stockBadge, isLowStock ? styles.lowStockBadge : styles.inStockBadge]}>
                  <Text style={[styles.stockBadgeText, isLowStock ? styles.lowStockText : styles.inStockText]}>
                    {isLowStock ? 'Low Stock' : 'In Stock'}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressRow}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.stockCountText}>
                    <Text style={styles.boldNum}>{item.available}</Text> of {item.total} available
                  </Text>
                  <Text style={styles.rentedCountText}>{item.rented} rented</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: isLowStock ? '#E11D48' : '#4A5D4E'
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.dispatchBtn, item.available === 0 && styles.disabledBtn]} 
                  onPress={() => handleCheckOut(item.id)}
                  disabled={item.available === 0}
                >
                  <Text style={styles.dispatchBtnText}>📤 Check-Out (-1)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, styles.returnBtn, item.rented === 0 && styles.disabledBtn]} 
                  onPress={() => handleCheckIn(item.id)}
                  disabled={item.rented === 0}
                >
                  <Text style={styles.returnBtnText}>📥 Check-In (+1)</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Add Equipment Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ Add Equipment</Text>
      </TouchableOpacity>

      {/* Add Equipment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Equipment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Equipment Name</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="e.g. Pioneer DJ Mixer"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.modalCatRow}>
              {(['audio', 'lighting', 'effects'] as const).map(c => (
                <TouchableOpacity 
                  key={c}
                  style={[styles.modalCatBtn, newCategory === c && styles.modalCatBtnActive]}
                  onPress={() => setNewCategory(c)}
                >
                  <Text style={[styles.modalCatText, newCategory === c && styles.modalCatTextActive]}>
                    {c.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalLabel}>Total Quantity</Text>
                <TextInput 
                  style={styles.modalInput}
                  placeholder="10"
                  keyboardType="numeric"
                  value={newTotal}
                  onChangeText={setNewTotal}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.modalLabel}>Rate ($/day)</Text>
                <TextInput 
                  style={styles.modalInput}
                  placeholder="40"
                  keyboardType="numeric"
                  value={newRate}
                  onChangeText={setNewRate}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddEquipment}>
              <Text style={styles.modalSubmitText}>Save to Inventory</Text>
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
  statPill: { backgroundColor: '#E8F3EA', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statPillText: { fontSize: 12, fontWeight: '700', color: '#4A5D4E' },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  clearIcon: { fontSize: 14, color: '#9CA3AF', padding: 4 },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E5E7EB' },
  activeCategoryChip: { backgroundColor: '#4A5D4E' },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  activeCategoryChipText: { color: 'white' },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  overviewCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  overviewItem: { flex: 1, alignItems: 'center' },
  overviewLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 4 },
  overviewVal: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  overviewBarBg: { width: '80%', height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  overviewBarFill: { height: '100%', borderRadius: 3 },
  overviewDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  listHeader: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  itemCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemEmoji: { fontSize: 22 },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  rateText: { fontSize: 12, fontWeight: '600', color: '#4A5D4E' },
  locationText: { fontSize: 11, color: '#9CA3AF' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },
  inStockBadge: { backgroundColor: '#DCFCE7' },
  inStockText: { color: '#15803D', fontSize: 11, fontWeight: '700' },
  lowStockBadge: { backgroundColor: '#FFE4E6' },
  lowStockText: { color: '#BE123C', fontSize: 11, fontWeight: '700' },
  progressRow: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stockCountText: { fontSize: 12, color: '#6B7280' },
  boldNum: { fontWeight: '700', color: '#111827' },
  rentedCountText: { fontSize: 12, color: '#D97706', fontWeight: '500' },
  progressTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  dispatchBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  dispatchBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  returnBtn: { backgroundColor: '#E8F3EA', borderWidth: 1, borderColor: '#C6E3CB' },
  returnBtnText: { fontSize: 12, fontWeight: '700', color: '#2B5738' },
  disabledBtn: { opacity: 0.4 },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: '#4A5D4E', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 26, shadowColor: '#4A5D4E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  fabText: { color: 'white', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: 'white', borderRadius: 20, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  modalClose: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14 },
  modalCatRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modalCatBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  modalCatBtnActive: { backgroundColor: '#4A5D4E' },
  modalCatText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  modalCatTextActive: { color: 'white' },
  twoColRow: { flexDirection: 'row' },
  modalSubmitBtn: { backgroundColor: '#4A5D4E', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  modalSubmitText: { color: 'white', fontSize: 15, fontWeight: '600' }
});
