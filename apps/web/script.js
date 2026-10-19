document.addEventListener('DOMContentLoaded', () => {
  // --- DEFAULT DATA TEMPLATE ---
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
      speakers: {
        id: 'speakers',
        name: 'JBL EON 15" Speakers',
        shortName: 'Speakers',
        category: 'audio',
        total: 20,
        available: 10,
        rented: 10,
        icon: 'ph-speaker-hifi',
        img: 'speaker.png'
      },
      microphones: {
        id: 'microphones',
        name: 'Wireless Microphones (Shure)',
        shortName: 'Microphones',
        category: 'audio',
        total: 15,
        available: 12,
        rented: 3,
        icon: 'ph-microphone',
        img: 'microphone.png'
      },
      lights: {
        id: 'lights',
        name: 'Stage Lights (RGBW DMX)',
        shortName: 'Stage Lights',
        category: 'lighting',
        total: 30,
        available: 20,
        rented: 10,
        icon: 'ph-lightbulb',
        img: 'lights.png'
      },
      fog: {
        id: 'fog',
        name: 'Fog & FX Machines',
        shortName: 'Fog & FX Machines',
        category: 'effects',
        total: 8,
        available: 5,
        rented: 3,
        icon: 'ph-cloud-fog',
        img: 'fog.png'
      }
    },
    rentals: [
      {
        id: 'RN-8042',
        client: 'Sharma Wedding',
        equipId: 'speakers',
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
        id: 'RN-8043',
        client: 'ABC Events',
        equipId: 'speakers',
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
        id: 'RN-8044',
        client: 'Royal Events',
        equipId: 'speakers',
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
        id: 'RN-8045',
        client: 'Nexus Tech Summit',
        equipId: 'lights',
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
        id: 'RN-8046',
        client: 'City Hall Gala',
        equipId: 'microphones',
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
    selectedEquipId: 'speakers',
    currentEditingRentalId: 'RN-8042',
    historyStack: ['inventory-page']
  };

  // --- LOCALSTORAGE SYNC ---
  const STORAGE_KEY = 'rentory_ims_data_v2';
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
          rentals: parsed.rentals || DEFAULT_DATA.rentals,
          historyStack: ['inventory-page']
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved state, using default data.', e);
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
      console.warn('Failed to persist state:', e);
    }
  }

  function resetToDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    state = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveState();
    renderAll();
    showToast('Demo data restored to default', 'ph-arrows-clockwise');
  }

  // --- DOM ELEMENTS ---
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');
  const bottomNav = document.getElementById('main-bottom-nav');
  const toastEl = document.getElementById('app-toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  // --- TOAST NOTIFICATION ---
  let toastTimer = null;
  function showToast(message, iconClass = 'ph-check-circle') {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toastIcon.className = `ph-fill ${iconClass} toast-icon`;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2400);
  }

  // --- NAVIGATION CONTROLLER ---
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
    if (isDetailPage) {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
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

  // --- DYNAMIC INVENTORY RENDERING (Screen 1) ---
  let activeCategoryFilter = 'all';

  function renderInventory() {
    const listContainer = document.getElementById('inventory-list-container');
    if (!listContainer) return;

    let totalAvail = 0;
    let totalRented = 0;

    Object.values(state.inventory).forEach(item => {
      totalAvail += item.available;
      totalRented += item.rented;
    });

    const totalStock = totalAvail + totalRented;
    const availPercent = totalStock > 0 ? (totalAvail / totalStock) * 100 : 0;
    const rentedPercent = totalStock > 0 ? (totalRented / totalStock) * 100 : 0;

    // Update stat cards
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
        item.shortName.toLowerCase().includes(searchQuery);
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
      const pct = item.total > 0 ? (item.available / item.total) * 100 : 0;
      const card = document.createElement('div');
      card.className = 'list-card card equip-card cursor-pointer';
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-category', item.category);

      let mediaHtml = '';
      if (item.img) {
        mediaHtml = `<img src="${item.img}" alt="${item.name}" class="item-img" onerror="this.onerror=null; this.src=''; this.className='item-img-placeholder'; this.innerHTML='<i class=\\'ph ${item.icon || 'ph-package'}\\'></i>'">`;
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
        state.selectedEquipId = item.id;
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

  // FAB: Add Equipment -> Open Add Equipment Modal
  const btnAddEquip = document.getElementById('btn-add-equipment');
  const modalAddEquip = document.getElementById('modal-add-equipment');
  const closeModalEquip = document.getElementById('close-modal-equip');
  const btnCancelAddEquip = document.getElementById('btn-cancel-add-equip');
  const btnSaveNewEquip = document.getElementById('btn-save-new-equip');

  if (btnAddEquip && modalAddEquip) {
    btnAddEquip.addEventListener('click', () => {
      document.getElementById('modal-equip-name').value = '';
      document.getElementById('modal-equip-short').value = '';
      document.getElementById('modal-equip-qty').value = '10';
      modalAddEquip.style.display = 'flex';
    });
  }

  if (closeModalEquip) closeModalEquip.addEventListener('click', () => modalAddEquip.style.display = 'none');
  if (btnCancelAddEquip) btnCancelAddEquip.addEventListener('click', () => modalAddEquip.style.display = 'none');

  if (btnSaveNewEquip) {
    btnSaveNewEquip.addEventListener('click', () => {
      const name = document.getElementById('modal-equip-name').value.trim();
      const shortName = document.getElementById('modal-equip-short').value.trim() || name;
      const category = document.getElementById('modal-equip-category').value;
      const qty = parseInt(document.getElementById('modal-equip-qty').value, 10) || 5;

      if (!name) {
        showToast('Please enter an equipment name', 'ph-warning');
        return;
      }

      const id = 'eq_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) + '_' + Date.now().toString().slice(-4);
      let icon = 'ph-package';
      if (category === 'audio') icon = 'ph-speaker-hifi';
      else if (category === 'lighting') icon = 'ph-lightbulb';
      else if (category === 'effects') icon = 'ph-cloud-fog';
      else icon = 'ph-television';

      state.inventory[id] = {
        id: id,
        name: name,
        shortName: shortName,
        category: category,
        total: qty,
        available: qty,
        rented: 0,
        icon: icon,
        img: null
      };

      saveState();
      modalAddEquip.style.display = 'none';
      renderInventory();
      showToast(`Added "${name}" to inventory!`, 'ph-check-circle');
    });
  }

  // QR Scanner button
  const btnScanQr = document.getElementById('btn-scan-qr');
  if (btnScanQr) {
    btnScanQr.addEventListener('click', () => {
      showToast('Camera active: Barcode & QR scanner ready', 'ph-qr-code');
    });
  }

  // --- DYNAMIC EQUIPMENT DETAILS PAGE (Screen 4 / 5 in mockup) ---
  function renderEquipmentDetails(equipId) {
    const equip = state.inventory[equipId] || Object.values(state.inventory)[0];
    if (!equip) return;
    state.selectedEquipId = equip.id;

    // Header Title
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

    const matchingRentals = state.rentals.filter(r => r.equipId === equip.id && r.status === 'active');

    if (matchingRentals.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 24px;">
          <i class="ph ph-check-circle" style="font-size: 28px; color: var(--primary-green); margin-bottom: 6px; display: block;"></i>
          <p style="font-size: 14px; font-weight: 500; color: var(--text-main);">All units available</p>
          <p style="font-size: 12px; margin-top: 4px;">No active rentals for ${equip.shortName}.</p>
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

  // Button: "+ Rent Out Units" in Equipment Details
  const btnRentOutUnits = document.getElementById('btn-rent-out-units');
  if (btnRentOutUnits) {
    btnRentOutUnits.addEventListener('click', () => {
      openAddRental(state.selectedEquipId);
    });
  }

  // Equipment Details "More" Button
  const btnEquipMore = document.getElementById('btn-equip-details-more');
  if (btnEquipMore) {
    btnEquipMore.addEventListener('click', () => {
      const equip = state.inventory[state.selectedEquipId];
      if (!equip) return;
      const newTotal = prompt(`Edit total stock for ${equip.name}:`, equip.total);
      if (newTotal !== null) {
        const val = parseInt(newTotal, 10);
        if (!isNaN(val) && val >= equip.rented) {
          equip.total = val;
          equip.available = val - equip.rented;
          saveState();
          renderEquipmentDetails(equip.id);
          renderInventory();
          showToast(`Stock updated to ${val} units`, 'ph-check-circle');
        } else {
          showToast(`Total must be at least ${equip.rented} (currently rented)`, 'ph-warning');
        }
      }
    });
  }

  // --- DYNAMIC ADD RENTAL FLOW (Screen 3 / 6 in mockup) ---
  let addRentalSelectedEquip = 'speakers';
  let addRentalQuantity = 4;

  function openAddRental(equipId = 'speakers') {
    if (!state.inventory[equipId]) {
      equipId = Object.keys(state.inventory)[0] || 'speakers';
    }
    addRentalSelectedEquip = equipId;
    const equip = state.inventory[equipId];

    // Populate Dynamic Dropdown Menu
    const dropdown = document.getElementById('equip-dropdown-menu');
    if (dropdown) {
      dropdown.innerHTML = '';
      Object.values(state.inventory).forEach(item => {
        const dropItem = document.createElement('div');
        dropItem.className = `dropdown-item ${item.id === equipId ? 'active' : ''}`;
        dropItem.setAttribute('data-equip-id', item.id);
        dropItem.innerHTML = `
          <span><i class="ph ${item.icon || 'ph-package'}"></i> ${item.name}</span>
          <span class="avail-badge">${item.available} avail</span>
        `;
        dropItem.addEventListener('click', (e) => {
          e.stopPropagation();
          selectEquipmentForAddRental(item.id);
        });
        dropdown.appendChild(dropItem);
      });
      dropdown.style.display = 'none';
    }

    // Set initial display
    updateAddRentalEquipDisplay(equip);

    // Default stepper value
    addRentalQuantity = Math.min(4, Math.max(1, equip.available));
    const qtyValEl = document.getElementById('add-qty-val');
    if (qtyValEl) qtyValEl.textContent = addRentalQuantity;

    navigateTo('add-rental-page');
  }

  function updateAddRentalEquipDisplay(equip) {
    const titleEl = document.getElementById('new-rental-equip-title');
    const availEl = document.getElementById('new-rental-avail-text');
    const iconEl = document.getElementById('new-rental-icon');

    if (titleEl) titleEl.textContent = equip.name;
    if (availEl) availEl.textContent = `${equip.available} available`;
    if (iconEl) iconEl.className = `ph ${equip.icon || 'ph-package'}`;
  }

  function selectEquipmentForAddRental(equipId) {
    const equip = state.inventory[equipId];
    if (!equip) return;

    addRentalSelectedEquip = equipId;
    updateAddRentalEquipDisplay(equip);

    // Highlight in dropdown
    document.querySelectorAll('#equip-dropdown-menu .dropdown-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-equip-id') === equipId);
    });

    // Close dropdown
    const dropdown = document.getElementById('equip-dropdown-menu');
    if (dropdown) dropdown.style.display = 'none';

    // Update quantity constraints
    if (addRentalQuantity > equip.available) {
      addRentalQuantity = Math.max(1, equip.available);
      document.getElementById('add-qty-val').textContent = addRentalQuantity;
    }
  }

  // Dropdown toggle
  const equipSelectBox = document.getElementById('equip-select-box');
  const equipDropdownMenu = document.getElementById('equip-dropdown-menu');
  if (equipSelectBox && equipDropdownMenu) {
    equipSelectBox.addEventListener('click', (e) => {
      e.stopPropagation();
      equipDropdownMenu.style.display = equipDropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
  }

  document.addEventListener('click', (e) => {
    if (equipDropdownMenu && !equipDropdownMenu.contains(e.target) && !equipSelectBox.contains(e.target)) {
      equipDropdownMenu.style.display = 'none';
    }
  });

  // Stepper: Add Rental
  const addQtyMinus = document.getElementById('add-qty-minus');
  const addQtyPlus = document.getElementById('add-qty-plus');
  const addQtyVal = document.getElementById('add-qty-val');

  if (addQtyMinus) {
    addQtyMinus.addEventListener('click', () => {
      if (addRentalQuantity > 1) {
        addRentalQuantity--;
        addQtyVal.textContent = addRentalQuantity;
      }
    });
  }

  if (addQtyPlus) {
    addQtyPlus.addEventListener('click', () => {
      const equip = state.inventory[addRentalSelectedEquip];
      if (addRentalQuantity < equip.available) {
        addRentalQuantity++;
        addQtyVal.textContent = addRentalQuantity;
      } else {
        showToast(`Only ${equip.available} units available in stock`, 'ph-warning');
      }
    });
  }

  // Cancel Add Rental
  const btnCancelAddRental = document.getElementById('btn-cancel-rental-add');
  if (btnCancelAddRental) {
    btnCancelAddRental.addEventListener('click', () => goBack());
  }

  // Confirm Rental Button
  const btnConfirmRental = document.getElementById('btn-confirm-rental');
  if (btnConfirmRental) {
    btnConfirmRental.addEventListener('click', () => {
      const clientName = document.getElementById('add-client-input').value.trim() || 'Event Client';
      const phone = document.getElementById('add-phone-input').value.trim() || '+91 98000 00000';
      const returnTime = document.getElementById('add-return-input').value.trim() || 'Tomorrow, 06:00 PM';
      const equip = state.inventory[addRentalSelectedEquip];

      if (!equip || addRentalQuantity <= 0 || equip.available < addRentalQuantity) {
        showToast('Insufficient stock available for this quantity', 'ph-warning');
        return;
      }

      // Deduct stock dynamically
      equip.available -= addRentalQuantity;
      equip.rented += addRentalQuantity;

      const newId = `RN-${Math.floor(8000 + Math.random() * 1000)}`;
      const newRental = {
        id: newId,
        client: clientName,
        equipId: equip.id,
        equipName: equip.name,
        units: addRentalQuantity,
        phone: phone,
        contact: `${clientName} (${phone})`,
        startDate: 'Today, 11:00 AM',
        returnDate: returnTime,
        dueText: 'Due 21 Sep',
        isUrgent: false,
        status: 'active'
      };

      state.rentals.unshift(newRental);
      saveState();
      showToast(`Rental #${newId} created successfully!`, 'ph-check-circle');

      state.selectedEquipId = equip.id;
      renderEquipmentDetails(equip.id);
      renderInventory();
      navigateTo('equipment-details-page');
    });
  }

  // --- DYNAMIC EDIT RENTAL FLOW (Screen 5 / 7 in mockup) ---
  let editRentalUnits = 4;

  function openEditRental(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId) || state.rentals[0];
    if (!rental) return;

    state.currentEditingRentalId = rental.id;
    editRentalUnits = rental.units;

    // Header ID & status
    const headerTitle = document.getElementById('edit-page-rental-id');
    const badgeStatus = document.getElementById('edit-badge-status');
    if (headerTitle) headerTitle.textContent = `Rental #${rental.id}`;
    if (badgeStatus) {
      if (rental.status === 'active') {
        badgeStatus.className = 'status-badge-active';
        badgeStatus.innerHTML = '<span class="badge-dot"></span> Active';
      } else {
        badgeStatus.className = 'status-badge-returned';
        badgeStatus.innerHTML = '<span class="badge-dot"></span> Returned';
      }
    }

    // Summary Card
    const clientTitle = document.getElementById('edit-view-client-title');
    const equipSummary = document.getElementById('edit-view-equip-summary');
    const startDate = document.getElementById('edit-view-start-date');
    const returnDate = document.getElementById('edit-view-return-date');

    if (clientTitle) clientTitle.textContent = rental.client;
    if (equipSummary) equipSummary.textContent = `${rental.units}x ${rental.equipName}`;
    if (startDate) startDate.textContent = rental.startDate;
    if (returnDate) returnDate.textContent = rental.returnDate;

    // Form inputs
    const stepperVal = document.getElementById('edit-qty-val');
    const inputClient = document.getElementById('edit-input-client');
    const inputContact = document.getElementById('edit-input-contact');
    const inputReturn = document.getElementById('edit-input-return');

    if (stepperVal) stepperVal.textContent = editRentalUnits;
    if (inputClient) inputClient.value = rental.client;
    if (inputContact) inputContact.value = rental.contact;
    if (inputReturn) inputReturn.value = rental.returnDate;

    // Mark button text
    const markBtn = document.getElementById('btn-mark-units-returned');
    if (markBtn) {
      if (rental.status === 'returned') {
        markBtn.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Reopen Rental';
      } else {
        markBtn.innerHTML = '<i class="ph ph-check-circle"></i> Mark Units as Returned';
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
      const rental = state.rentals.find(r => r.id === state.currentEditingRentalId);
      const equip = rental ? state.inventory[rental.equipId] : state.inventory.speakers;
      const delta = editRentalUnits + 1 - (rental ? rental.units : 0);
      if (delta <= equip.available) {
        editRentalUnits++;
        editQtyVal.textContent = editRentalUnits;
      } else {
        showToast(`Only ${equip.available} additional units in stock`, 'ph-warning');
      }
    });
  }

  // Mark Units as Returned
  const btnMarkReturned = document.getElementById('btn-mark-units-returned');
  if (btnMarkReturned) {
    btnMarkReturned.addEventListener('click', () => {
      const rental = state.rentals.find(r => r.id === state.currentEditingRentalId);
      if (!rental) return;

      const equip = state.inventory[rental.equipId];

      if (rental.status === 'active') {
        rental.status = 'returned';
        equip.available += rental.units;
        equip.rented = Math.max(0, equip.rented - rental.units);
        rental.dueText = 'Returned';
        showToast(`${rental.units} units returned to inventory`, 'ph-check-circle');
      } else {
        if (equip.available >= rental.units) {
          rental.status = 'active';
          equip.available -= rental.units;
          equip.rented += rental.units;
          rental.dueText = 'Due 21 Sep';
          showToast('Rental reactivated', 'ph-arrow-counter-clockwise');
        } else {
          showToast('Not enough units in stock to reopen', 'ph-warning');
          return;
        }
      }

      saveState();
      renderInventory();
      renderEquipmentDetails(equip.id);
      goBack();
    });
  }

  // Save Rental Changes
  const btnSaveChanges = document.getElementById('btn-save-rental-changes');
  if (btnSaveChanges) {
    btnSaveChanges.addEventListener('click', () => {
      const rental = state.rentals.find(r => r.id === state.currentEditingRentalId);
      if (!rental) return;

      const equip = state.inventory[rental.equipId];
      const newClient = document.getElementById('edit-input-client').value.trim();
      const newContact = document.getElementById('edit-input-contact').value.trim();
      const newReturn = document.getElementById('edit-input-return').value.trim();

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

      saveState();
      showToast('Rental changes saved!', 'ph-check-circle');
      renderInventory();
      renderEquipmentDetails(equip.id);
      goBack();
    });
  }

  // Cancel Rental
  const btnCancelRental = document.getElementById('btn-cancel-rental');
  if (btnCancelRental) {
    btnCancelRental.addEventListener('click', () => {
      const rental = state.rentals.find(r => r.id === state.currentEditingRentalId);
      if (!rental) return;

      if (confirm(`Cancel rental #${rental.id} for "${rental.client}"?`)) {
        if (rental.status === 'active') {
          const equip = state.inventory[rental.equipId];
          if (equip) {
            equip.available += rental.units;
            equip.rented = Math.max(0, equip.rented - rental.units);
          }
        }
        state.rentals = state.rentals.filter(r => r.id !== rental.id);
        saveState();
        showToast(`Rental #${rental.id} cancelled`, 'ph-x-circle');
        renderInventory();
        renderEquipmentDetails(state.selectedEquipId);
        goBack();
      }
    });
  }

  // --- DYNAMIC RENTALS TAB PAGE ---
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
        r.equipName.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
          <i class="ph ph-receipt" style="font-size: 32px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          <p>No rentals found.</p>
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
          <h4>${rental.client} <span style="font-size: 11px; font-weight: normal; color: var(--text-light); margin-left: 4px;">#${rental.id}</span></h4>
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
      openAddRental('speakers');
    });
  }

  // --- DYNAMIC SETTINGS PAGE (Screen 2 / 8 in mockup) ---
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

  // REAL CSV EXPORT DYNAMIC DOWNLOAD
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
        csvContent += `"${r.id}","${r.client}","${r.equipName}",${r.units},"${r.phone}","${r.contact}","${r.startDate}","${r.returnDate}","${r.status}"\r\n`;
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

  // REAL PRINT / PDF REPORT GENERATOR
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
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">#${r.id}</td>
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
          <p style="color: #666; font-size: 13px;">Generated on: ${new Date().toLocaleString()} | Manager: ${state.settings.userName}</p>
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
        resetToDemoData();
      }
    });
  }

  // Logout button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showToast(`User ${state.settings.userName} logged out`, 'ph-sign-out');
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

  // Modal: Edit Hub / Location
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
      showToast('Logistics hub settings saved!', 'ph-check-circle');
    });
  }

  // --- DYNAMIC DASHBOARD PAGE ---
  function renderDashboard() {
    // Current date & greeting
    const greetingText = document.getElementById('dash-greeting-text');
    if (greetingText) {
      greetingText.textContent = `Good morning, ${state.settings.userName.split(' ')[0]}`;
    }

    // Totals
    let totalAvail = 0;
    let totalRented = 0;
    Object.values(state.inventory).forEach(item => {
      totalAvail += item.available;
      totalRented += item.rented;
    });

    const dashTotal = document.getElementById('dash-total-stat');
    const dashAvail = document.getElementById('dash-avail-stat');
    const dashRented = document.getElementById('dash-rented-stat');

    if (dashTotal) dashTotal.textContent = totalAvail + totalRented;
    if (dashAvail) dashAvail.textContent = totalAvail;
    if (dashRented) dashRented.textContent = totalRented;

    // Dynamic Upcoming Return card
    const upcomingTitle = document.getElementById('dash-upcoming-title');
    const upcomingUnits = document.getElementById('dash-upcoming-units');
    const upcomingBadge = document.getElementById('dash-upcoming-badge');
    const upcomingCard = document.getElementById('dash-upcoming-card');

    const nextDue = state.rentals.find(r => r.status === 'active' && r.isUrgent) || 
                    state.rentals.find(r => r.status === 'active') || 
                    state.rentals[0];

    if (nextDue && upcomingTitle) {
      upcomingTitle.textContent = nextDue.client;
      if (upcomingUnits) upcomingUnits.textContent = `${nextDue.units} ${nextDue.equipName.split(' ')[0]}`;
      if (upcomingBadge) upcomingBadge.textContent = nextDue.isUrgent ? '1 Due Today' : 'Upcoming';
      if (upcomingCard) {
        upcomingCard.onclick = () => openEditRental(nextDue.id);
      }
    }

    // Dynamic Quick Inventory Status list
    const quickContainer = document.getElementById('dash-quick-inventory-items');
    if (quickContainer) {
      quickContainer.innerHTML = '';
      Object.values(state.inventory).forEach(item => {
        const pct = item.total > 0 ? (item.available / item.total) * 100 : 0;
        const row = document.createElement('div');
        row.className = 'inventory-item cursor-pointer';
        row.setAttribute('data-id', item.id);
        row.innerHTML = `
          <div class="item-header">
            <span class="item-name"><i class="ph ${item.icon || 'ph-package'}"></i> ${item.shortName}</span>
            <span class="item-count"><strong>${item.available}</strong> of ${item.total} available</span>
          </div>
          <div class="progress-bar-container"><div class="progress" style="width: ${pct}%"></div></div>
        `;
        row.addEventListener('click', () => {
          state.selectedEquipId = item.id;
          navigateTo('equipment-details-page');
        });
        quickContainer.appendChild(row);
      });
    }
  }

  const dashViewAll = document.getElementById('dash-view-all-inv');
  if (dashViewAll) {
    dashViewAll.addEventListener('click', (e) => {
      e.preventDefault();
      state.historyStack = ['inventory-page'];
      navigateTo('inventory-page');
    });
  }

  const dashNewRentalFab = document.getElementById('dash-new-rental-fab');
  if (dashNewRentalFab) {
    dashNewRentalFab.addEventListener('click', () => {
      openAddRental('speakers');
    });
  }

  const dashAvatarBtn = document.getElementById('dash-avatar-btn');
  if (dashAvatarBtn) {
    dashAvatarBtn.addEventListener('click', () => {
      state.historyStack = ['settings-page'];
      navigateTo('settings-page');
    });
  }

  // --- INITIALIZE FULL APP ---
  function renderAll() {
    renderInventory();
    renderEquipmentDetails(state.selectedEquipId);
    renderRentalsTab();
    renderDashboard();
    renderSettings();
  }

  renderAll();
});
