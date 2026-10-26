/**
 * Rentory - Inventory & Rental Dispatch Management System
 * Dynamic Frontend Controller with Bidirectional FastAPI Synchronization
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'http://localhost:8000/api';
  let isBackendConnected = false;

  // --- DEFAULT DATA TEMPLATE (Fallback / Offline State) ---
  const DEFAULT_DATA = {
    settings: {
      userName: 'Sarah Jenkins',
      userRole: 'Warehouse Lead',
      userCompany: 'Apex Event Gear',
      hubName: 'Warehouse Hub',
      hubSub: 'Central Logistics Hub',
      gateHours: '07:00 AM - 10:00 PM',
      overdueAlerts: true,
      lowStockWarning: true
    },
    inventory: {
      '1': {
        id: '1',
        slug: 'speakers',
        name: 'JBL EON 15" Speakers',
        shortName: 'Speakers',
        category: 'audio',
        total: 20,
        available: 10,
        rented: 10,
        icon: 'ph-speaker-hifi',
        img: 'speaker.png',
        rate: 45
      },
      '2': {
        id: '2',
        slug: 'microphones',
        name: 'Wireless Microphones (Shure)',
        shortName: 'Microphones',
        category: 'audio',
        total: 15,
        available: 12,
        rented: 3,
        icon: 'ph-microphone',
        img: 'microphone.png',
        rate: 25
      },
      '3': {
        id: '3',
        slug: 'lights',
        name: 'Stage Lights (RGBW DMX)',
        shortName: 'Stage Lights',
        category: 'lighting',
        total: 30,
        available: 20,
        rented: 10,
        icon: 'ph-lightbulb',
        img: 'lights.png',
        rate: 35
      },
      '4': {
        id: '4',
        slug: 'fog',
        name: 'Fog & FX Machines',
        shortName: 'Fog & FX Machines',
        category: 'effects',
        total: 8,
        available: 5,
        rented: 3,
        icon: 'ph-cloud-fog',
        img: 'fog.png',
        rate: 60
      }
    },
    rentals: [
      {
        id: '1',
        displayId: 'RN-8042',
        client: 'Sharma Wedding',
        equipId: '1',
        equipName: 'JBL EON 15" Speakers',
        units: 4,
        phone: '+91 98201 55432',
        contact: 'Rahul Sharma (+91 98402 11920)',
        startDate: '20 Sep, 10:30 AM',
        returnDate: '21 Sep 2025, 06:00 PM',
        dueText: 'Due today 6 PM',
        isUrgent: true,
        status: 'active'
      },
      {
        id: '2',
        displayId: 'RN-8043',
        client: 'ABC Events',
        equipId: '1',
        equipName: 'JBL EON 15" Speakers',
        units: 3,
        phone: '+91 98111 22334',
        contact: 'Anita Gupta (+91 98111 22334)',
        startDate: '19 Sep, 02:00 PM',
        returnDate: '22 Sep 2025, 05:00 PM',
        dueText: 'Due 22 Sep',
        isUrgent: false,
        status: 'active'
      },
      {
        id: '3',
        displayId: 'RN-8044',
        client: 'Royal Events',
        equipId: '1',
        equipName: 'JBL EON 15" Speakers',
        units: 3,
        phone: '+91 98765 43210',
        contact: 'Vikram Malhotra (+91 98765 43210)',
        startDate: '18 Sep, 11:00 AM',
        returnDate: '23 Sep 2025, 08:00 PM',
        dueText: 'Due 23 Sep',
        isUrgent: false,
        status: 'active'
      },
      {
        id: '4',
        displayId: 'RN-8045',
        client: 'Nexus Tech Summit',
        equipId: '3',
        equipName: 'Stage Lights (RGBW DMX)',
        units: 6,
        phone: '+91 98333 44556',
        contact: 'Pooja Iyer (+91 98333 44556)',
        startDate: '17 Sep, 09:00 AM',
        returnDate: '24 Sep 2025, 10:00 PM',
        dueText: 'Due 24 Sep',
        isUrgent: false,
        status: 'active'
      },
      {
        id: '5',
        displayId: 'RN-8046',
        client: 'City Hall Gala',
        equipId: '2',
        equipName: 'Wireless Microphones (Shure)',
        units: 3,
        phone: '+91 98444 55667',
        contact: 'Karan Mehra (+91 98444 55667)',
        startDate: '16 Sep, 08:00 AM',
        returnDate: '20 Sep 2025, 02:00 PM',
        dueText: 'Completed',
        isUrgent: false,
        status: 'returned'
      }
    ],
    selectedEquipId: '1',
    currentEditingRentalId: '1',
    historyStack: ['inventory-page']
  };

  // --- LOCAL STORAGE CONTROLLER ---
  const STORAGE_KEY = 'rentory_ims_data_v3';
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_DATA,
          ...parsed,
          settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
          inventory: { ...DEFAULT_DATA.inventory, ...(parsed.inventory || {}) },
          rentals: parsed.rentals && parsed.rentals.length ? parsed.rentals : DEFAULT_DATA.rentals,
          historyStack: ['inventory-page']
        };
      }
    } catch (e) {
      console.warn('Failed to parse cached state, falling back to defaults:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        settings: state.settings,
        inventory: state.inventory,
        rentals: state.rentals,
        selectedEquipId: state.selectedEquipId,
        currentEditingRentalId: state.currentEditingRentalId
      }));
    } catch (e) {
      console.warn('Failed to persist local cache:', e);
    }
  }

  // --- FASTAPI BACKEND SYNC LAYER ---
  async function syncWithBackend(showNotify = false) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const [invRes, rentRes, dashRes] = await Promise.all([
        fetch(`${API_BASE}/inventory`, { signal: controller.signal }),
        fetch(`${API_BASE}/rentals`, { signal: controller.signal }),
        fetch(`${API_BASE}/dashboard`, { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);

      if (!invRes.ok || !rentRes.ok || !dashRes.ok) {
        throw new Error('API response was not ok');
      }

      const invData = await invRes.json();
      const rentData = await rentRes.json();
      const dashData = await dashRes.json();

      // Transform backend inventory into state map
      const freshInventory = {};
      invData.forEach(item => {
        const strId = String(item.id);
        const cat = (item.category || 'audio').toLowerCase();
        freshInventory[strId] = {
          id: strId,
          slug: item.short_name ? item.short_name.toLowerCase().replace(/[^a-z0-9]/g, '') : `item${item.id}`,
          name: item.name,
          shortName: item.short_name || item.name,
          category: cat.includes('light') ? 'lighting' : cat.includes('fx') || cat.includes('stage') ? 'effects' : 'audio',
          total: item.total,
          available: item.available,
          rented: item.rented,
          icon: item.icon || 'ph-package',
          img: item.image_url || 'speaker.png',
          rate: item.rate_per_day || 35
        };
      });

      // Transform backend rentals into state list
      const freshRentals = rentData.map(r => ({
        id: String(r.id),
        displayId: `RN-80${40 + r.id}`,
        client: r.client_name,
        equipId: String(r.item_id),
        equipName: r.item_name,
        units: r.quantity,
        phone: r.phone || '+91 98201 55432',
        contact: r.contact || `${r.client_name} Office`,
        startDate: '20 Sep, 10:30 AM',
        returnDate: r.due_date || '21 Sep 2025, 06:00 PM',
        dueText: r.due_time || 'Due today 6 PM',
        isUrgent: r.is_urgent === 1 || (r.status === 'ACTIVE' && (r.due_time || '').includes('today')),
        status: (r.status || 'ACTIVE').toLowerCase()
      }));

      // Apply synced data
      if (Object.keys(freshInventory).length > 0) {
        state.inventory = freshInventory;
      }
      state.rentals = freshRentals;

      if (dashData && dashData.user) {
        state.settings.userName = dashData.user.firstName || state.settings.userName;
      }

      // Update backend status indicator
      isBackendConnected = true;
      updateBackendStatusIndicator(true);
      saveState();
      renderAll();

      if (showNotify) {
        showToast('Connected to FastAPI (Database Live)', 'ph-broadcast');
      }
    } catch (err) {
      console.warn('Backend server offline or unreachable. Running in local dynamic fallback mode.', err);
      isBackendConnected = false;
      updateBackendStatusIndicator(false);
      renderAll();
      if (showNotify) {
        showToast('FastAPI server offline. Using local dynamic cache.', 'ph-wifi-slash');
      }
    }
  }

  function updateBackendStatusIndicator(connected) {
    const dot = document.getElementById('backend-status-dot');
    const label = document.getElementById('backend-status-label');
    if (dot) {
      dot.style.backgroundColor = connected ? '#22c55e' : '#f59e0b';
    }
    if (label) {
      label.textContent = connected ? 'Connected to FastAPI (Live)' : 'Local Dynamic Cache (Offline)';
      label.style.color = connected ? '#16a34a' : '#d97706';
    }
  }

  // --- DOM ELEMENTS ---
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');
  const bottomNav = document.getElementById('main-bottom-nav');
  const toastEl = document.getElementById('app-toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  // --- TOAST HELPER ---
  let toastTimer = null;
  function showToast(message, iconClass = 'ph-check-circle') {
    if (toastTimer) clearTimeout(toastTimer);
    if (!toastEl || !toastMessage || !toastIcon) return;
    toastMessage.textContent = message;
    toastIcon.className = `ph-fill ${iconClass} toast-icon`;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2500);
  }

  // --- PAGE NAVIGATION CONTROLLER ---
  function navigateTo(targetPageId, addToHistory = true) {
    if (addToHistory && state.historyStack[state.historyStack.length - 1] !== targetPageId) {
      state.historyStack.push(targetPageId);
    }

    pages.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    const isDetailPage = ['equipment-details-page', 'add-rental-page', 'edit-rental-page'].includes(targetPageId);
    if (bottomNav) {
      bottomNav.style.display = isDetailPage ? 'none' : 'flex';
    }
    if (!isDetailPage) {
      updateBottomNavActive(targetPageId);
    }

    if (targetPageId === 'inventory-page') renderInventory();
    if (targetPageId === 'rentals-page') renderRentalsTab();
    if (targetPageId === 'dashboard-page') renderDashboard();
    if (targetPageId === 'settings-page') renderSettings();
    if (targetPageId === 'equipment-details-page') renderEquipmentDetails(state.selectedEquipId);
  }

  function goBack() {
    if (state.historyStack.length > 1) {
      state.historyStack.pop();
      const prevPageId = state.historyStack[state.historyStack.length - 1];
      navigateTo(prevPageId, false);
    } else {
      navigateTo('inventory-page', false);
    }
  }

  function updateBottomNavActive(pageId) {
    navItems.forEach(item => {
      const target = item.getAttribute('data-target');
      const icon = item.querySelector('i');
      if (target === pageId) {
        item.classList.add('active');
        if (icon) {
          icon.classList.remove('ph');
          icon.classList.add('ph-fill');
        }
      } else {
        item.classList.remove('active');
        if (icon) {
          icon.classList.remove('ph-fill');
          icon.classList.add('ph');
        }
      }
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = item.getAttribute('data-target');
      if (targetPageId) {
        state.historyStack = [targetPageId];
        navigateTo(targetPageId, false);
      }
    });
  });

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => goBack());
  });

  // --- DYNAMIC INVENTORY PAGE (Screen 1) ---
  let activeCategoryFilter = 'all';

  function renderInventory() {
    const listContainer = document.getElementById('inventory-list-container');
    if (!listContainer) return;

    let totalAvail = 0;
    let totalRented = 0;

    Object.values(state.inventory).forEach(item => {
      totalAvail += (item.available || 0);
      totalRented += (item.rented || 0);
    });

    const totalStock = totalAvail + totalRented;
    const availPercent = totalStock > 0 ? (totalAvail / totalStock) * 100 : 0;
    const rentedPercent = totalStock > 0 ? (totalRented / totalStock) * 100 : 0;

    // Stat cards
    const availCountEl = document.getElementById('inv-stat-avail');
    const rentedCountEl = document.getElementById('inv-stat-rented');
    const availBarEl = document.getElementById('inv-bar-avail');
    const rentedBarEl = document.getElementById('inv-bar-rented');

    if (availCountEl) availCountEl.textContent = totalAvail;
    if (rentedCountEl) rentedCountEl.textContent = totalRented;
    if (availBarEl) availBarEl.style.width = `${availPercent}%`;
    if (rentedBarEl) rentedBarEl.style.width = `${rentedPercent}%`;

    // Filter items
    const searchQuery = (document.getElementById('inventory-search')?.value || '').toLowerCase().trim();
    const items = Object.values(state.inventory).filter(item => {
      const matchesCategory = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery) || 
        (item.shortName && item.shortName.toLowerCase().includes(searchQuery));
      return matchesCategory && matchesSearch;
    });

    listContainer.innerHTML = '';

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
          <i class="ph ph-magnifying-glass" style="font-size: 32px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          <p>No equipment matching your criteria.</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const pct = item.total > 0 ? Math.round((item.available / item.total) * 100) : 0;
      const card = document.createElement('div');
      card.className = 'list-card card equip-card cursor-pointer';
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-category', item.category);

      let mediaHtml = '';
      if (item.img) {
        mediaHtml = `<img src="${item.img}" alt="${item.name}" class="item-img" onerror="this.onerror=null; this.src='speaker.png';">`;
      } else {
        mediaHtml = `<div class="item-img-placeholder"><i class="ph ${item.icon || 'ph-package'}"></i></div>`;
      }

      card.innerHTML = `
        ${mediaHtml}
        <div class="item-details">
          <div class="item-title-row">
            <h4>${item.name}</h4>
            <span class="item-stock"><strong class="stock-avail">${item.available}</strong> / <span class="stock-total">${item.total}</span> Avail</span>
          </div>
          <div class="progress-bar-container"><div class="progress" style="width: ${pct}%"></div></div>
        </div>
      `;

      card.addEventListener('click', () => {
        state.selectedEquipId = String(item.id);
        navigateTo('equipment-details-page');
      });

      listContainer.appendChild(card);
    });
  }

  // Inventory Search Input
  const inventorySearchInput = document.getElementById('inventory-search');
  if (inventorySearchInput) {
    inventorySearchInput.addEventListener('input', () => {
      renderInventory();
    });
  }

  // Inventory Category Filters
  const filterTabs = document.querySelectorAll('#inventory-filter-tabs .filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategoryFilter = tab.getAttribute('data-category');
      renderInventory();
    });
  });

  // FAB: Add Equipment
  const btnAddEquip = document.getElementById('btn-add-equipment');
  const modalAddEquip = document.getElementById('modal-add-equipment');
  const closeAddEquip = document.getElementById('close-modal-equip');
  const cancelAddEquip = document.getElementById('btn-cancel-add-equip');
  const saveAddEquip = document.getElementById('btn-save-new-equip');

  if (btnAddEquip && modalAddEquip) {
    btnAddEquip.addEventListener('click', () => {
      modalAddEquip.style.display = 'flex';
      document.getElementById('modal-equip-name').value = '';
      document.getElementById('modal-equip-short').value = '';
      document.getElementById('modal-equip-qty').value = '10';
    });
  }

  if (closeAddEquip) closeAddEquip.addEventListener('click', () => modalAddEquip.style.display = 'none');
  if (cancelAddEquip) cancelAddEquip.addEventListener('click', () => modalAddEquip.style.display = 'none');

  if (saveAddEquip) {
    saveAddEquip.addEventListener('click', async () => {
      const name = document.getElementById('modal-equip-name').value.trim();
      const shortName = document.getElementById('modal-equip-short').value.trim() || name;
      const category = document.getElementById('modal-equip-category').value;
      const total = parseInt(document.getElementById('modal-equip-qty').value, 10);

      if (!name || isNaN(total) || total < 1) {
        showToast('Please enter a valid equipment name and stock quantity', 'ph-warning');
        return;
      }

      let icon = 'ph-speaker-hifi';
      let img = 'speaker.png';
      if (category === 'lighting') {
        icon = 'ph-lightbulb';
        img = 'lights.png';
      } else if (category === 'effects') {
        icon = 'ph-cloud-fog';
        img = 'fog.png';
      } else if (name.toLowerCase().includes('mic')) {
        icon = 'ph-microphone';
        img = 'microphone.png';
      }

      // Try Backend POST first
      try {
        const res = await fetch(`${API_BASE}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            short_name: shortName,
            category: category.charAt(0).toUpperCase() + category.slice(1),
            total,
            icon,
            image_url: img
          })
        });

        if (res.ok) {
          const created = await res.json();
          state.inventory[String(created.id)] = {
            id: String(created.id),
            slug: shortName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: created.name,
            shortName: created.short_name || created.name,
            category,
            total: created.total,
            available: created.available,
            rented: created.rented,
            icon: created.icon || icon,
            img: created.image_url || img,
            rate: created.rate_per_day || 35
          };
        } else {
          throw new Error('API creation failed');
        }
      } catch (e) {
        // Fallback local creation
        const newId = String(Date.now());
        state.inventory[newId] = {
          id: newId,
          slug: shortName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name,
          shortName,
          category,
          total,
          available: total,
          rented: 0,
          icon,
          img,
          rate: 35
        };
      }

      saveState();
      renderInventory();
      renderDashboard();
      modalAddEquip.style.display = 'none';
      showToast(`Added "${name}" (${total} units)`, 'ph-plus-circle');
    });
  }

  // --- DYNAMIC EQUIPMENT DETAILS PAGE (Screen 4) ---
  function renderEquipmentDetails(equipId) {
    const equip = state.inventory[equipId] || Object.values(state.inventory)[0];
    if (!equip) return;
    state.selectedEquipId = equip.id;

    // Header image & badges
    const imgEl = document.getElementById('equip-details-img');
    if (imgEl) imgEl.src = equip.img || 'speaker.png';

    const catBadge = document.getElementById('equip-details-cat-badge');
    if (catBadge) catBadge.textContent = (equip.category || 'Audio').toUpperCase();

    const iconEl = document.getElementById('equip-details-icon');
    if (iconEl) iconEl.className = `ph ${equip.icon || 'ph-speaker-hifi'}`;

    const titleEl = document.getElementById('equip-details-title');
    if (titleEl) titleEl.textContent = equip.name;

    const rateEl = document.getElementById('equip-details-rate');
    if (rateEl) rateEl.textContent = equip.rate ? `$${equip.rate}/day` : '$45/day';

    const headerTitle = document.getElementById('equip-details-header-title');
    if (headerTitle) headerTitle.textContent = equip.shortName;

    // 3-Column Stats
    const totalEl = document.getElementById('equip-stat-total');
    const availEl = document.getElementById('equip-stat-avail');
    const rentedEl = document.getElementById('equip-stat-rented');
    if (totalEl) totalEl.textContent = equip.total;
    if (availEl) availEl.textContent = equip.available;
    if (rentedEl) rentedEl.textContent = equip.rented;

    // Currently Rented List
    const container = document.getElementById('details-rented-list');
    if (!container) return;
    container.innerHTML = '';

    const matchingRentals = state.rentals.filter(r => String(r.equipId) === String(equip.id) && r.status === 'active');

    if (matchingRentals.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 24px;">
          <i class="ph ph-check-circle" style="font-size: 28px; color: var(--primary-green); margin-bottom: 6px; display: block;"></i>
          <p style="font-size: 14px; font-weight: 500; color: var(--text-main);">All units available in warehouse</p>
          <p style="font-size: 12px; margin-top: 4px;">No active dispatches for ${equip.shortName}.</p>
        </div>
      `;
    } else {
      matchingRentals.forEach(rental => {
        const itemCard = document.createElement('div');
        itemCard.className = 'rented-item-card card cursor-pointer';
        itemCard.setAttribute('data-rental-id', rental.id);
        itemCard.innerHTML = `
          <div class="rented-item-info">
            <h4>${rental.client}</h4>
            <p class="${rental.isUrgent ? 'due-urgent' : 'due-normal'}">${rental.dueText}</p>
          </div>
          <span class="rented-item-units">${rental.units} units</span>
        `;
        itemCard.addEventListener('click', () => {
          openEditRental(rental.id);
        });
        container.appendChild(itemCard);
      });
    }
  }

  // "+ Rent Out Units" button in Equipment Details
  const btnRentOutUnits = document.getElementById('btn-rent-out-units');
  if (btnRentOutUnits) {
    btnRentOutUnits.addEventListener('click', () => {
      openAddRental(state.selectedEquipId);
    });
  }

  // Stock edit button
  const btnEquipMore = document.getElementById('btn-equip-details-more');
  if (btnEquipMore) {
    btnEquipMore.addEventListener('click', async () => {
      const equip = state.inventory[state.selectedEquipId];
      if (!equip) return;
      const newTotalStr = prompt(`Edit total stock for ${equip.name}:`, equip.total);
      if (newTotalStr !== null) {
        const val = parseInt(newTotalStr, 10);
        if (!isNaN(val) && val >= equip.rented) {
          equip.total = val;
          equip.available = val - equip.rented;

          // Attempt sync to backend
          try {
            await fetch(`${API_BASE}/inventory/${equip.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ total: val })
            });
          } catch (e) {
            console.warn('Backend sync failed, saved locally:', e);
          }

          saveState();
          renderEquipmentDetails(equip.id);
          renderInventory();
          renderDashboard();
          showToast(`Stock updated to ${val} units`, 'ph-check-circle');
        } else {
          showToast(`Total must be at least ${equip.rented} (currently rented units)`, 'ph-warning');
        }
      }
    });
  }

  // --- DYNAMIC ADD RENTAL FLOW (Screen 3) ---
  let addRentalSelectedEquip = '1';
  let addRentalQuantity = 4;

  function openAddRental(equipId = '1') {
    if (!state.inventory[equipId]) {
      equipId = Object.keys(state.inventory)[0] || '1';
    }
    addRentalSelectedEquip = equipId;
    const equip = state.inventory[equipId];

    // Populate Dynamic Dropdown Menu
    const dropdown = document.getElementById('equip-dropdown-menu');
    if (dropdown) {
      dropdown.innerHTML = '';
      Object.values(state.inventory).forEach(item => {
        const dropItem = document.createElement('div');
        dropItem.className = `dropdown-item ${String(item.id) === String(equipId) ? 'active' : ''}`;
        dropItem.setAttribute('data-equip-id', item.id);
        dropItem.innerHTML = `
          <span><i class="ph ${item.icon || 'ph-package'}"></i> ${item.name}</span>
          <span class="avail-badge">${item.available} avail</span>
        `;
        dropItem.addEventListener('click', () => {
          selectEquipmentForAddRental(item.id);
          dropdown.classList.remove('open');
        });
        dropdown.appendChild(dropItem);
      });
    }

    addRentalQuantity = Math.min(4, Math.max(1, equip.available || 1));
    const qtyVal = document.getElementById('add-qty-val') || document.getElementById('rental-qty-val');
    if (qtyVal) qtyVal.textContent = addRentalQuantity;

    updateAddRentalEquipDisplay(equip);

    // Reset input fields
    const clientIn = document.getElementById('add-client-input') || document.getElementById('rental-client-input');
    const phoneIn = document.getElementById('add-phone-input') || document.getElementById('rental-phone-input');
    if (clientIn) clientIn.value = '';
    if (phoneIn) phoneIn.value = '';

    navigateTo('add-rental-page');
  }

  function updateAddRentalEquipDisplay(equip) {
    const iconBadge = document.getElementById('new-rental-icon') || document.getElementById('selected-equip-icon');
    const nameEl = document.getElementById('new-rental-equip-title') || document.getElementById('selected-equip-name');
    const availEl = document.getElementById('new-rental-avail-text') || document.getElementById('selected-equip-avail');

    if (iconBadge) {
      iconBadge.className = `ph ${equip.icon || 'ph-speaker-hifi'}`;
    }
    if (nameEl) nameEl.textContent = equip.name;
    if (availEl) {
      availEl.innerHTML = `${equip.available} available`;
    }
  }

  function selectEquipmentForAddRental(equipId) {
    addRentalSelectedEquip = String(equipId);
    const equip = state.inventory[addRentalSelectedEquip];
    if (!equip) return;

    updateAddRentalEquipDisplay(equip);

    if (addRentalQuantity > equip.available && equip.available > 0) {
      addRentalQuantity = equip.available;
      const qtyVal = document.getElementById('add-qty-val') || document.getElementById('rental-qty-val');
      if (qtyVal) qtyVal.textContent = addRentalQuantity;
    }
  }

  // Equipment Dropdown Toggle
  const equipSelectBox = document.getElementById('equip-select-box');
  const equipDropdownMenu = document.getElementById('equip-dropdown-menu');
  if (equipSelectBox && equipDropdownMenu) {
    equipSelectBox.addEventListener('click', (e) => {
      e.stopPropagation();
      equipDropdownMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      equipDropdownMenu.classList.remove('open');
    });
  }

  // Stepper: Add Rental
  const btnQtyMinus = document.getElementById('add-qty-minus') || document.getElementById('btn-qty-minus');
  const btnQtyPlus = document.getElementById('add-qty-plus') || document.getElementById('btn-qty-plus');

  if (btnQtyMinus) {
    btnQtyMinus.addEventListener('click', () => {
      if (addRentalQuantity > 1) {
        addRentalQuantity--;
        const qEl = document.getElementById('add-qty-val') || document.getElementById('rental-qty-val');
        if (qEl) qEl.textContent = addRentalQuantity;
      }
    });
  }

  if (btnQtyPlus) {
    btnQtyPlus.addEventListener('click', () => {
      const equip = state.inventory[addRentalSelectedEquip];
      if (equip && addRentalQuantity < equip.available) {
        addRentalQuantity++;
        const qEl = document.getElementById('add-qty-val') || document.getElementById('rental-qty-val');
        if (qEl) qEl.textContent = addRentalQuantity;
      } else {
        showToast(`Only ${equip ? equip.available : 0} units available in stock`, 'ph-warning');
      }
    });
  }

  const btnCancelRentalAdd = document.getElementById('btn-cancel-rental-add');
  if (btnCancelRentalAdd) {
    btnCancelRentalAdd.addEventListener('click', () => goBack());
  }

  // Submit: Confirm & Create Rental
  const btnConfirmRental = document.getElementById('btn-confirm-rental');
  if (btnConfirmRental) {
    btnConfirmRental.addEventListener('click', async () => {
      const clientName = (document.getElementById('add-client-input') || document.getElementById('rental-client-input'))?.value.trim();
      const phone = (document.getElementById('add-phone-input') || document.getElementById('rental-phone-input'))?.value.trim() || '+91 98201 00000';
      const returnDate = (document.getElementById('add-return-input') || document.getElementById('rental-return-date'))?.value || '21 Sep 2025, 06:00 PM';
      const equip = state.inventory[addRentalSelectedEquip];

      if (!clientName) {
        showToast('Please enter the client or event name', 'ph-warning');
        return;
      }

      if (!equip || equip.available < addRentalQuantity) {
        showToast('Selected quantity exceeds available stock', 'ph-warning');
        return;
      }

      let createdRental = null;
      try {
        const res = await fetch(`${API_BASE}/rentals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: clientName,
            item_id: parseInt(equip.id, 10),
            quantity: addRentalQuantity,
            due_time: 'Due today 6 PM',
            due_date: returnDate,
            phone: phone,
            contact: `${clientName} (${phone})`,
            is_urgent: 1
          })
        });

        if (res.ok) {
          const data = await res.json();
          createdRental = {
            id: String(data.id),
            displayId: `RN-80${40 + data.id}`,
            client: data.client_name,
            equipId: String(data.item_id),
            equipName: data.item_name,
            units: data.quantity,
            phone: data.phone || phone,
            contact: data.contact || `${clientName} (${phone})`,
            startDate: 'Today, 10:30 AM',
            returnDate: data.due_date || returnDate,
            dueText: data.due_time || 'Due today 6 PM',
            isUrgent: true,
            status: 'active'
          };
          equip.available = Math.max(0, equip.available - addRentalQuantity);
          equip.rented += addRentalQuantity;
        } else {
          throw new Error('API dispatch failed');
        }
      } catch (err) {
        console.warn('Backend offline, creating rental in local state:', err);
        // Fallback local rental creation
        const randId = String(Date.now());
        createdRental = {
          id: randId,
          displayId: `RN-${Math.floor(8000 + Math.random() * 900)}`,
          client: clientName,
          equipId: equip.id,
          equipName: equip.name,
          units: addRentalQuantity,
          phone: phone,
          contact: `${clientName} (${phone})`,
          startDate: 'Today, 10:30 AM',
          returnDate: returnDate,
          dueText: 'Due today 6 PM',
          isUrgent: true,
          status: 'active'
        };
        equip.available -= addRentalQuantity;
        equip.rented += addRentalQuantity;
      }

      state.rentals.unshift(createdRental);
      saveState();

      showToast(`Rental #${createdRental.displayId} dispatched to ${clientName}!`, 'ph-check-circle');
      renderInventory();
      renderRentalsTab();
      renderDashboard();
      goBack();
    });
  }

  // --- DYNAMIC EDIT RENTAL PAGE (Screen 5) ---
  let editRentalUnits = 1;

  function openEditRental(rentalId) {
    const rental = state.rentals.find(r => String(r.id) === String(rentalId));
    if (!rental) return;

    state.currentEditingRentalId = rental.id;
    editRentalUnits = rental.units;

    // Header display
    const headerTitle = document.getElementById('edit-page-rental-id');
    if (headerTitle) headerTitle.textContent = `Rental #${rental.displayId || 'RN-8042'}`;

    const badgeStatus = document.getElementById('edit-badge-status');
    if (badgeStatus) {
      if (rental.status === 'active') {
        badgeStatus.className = 'status-badge-active';
        badgeStatus.innerHTML = '<span class="badge-dot"></span> Active';
      } else {
        badgeStatus.className = 'status-badge-returned';
        badgeStatus.innerHTML = '<span class="badge-dot"></span> Returned';
      }
    }

    // Rental summary card
    const clientTitle = document.getElementById('edit-view-client-title');
    if (clientTitle) clientTitle.textContent = rental.client;

    const equipSummary = document.getElementById('edit-view-equip-summary');
    if (equipSummary) equipSummary.textContent = `${rental.units}x ${rental.equipName}`;

    const returnDateEl = document.getElementById('edit-view-return-date');
    if (returnDateEl) returnDateEl.textContent = rental.returnDate;

    // Form inputs
    const qtyVal = document.getElementById('edit-qty-val');
    if (qtyVal) qtyVal.textContent = editRentalUnits;

    const clientIn = document.getElementById('edit-input-client');
    if (clientIn) clientIn.value = rental.client;

    const contactIn = document.getElementById('edit-input-contact');
    if (contactIn) contactIn.value = rental.contact;

    const returnIn = document.getElementById('edit-input-return');
    if (returnIn) returnIn.value = rental.returnDate;

    // Return button text
    const btnMarkReturned = document.getElementById('btn-mark-units-returned');
    if (btnMarkReturned) {
      if (rental.status === 'active') {
        btnMarkReturned.innerHTML = '<i class="ph ph-check"></i> Mark Units as Returned';
        btnMarkReturned.className = 'btn-primary-green';
      } else {
        btnMarkReturned.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Reactivate Rental';
        btnMarkReturned.className = 'btn-outline-white';
      }
    }

    navigateTo('edit-rental-page');
  }

  // Stepper controls: Edit Rental
  const editQtyMinus = document.getElementById('edit-qty-minus');
  const editQtyPlus = document.getElementById('edit-qty-plus');
  const editQtyVal = document.getElementById('edit-qty-val');

  if (editQtyMinus) {
    editQtyMinus.addEventListener('click', () => {
      if (editRentalUnits > 1) {
        editRentalUnits--;
        editQtyVal.textContent = editRentalUnits;
      }
    });
  }

  if (editQtyPlus) {
    editQtyPlus.addEventListener('click', () => {
      const rental = state.rentals.find(r => String(r.id) === String(state.currentEditingRentalId));
      const equip = rental ? state.inventory[rental.equipId] : Object.values(state.inventory)[0];
      const delta = editRentalUnits + 1 - (rental ? rental.units : 0);
      if (equip && delta <= equip.available) {
        editRentalUnits++;
        editQtyVal.textContent = editRentalUnits;
      } else {
        showToast(`Only ${equip ? equip.available : 0} additional units in stock`, 'ph-warning');
      }
    });
  }

  // Return Rental action
  const btnMarkReturned = document.getElementById('btn-mark-units-returned');
  if (btnMarkReturned) {
    btnMarkReturned.addEventListener('click', async () => {
      const rental = state.rentals.find(r => String(r.id) === String(state.currentEditingRentalId));
      if (!rental) return;

      const equip = state.inventory[rental.equipId];

      if (rental.status === 'active') {
        // Mark returned
        try {
          await fetch(`${API_BASE}/rentals/${rental.id}/return`, { method: 'POST' });
        } catch (e) {
          console.warn('Backend offline, returned locally:', e);
        }
        rental.status = 'returned';
        if (equip) {
          equip.available = Math.min(equip.total, equip.available + rental.units);
          equip.rented = Math.max(0, equip.rented - rental.units);
        }
        rental.dueText = 'Returned';
        showToast(`${rental.units} units returned & stock restored!`, 'ph-check-circle');
      } else {
        // Reactivate
        if (equip && equip.available >= rental.units) {
          try {
            await fetch(`${API_BASE}/rentals/${rental.id}/reactivate`, { method: 'POST' });
          } catch (e) {
            console.warn('Backend offline, reactivated locally:', e);
          }
          rental.status = 'active';
          equip.available -= rental.units;
          equip.rented += rental.units;
          rental.dueText = 'Due today 6 PM';
          showToast('Rental reactivated!', 'ph-arrow-counter-clockwise');
        } else {
          showToast('Not enough units in stock to reopen rental', 'ph-warning');
          return;
        }
      }

      saveState();
      renderInventory();
      if (equip) renderEquipmentDetails(equip.id);
      renderRentalsTab();
      renderDashboard();
      goBack();
    });
  }

  // Save Rental Changes
  const btnSaveChanges = document.getElementById('btn-save-rental-changes');
  if (btnSaveChanges) {
    btnSaveChanges.addEventListener('click', async () => {
      const rental = state.rentals.find(r => String(r.id) === String(state.currentEditingRentalId));
      if (!rental) return;

      const equip = state.inventory[rental.equipId];
      const newClient = document.getElementById('edit-input-client')?.value.trim();
      const newContact = document.getElementById('edit-input-contact')?.value.trim();
      const newReturn = document.getElementById('edit-input-return')?.value.trim();

      if (rental.status === 'active' && editRentalUnits !== rental.units) {
        const delta = editRentalUnits - rental.units;
        if (delta > 0 && equip.available < delta) {
          showToast('Not enough stock for quantity increase', 'ph-warning');
          return;
        }
        equip.available -= delta;
        equip.rented += delta;
        rental.units = editRentalUnits;
      }

      if (newClient) rental.client = newClient;
      if (newContact) rental.contact = newContact;
      if (newReturn) rental.returnDate = newReturn;

      // Sync update to backend
      try {
        await fetch(`${API_BASE}/rentals/${rental.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: rental.client,
            quantity: rental.units,
            contact: rental.contact,
            due_date: rental.returnDate
          })
        });
      } catch (e) {
        console.warn('Backend sync failed, saved locally:', e);
      }

      saveState();
      showToast('Rental changes saved!', 'ph-check-circle');
      renderInventory();
      if (equip) renderEquipmentDetails(equip.id);
      renderRentalsTab();
      renderDashboard();
      goBack();
    });
  }

  // Cancel Rental
  const btnCancelRental = document.getElementById('btn-cancel-rental');
  if (btnCancelRental) {
    btnCancelRental.addEventListener('click', async () => {
      const rental = state.rentals.find(r => String(r.id) === String(state.currentEditingRentalId));
      if (!rental) return;

      if (confirm(`Cancel rental #${rental.displayId || rental.id} for "${rental.client}"?`)) {
        if (rental.status === 'active') {
          const equip = state.inventory[rental.equipId];
          if (equip) {
            equip.available = Math.min(equip.total, equip.available + rental.units);
            equip.rented = Math.max(0, equip.rented - rental.units);
          }
        }

        try {
          await fetch(`${API_BASE}/rentals/${rental.id}`, { method: 'DELETE' });
        } catch (e) {
          console.warn('Backend delete failed, removed locally:', e);
        }

        state.rentals = state.rentals.filter(r => String(r.id) !== String(rental.id));
        saveState();
        showToast(`Rental #${rental.displayId || rental.id} cancelled`, 'ph-x-circle');
        renderInventory();
        renderRentalsTab();
        renderDashboard();
        goBack();
      }
    });
  }

  // --- DYNAMIC RENTALS TAB PAGE (Screen 6) ---
  let activeRentalsFilter = 'all';

  function renderRentalsTab() {
    const listContainer = document.getElementById('all-rentals-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const q = (document.getElementById('rentals-search-input')?.value || '').toLowerCase().trim();

    let filtered = state.rentals;

    if (activeRentalsFilter === 'active') filtered = filtered.filter(r => r.status === 'active');
    else if (activeRentalsFilter === 'due-today') filtered = filtered.filter(r => r.isUrgent && r.status === 'active');
    else if (activeRentalsFilter === 'returned') filtered = filtered.filter(r => r.status === 'returned');

    if (q) {
      filtered = filtered.filter(r => 
        r.client.toLowerCase().includes(q) || 
        r.id.toLowerCase().includes(q) ||
        (r.displayId && r.displayId.toLowerCase().includes(q)) ||
        r.equipName.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
          <i class="ph ph-receipt" style="font-size: 32px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          <p>No rentals found matching criteria.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(rental => {
      const item = document.createElement('div');
      item.className = 'rental-overview-item card cursor-pointer';
      item.setAttribute('data-id', rental.id);
      item.innerHTML = `
        <div class="rental-left-info">
          <h4>${rental.client} <span style="font-size: 11px; font-weight: normal; color: var(--text-light); margin-left: 4px;">#${rental.displayId || rental.id}</span></h4>
          <p class="rental-equip-tag">${rental.units}x ${rental.equipName}</p>
          <span class="rental-due-tag ${rental.isUrgent ? 'due-urgent' : 'due-normal'}">${rental.dueText}</span>
        </div>
        <span class="${rental.status === 'active' ? 'status-badge-active' : 'status-badge-returned'}">
          <span class="badge-dot"></span> ${rental.status === 'active' ? 'Active' : 'Returned'}
        </span>
      `;
      item.addEventListener('click', () => {
        openEditRental(rental.id);
      });
      listContainer.appendChild(item);
    });
  }

  // Filter chips
  const rentalFilterTabs = document.querySelectorAll('.rental-filter-tab');
  rentalFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      rentalFilterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeRentalsFilter = tab.getAttribute('data-filter');
      renderRentalsTab();
    });
  });

  const rentalsSearchInput = document.getElementById('rentals-search-input');
  if (rentalsSearchInput) {
    rentalsSearchInput.addEventListener('input', () => {
      renderRentalsTab();
    });
  }

  const btnRentalsNew = document.getElementById('btn-rentals-new-fab');
  if (btnRentalsNew) {
    btnRentalsNew.addEventListener('click', () => {
      openAddRental(Object.keys(state.inventory)[0] || '1');
    });
  }

  // --- DYNAMIC SETTINGS PAGE (Screen 2) ---
  function renderSettings() {
    const nameEl = document.getElementById('user-profile-name');
    const roleEl = document.getElementById('user-profile-role');
    const compEl = document.getElementById('user-profile-company');
    const hubNameEl = document.getElementById('settings-hub-name');
    const hubSubEl = document.getElementById('settings-hub-sub');
    const gateHoursEl = document.getElementById('settings-gate-hours');
    const toggleOverdueEl = document.getElementById('toggle-overdue');
    const toggleLowStockEl = document.getElementById('toggle-low-stock');

    if (nameEl) nameEl.textContent = state.settings.userName;
    if (roleEl) roleEl.textContent = state.settings.userRole;
    if (compEl) compEl.textContent = state.settings.userCompany;
    if (hubNameEl) hubNameEl.textContent = state.settings.hubName;
    if (hubSubEl) hubSubEl.textContent = state.settings.hubSub;
    if (gateHoursEl) gateHoursEl.textContent = state.settings.gateHours;

    if (toggleOverdueEl) toggleOverdueEl.checked = state.settings.overdueAlerts;
    if (toggleLowStockEl) toggleLowStockEl.checked = state.settings.lowStockWarning;

    updateBackendStatusIndicator(isBackendConnected);
  }

  const pingBackendBtn = document.getElementById('btn-ping-backend');
  if (pingBackendBtn) {
    pingBackendBtn.addEventListener('click', () => {
      showToast('Testing FastAPI connection...', 'ph-arrows-clockwise');
      syncWithBackend(true);
    });
  }

  const toggleOverdue = document.getElementById('toggle-overdue');
  const toggleLowStock = document.getElementById('toggle-low-stock');

  if (toggleOverdue) {
    toggleOverdue.addEventListener('change', (e) => {
      state.settings.overdueAlerts = e.target.checked;
      saveState();
      showToast(`Overdue Return Alerts ${e.target.checked ? 'enabled' : 'disabled'}`, 'ph-bell-ringing');
    });
  }

  if (toggleLowStock) {
    toggleLowStock.addEventListener('change', (e) => {
      state.settings.lowStockWarning = e.target.checked;
      saveState();
      showToast(`Low Stock Warnings ${e.target.checked ? 'enabled' : 'disabled'}`, 'ph-warning-circle');
    });
  }

  // CSV Export Download
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += '--- INVENTORY STOCK REPORT ---\r\n';
      csvContent += 'ID,Item Name,Category,Total,Available,Rented\r\n';

      Object.values(state.inventory).forEach(item => {
        csvContent += `"${item.id}","${item.name}","${item.category}",${item.total},${item.available},${item.rented}\r\n`;
      });

      csvContent += '\r\n--- ACTIVE & RECENT RENTALS ---\r\n';
      csvContent += 'Rental ID,Client Name,Equipment,Units,Phone,Contact,Start Date,Return Date,Status\r\n';

      state.rentals.forEach(r => {
        csvContent += `"${r.displayId || r.id}","${r.client}","${r.equipName}",${r.units},"${r.phone}","${r.contact}","${r.startDate}","${r.returnDate}","${r.status}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rentory_inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exported CSV spreadsheet downloaded', 'ph-file-csv');
    });
  }

  // PDF Report Print Preview
  const btnExportPdf = document.getElementById('btn-export-pdf');
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Please allow popups to generate PDF report', 'ph-warning');
        return;
      }

      let equipRows = '';
      Object.values(state.inventory).forEach(item => {
        equipRows += `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.category}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.total}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #4C5D51;">${item.available}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.rented}</td>
        </tr>`;
      });

      let rentalRows = '';
      state.rentals.forEach(r => {
        rentalRows += `<tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">#${r.displayId || r.id}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.client}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.units}x ${r.equipName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.returnDate}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.status.toUpperCase()}</td>
        </tr>`;
      });

      printWindow.document.write(`
        <html>
        <head>
          <title>Rentory - Inventory & Rental Audit Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111; }
            h1 { color: #4C5D51; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 13px; }
            th { background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Rentory Official Inventory Report</h1>
          <p style="color: #666; font-size: 13px;">Generated on: ${new Date().toLocaleString()} | Lead: ${state.settings.userName}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 16px 0;">
          <h2>1. Equipment Inventory Status</h2>
          <table>
            <tr><th>Equipment Item</th><th>Category</th><th>Total</th><th>Available</th><th>Rented</th></tr>
            ${equipRows}
          </table>
          <h2>2. Rental Logs</h2>
          <table>
            <tr><th>Rental ID</th><th>Client</th><th>Equipment</th><th>Return Date</th><th>Status</th></tr>
            ${rentalRows}
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      showToast('PDF print preview opened', 'ph-file-pdf');
    });
  }

  // Reset Demo Data
  const btnResetDemo = document.getElementById('btn-reset-demo-data');
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', () => {
      if (confirm('Reset all inventory and rentals to initial demo data?')) {
        localStorage.removeItem(STORAGE_KEY);
        state = JSON.parse(JSON.stringify(DEFAULT_DATA));
        saveState();
        syncWithBackend(false);
        renderAll();
        showToast('Demo data restored to defaults', 'ph-arrows-clockwise');
      }
    });
  }

  // Logout button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showToast(`User ${state.settings.userName} signed out`, 'ph-sign-out');
    });
  }

  // Modal: Edit Profile
  const profileCardBtn = document.getElementById('profile-card-btn');
  const modalEditProfile = document.getElementById('modal-edit-profile');
  const closeModalProfile = document.getElementById('close-modal-profile');
  const btnCancelProfile = document.getElementById('btn-cancel-profile');
  const btnSaveProfile = document.getElementById('btn-save-profile');

  if (profileCardBtn && modalEditProfile) {
    profileCardBtn.addEventListener('click', () => {
      document.getElementById('modal-profile-name-input').value = state.settings.userName;
      document.getElementById('modal-profile-role-input').value = state.settings.userRole;
      document.getElementById('modal-profile-company-input').value = state.settings.userCompany;
      modalEditProfile.style.display = 'flex';
    });
  }

  if (closeModalProfile) closeModalProfile.addEventListener('click', () => modalEditProfile.style.display = 'none');
  if (btnCancelProfile) btnCancelProfile.addEventListener('click', () => modalEditProfile.style.display = 'none');

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const name = document.getElementById('modal-profile-name-input').value.trim() || state.settings.userName;
      const role = document.getElementById('modal-profile-role-input').value.trim() || state.settings.userRole;
      const company = document.getElementById('modal-profile-company-input').value.trim() || state.settings.userCompany;

      state.settings.userName = name;
      state.settings.userRole = role;
      state.settings.userCompany = company;

      saveState();
      renderSettings();
      renderDashboard();
      modalEditProfile.style.display = 'none';
      showToast('Profile updated!', 'ph-check-circle');
    });
  }

  // Modal: Edit Hub
  const rowWarehouseHub = document.getElementById('row-warehouse-hub');
  const rowGateHours = document.getElementById('row-gate-hours');
  const modalEditHub = document.getElementById('modal-edit-hub');
  const closeModalHub = document.getElementById('close-modal-hub');
  const btnCancelHub = document.getElementById('btn-cancel-hub');
  const btnSaveHub = document.getElementById('btn-save-hub');

  function openHubModal() {
    if (!modalEditHub) return;
    document.getElementById('modal-hub-name-input').value = state.settings.hubName;
    document.getElementById('modal-hub-sub-input').value = state.settings.hubSub;
    document.getElementById('modal-gate-hours-input').value = state.settings.gateHours;
    modalEditHub.style.display = 'flex';
  }

  if (rowWarehouseHub) rowWarehouseHub.addEventListener('click', openHubModal);
  if (rowGateHours) rowGateHours.addEventListener('click', openHubModal);
  if (closeModalHub) closeModalHub.addEventListener('click', () => modalEditHub.style.display = 'none');
  if (btnCancelHub) btnCancelHub.addEventListener('click', () => modalEditHub.style.display = 'none');

  if (btnSaveHub) {
    btnSaveHub.addEventListener('click', () => {
      const hubName = document.getElementById('modal-hub-name-input').value.trim() || state.settings.hubName;
      const hubSub = document.getElementById('modal-hub-sub-input').value.trim() || state.settings.hubSub;
      const gateHours = document.getElementById('modal-gate-hours-input').value.trim() || state.settings.gateHours;

      state.settings.hubName = hubName;
      state.settings.hubSub = hubSub;
      state.settings.gateHours = gateHours;

      saveState();
      renderSettings();
      modalEditHub.style.display = 'none';
      showToast('Warehouse logistics settings saved!', 'ph-check-circle');
    });
  }

  // QR Scanner Modal
  const btnScanQr = document.getElementById('btn-scan-qr');
  const modalQrScanner = document.getElementById('modal-qr-scanner');
  const closeQrModal = document.getElementById('close-modal-qr');
  const btnCancelQr = document.getElementById('btn-cancel-qr');
  const btnSimulateScan = document.getElementById('btn-simulate-scan');

  if (btnScanQr && modalQrScanner) {
    btnScanQr.addEventListener('click', () => {
      modalQrScanner.style.display = 'flex';
    });
  }
  if (closeQrModal) closeQrModal.addEventListener('click', () => modalQrScanner.style.display = 'none');
  if (btnCancelQr) btnCancelQr.addEventListener('click', () => modalQrScanner.style.display = 'none');

  if (btnSimulateScan) {
    btnSimulateScan.addEventListener('click', () => {
      modalQrScanner.style.display = 'none';
      const firstId = Object.keys(state.inventory)[0] || '1';
      state.selectedEquipId = firstId;
      navigateTo('equipment-details-page');
      showToast('Scanned QR: Asset verified in catalog', 'ph-qr-code');
    });
  }

  // --- DYNAMIC DASHBOARD (Screen 7) ---
  function renderDashboard() {
    const greetingEl = document.getElementById('dash-greeting-text');
    if (greetingEl) {
      greetingEl.textContent = `Good morning, ${state.settings.userName.split(' ')[0]}`;
    }

    const dateEl = document.getElementById('dash-current-date') || document.getElementById('dash-date-text');
    if (dateEl) {
      const today = new Date();
      dateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
    }

    let totalAvail = 0;
    let totalRented = 0;
    Object.values(state.inventory).forEach(item => {
      totalAvail += (item.available || 0);
      totalRented += (item.rented || 0);
    });
    const totalAll = totalAvail + totalRented;

    const totalEl = document.getElementById('dash-total-stat') || document.getElementById('dash-stat-total');
    const availEl = document.getElementById('dash-avail-stat') || document.getElementById('dash-stat-avail');
    const rentedEl = document.getElementById('dash-rented-stat') || document.getElementById('dash-stat-rented');
    if (totalEl) totalEl.textContent = totalAll;
    if (availEl) availEl.textContent = totalAvail;
    if (rentedEl) rentedEl.textContent = totalRented;

    // Upcoming return banner
    const upcomingContainer = document.getElementById('dash-upcoming-card');
    const urgentRental = state.rentals.find(r => r.status === 'active' && r.isUrgent) || 
                         state.rentals.find(r => r.status === 'active');

    if (upcomingContainer) {
      if (urgentRental) {
        upcomingContainer.style.display = 'flex';
        const clientEl = document.getElementById('dash-upcoming-title') || document.getElementById('dash-upcoming-client');
        const unitsEl = document.getElementById('dash-upcoming-units');
        const timeEl = document.getElementById('dash-upcoming-time');
        const detailsEl = document.getElementById('dash-upcoming-details');
        const badgeEl = document.getElementById('dash-upcoming-badge');

        if (clientEl) clientEl.textContent = urgentRental.client;
        if (unitsEl) unitsEl.textContent = `${urgentRental.units}x ${urgentRental.equipName}`;
        if (timeEl) timeEl.textContent = urgentRental.dueText;
        if (detailsEl) detailsEl.textContent = `${urgentRental.units}x ${urgentRental.equipName} • ${urgentRental.dueText}`;
        if (badgeEl) badgeEl.textContent = '1 Due Today';

        upcomingContainer.onclick = () => {
          openEditRental(urgentRental.id);
        };
      } else {
        upcomingContainer.style.display = 'none';
      }
    }

    // Quick Inventory status bars
    const quickContainer = document.getElementById('dash-quick-inventory-items') || 
                           document.getElementById('dash-quick-inventory-container');
    if (quickContainer) {
      quickContainer.innerHTML = '';
      const itemsList = Object.values(state.inventory);
      if (itemsList.length === 0) {
        quickContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 12px 0;">No equipment cataloged.</p>';
      } else {
        itemsList.slice(0, 4).forEach(item => {
          const pct = item.total > 0 ? Math.round((item.available / item.total) * 100) : 0;
          const row = document.createElement('div');
          row.className = 'inventory-item cursor-pointer';
          row.setAttribute('data-id', item.id);
          row.innerHTML = `
            <div class="item-header">
              <span class="item-name"><i class="ph ${item.icon || 'ph-package'}"></i> ${item.name}</span>
              <span class="item-count"><strong>${item.available}</strong> of ${item.total} available</span>
            </div>
            <div class="progress-bar-container"><div class="progress" style="width: ${pct}%"></div></div>
          `;
          row.addEventListener('click', () => {
            state.selectedEquipId = String(item.id);
            navigateTo('equipment-details-page');
          });
          quickContainer.appendChild(row);
        });
      }
    }
  }

  // Dashboard shortcut buttons
  const dashBtnViewAll = document.getElementById('dash-view-all-inv') || document.getElementById('dash-btn-view-all');
  if (dashBtnViewAll) {
    dashBtnViewAll.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('inventory-page');
    });
  }

  const dashBtnQuickSearch = document.getElementById('dash-search-btn') || document.getElementById('dash-btn-quick-search');
  if (dashBtnQuickSearch) {
    dashBtnQuickSearch.addEventListener('click', () => {
      navigateTo('inventory-page');
      const search = document.getElementById('inventory-search');
      if (search) search.focus();
    });
  }

  const dashAvatarBtn = document.getElementById('dash-avatar-btn');
  if (dashAvatarBtn) {
    dashAvatarBtn.addEventListener('click', () => {
      navigateTo('settings-page');
    });
  }

  const dashBtnNewRental = document.getElementById('dash-new-rental-fab') || document.getElementById('dash-btn-new-rental');
  if (dashBtnNewRental) {
    dashBtnNewRental.addEventListener('click', () => {
      openAddRental(Object.keys(state.inventory)[0] || '1');
    });
  }

  // --- RENDER ALL & BOOTSTRAP ---
  function renderAll() {
    renderInventory();
    renderRentalsTab();
    renderDashboard();
    renderSettings();
  }

  // Initial render with cached/default data
  renderAll();

  // Connect live to FastAPI
  syncWithBackend(false);
});
