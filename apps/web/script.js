const API_BASE = 'http://localhost:8000/api';

// Application state
let currentInventory = [];
let currentCategory = 'All';
let currentSearch = '';
let currentRentalFilter = 'ACTIVE';
let primaryReturnRentalId = null;

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupModals();
  setupSearchAndFilters();
  setupRentalActions();
  setupEquipmentActions();

  // Initial load
  loadDashboard();
  loadInventory();
  loadRentals();
});

// Toast notification helper
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ----------------------------------------------------
// Navigation Tab Logic
// ----------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = item.getAttribute('data-target');
      if (!targetPageId) return;

      // Update Nav active classes
      navItems.forEach(nav => {
        nav.classList.remove('active');
        const icon = nav.querySelector('i');
        if (icon && icon.classList.contains('ph-fill')) {
          icon.classList.remove('ph-fill');
          icon.classList.add('ph');
        }
      });

      item.classList.add('active');
      const targetIcon = item.querySelector('i');
      if (targetIcon && targetIcon.classList.contains('ph')) {
        targetIcon.classList.remove('ph');
        targetIcon.classList.add('ph-fill');
      }

      // Show Page
      pages.forEach(page => page.classList.remove('active'));
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }

      // Trigger targeted refresh
      if (targetPageId === 'dashboard-page') loadDashboard();
      if (targetPageId === 'inventory-page') loadInventory();
      if (targetPageId === 'rentals-page') loadRentals();
    });
  });

  // Shortcut links
  const viewAllBtn = document.getElementById('btn-view-all-inventory');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchToPage('inventory-page');
    });
  }

  const quickSearchBtn = document.getElementById('btn-quick-search');
  if (quickSearchBtn) {
    quickSearchBtn.addEventListener('click', () => {
      switchToPage('inventory-page');
      const searchInput = document.getElementById('inv-search-input');
      if (searchInput) searchInput.focus();
    });
  }

  const refreshInvBtn = document.getElementById('btn-refresh-inventory');
  if (refreshInvBtn) refreshInvBtn.addEventListener('click', () => loadInventory());

  const refreshRentalsBtn = document.getElementById('btn-refresh-rentals');
  if (refreshRentalsBtn) refreshRentalsBtn.addEventListener('click', () => loadRentals());

  const reconnectApiBtn = document.getElementById('btn-reconnect-api');
  if (reconnectApiBtn) reconnectApiBtn.addEventListener('click', () => {
    loadDashboard();
    showToast('Checking connection to API...');
  });
}

function switchToPage(pageId) {
  const navItem = document.querySelector(`.nav-item[data-target="${pageId}"]`);
  if (navItem) {
    navItem.click();
  }
}

// ----------------------------------------------------
// API: Load Dashboard
// ----------------------------------------------------
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to load dashboard data');
    const data = await res.json();

    // Bind User & Date
    if (data.date) document.getElementById('dash-date').textContent = data.date;
    if (data.user) {
      document.getElementById('dash-greeting').textContent = `Good morning, ${data.user.firstName}`;
      document.getElementById('header-avatar').textContent = data.user.firstName.charAt(0);
      document.getElementById('settings-operator-name').textContent = data.user.firstName;
      document.getElementById('settings-terminal-id').textContent = data.user.terminalId;
      document.getElementById('settings-email').textContent = data.user.email;
    }

    // Bind Stats
    if (data.stats) {
      document.getElementById('dash-stat-total').textContent = data.stats.total;
      document.getElementById('dash-stat-available').textContent = data.stats.available;
      document.getElementById('dash-stat-rented').textContent = data.stats.rented;
    }

    // Bind Upcoming Return Card
    const upcomingCard = document.getElementById('dash-upcoming-card');
    const upcomingActionBtn = document.getElementById('dash-btn-upcoming-action');
    if (data.upcomingReturn) {
      document.getElementById('dash-upcoming-badge').textContent = data.upcomingReturn.status;
      document.getElementById('dash-upcoming-title').textContent = data.upcomingReturn.title;
      document.getElementById('dash-upcoming-details').innerHTML = `${data.upcomingReturn.details} &bull; <span class="due-time">${data.upcomingReturn.dueTime}</span>`;
      primaryReturnRentalId = data.upcomingReturn.id !== '0' ? data.upcomingReturn.id : null;
      if (primaryReturnRentalId) {
        upcomingActionBtn.style.display = 'block';
      } else {
        upcomingActionBtn.style.display = 'none';
      }
    }

    // Bind Quick Inventory Status
    const quickInvContainer = document.getElementById('dash-quick-inventory-container');
    if (data.inventory && data.inventory.length > 0) {
      quickInvContainer.innerHTML = data.inventory.map(item => `
        <div class="inventory-item">
          <div class="item-header">
            <span class="item-name"><i class="ph ${item.icon || 'ph-speaker-hifi'}"></i> ${item.name}</span>
            <span class="item-count"><strong>${item.available}</strong> of ${item.total} available</span>
          </div>
          <div class="progress-bar-container"><div class="progress" style="width: ${item.percentage}%"></div></div>
        </div>
      `).join('');
    } else {
      quickInvContainer.innerHTML = '<div class="empty-state">No equipment recorded</div>';
    }

    updateConnectionStatus(true);
  } catch (err) {
    console.warn('Backend API offline or unreachable, using cached/fallback values:', err);
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(isConnected) {
  const dot = document.getElementById('settings-status-dot');
  const text = document.getElementById('settings-status-text');
  if (!dot || !text) return;
  if (isConnected) {
    dot.style.backgroundColor = '#22c55e';
    text.textContent = 'Connected to FastAPI (Live)';
    text.style.color = '#16a34a';
  } else {
    dot.style.backgroundColor = '#ef4444';
    text.textContent = 'Disconnected (Start backend server)';
    text.style.color = '#dc2626';
  }
}

// ----------------------------------------------------
// API: Load Inventory Equipment
// ----------------------------------------------------
async function loadInventory() {
  const itemsContainer = document.getElementById('inv-items-list');
  try {
    let url = `${API_BASE}/inventory?`;
    if (currentCategory && currentCategory !== 'All') {
      url += `category=${encodeURIComponent(currentCategory)}&`;
    }
    if (currentSearch) {
      url += `search=${encodeURIComponent(currentSearch)}&`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load inventory');
    const items = await res.json();
    currentInventory = items;

    // Calculate totals for Inventory Stats
    const totalAvail = items.reduce((acc, it) => acc + it.available, 0);
    const totalRented = items.reduce((acc, it) => acc + it.rented, 0);
    const totalStock = items.reduce((acc, it) => acc + it.total, 0);

    document.getElementById('inv-stat-available').textContent = totalAvail;
    document.getElementById('inv-stat-rented').textContent = totalRented;

    const availPercent = totalStock > 0 ? (totalAvail / totalStock) * 100 : 0;
    const rentedPercent = totalStock > 0 ? (totalRented / totalStock) * 100 : 0;
    document.getElementById('inv-prog-available').style.width = `${availPercent}%`;
    document.getElementById('inv-prog-rented').style.width = `${rentedPercent}%`;

    // Render list cards
    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <i class="ph ph-package"></i>
          <p>No equipment matching "${currentSearch || currentCategory}"</p>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = items.map(item => {
      const percentage = item.total > 0 ? Math.round((item.available / item.total) * 100) : 0;
      return `
        <div class="list-card card">
          <img src="${item.image_url || 'speaker.png'}" alt="${item.name}" class="item-img" onerror="this.src='speaker.png'">
          <div class="item-details">
            <div class="item-title-row">
              <h4>${item.name}</h4>
              <span class="item-stock"><strong>${item.available}</strong> / ${item.total} Avail</span>
            </div>
            <div class="progress-bar-container"><div class="progress" style="width: ${percentage}%"></div></div>
          </div>
        </div>
      `;
    }).join('');

    populateRentalSelect(items);
  } catch (err) {
    console.warn('Error loading inventory:', err);
  }
}

function populateRentalSelect(items) {
  const select = document.getElementById('rental-item-select');
  if (!select) return;
  if (!items || items.length === 0) {
    select.innerHTML = '<option value="">No equipment available</option>';
    return;
  }
  select.innerHTML = items
    .filter(it => it.available > 0)
    .map(it => `<option value="${it.id}">${it.name} (${it.available} in stock)</option>`)
    .join('');
}

// ----------------------------------------------------
// API: Load Rentals
// ----------------------------------------------------
async function loadRentals() {
  const container = document.getElementById('rentals-items-list');
  try {
    let url = `${API_BASE}/rentals`;
    if (currentRentalFilter && currentRentalFilter !== 'ALL') {
      url += `?status=${currentRentalFilter}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load rentals');
    const rentals = await res.json();

    if (rentals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ph ph-calendar-blank"></i>
          <p>No ${currentRentalFilter.toLowerCase()} rentals found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = rentals.map(r => `
      <div class="rental-card card">
        <div class="rental-info">
          <h4>${r.client_name}</h4>
          <p>${r.quantity}x ${r.item_name} &bull; ${r.due_time}</p>
          ${r.status === 'ACTIVE' 
            ? `<button class="btn-return-action" onclick="handleReturnRental(${r.id})"><i class="ph ph-arrow-u-down-left"></i> Mark Returned</button>` 
            : ''
          }
        </div>
        <div>
          <span class="rental-badge ${r.status === 'ACTIVE' ? 'active-status' : 'returned-status'}">${r.status}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Error loading rentals:', err);
  }
}

// ----------------------------------------------------
// Rental & Equipment Actions
// ----------------------------------------------------
window.handleReturnRental = async function(rentalId) {
  try {
    const res = await fetch(`${API_BASE}/rentals/${rentalId}/return`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Return failed');
    showToast('Equipment checked in & stock restored!');
    loadDashboard();
    loadInventory();
    loadRentals();
  } catch (err) {
    alert('Failed to return item: ' + err.message);
  }
};

function setupRentalActions() {
  // Action button on dashboard upcoming return card
  const upcomingActionBtn = document.getElementById('dash-btn-upcoming-action');
  if (upcomingActionBtn) {
    upcomingActionBtn.addEventListener('click', () => {
      if (primaryReturnRentalId) {
        handleReturnRental(primaryReturnRentalId);
      }
    });
  }

  // Submit New Rental Form
  const form = document.getElementById('form-new-rental');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clientName = document.getElementById('rental-client-name').value.trim();
      const itemId = parseInt(document.getElementById('rental-item-select').value, 10);
      const quantity = parseInt(document.getElementById('rental-quantity').value, 10);
      const dueTime = document.getElementById('rental-due-time').value.trim();

      if (!clientName || !itemId || !quantity) {
        alert('Please fill out all fields.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/rentals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: clientName,
            item_id: itemId,
            quantity: quantity,
            due_time: dueTime
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Dispatch failed');
        }

        closeAllModals();
        form.reset();
        showToast(`Dispatched ${quantity} items to ${clientName}!`);
        loadDashboard();
        loadInventory();
        loadRentals();
      } catch (err) {
        alert('Error creating rental: ' + err.message);
      }
    });
  }
}

function setupEquipmentActions() {
  const form = document.getElementById('form-add-equipment');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('equip-name').value.trim();
      const category = document.getElementById('equip-category').value;
      const total = parseInt(document.getElementById('equip-total').value, 10);

      if (!name || !total) {
        alert('Please enter valid equipment details');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            total
          })
        });

        if (!res.ok) throw new Error('Failed to create item');

        closeAllModals();
        form.reset();
        showToast(`Added ${name} (${total} units) to Inventory!`);
        loadInventory();
        loadDashboard();
      } catch (err) {
        alert('Error adding equipment: ' + err.message);
      }
    });
  }
}

// ----------------------------------------------------
// Search & Filter Tabs
// ----------------------------------------------------
function setupSearchAndFilters() {
  const searchInput = document.getElementById('inv-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadInventory();
      }, 250);
    });
  }

  const filterTabs = document.querySelectorAll('#inventory-page .filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-category') || 'All';
      loadInventory();
    });
  });

  const rentalTabs = document.querySelectorAll('#rentals-page .filter-tab');
  rentalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      rentalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentRentalFilter = tab.getAttribute('data-rental-filter') || 'ACTIVE';
      loadRentals();
    });
  });
}

// ----------------------------------------------------
// Modal Controls
// ----------------------------------------------------
function setupModals() {
  const newRentalBtns = [
    document.getElementById('dash-fab-new-rental'),
    document.getElementById('rentals-fab-new')
  ];

  newRentalBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        openModal('modal-new-rental');
      });
    }
  });

  const addEquipBtn = document.getElementById('inv-fab-add-equipment');
  if (addEquipBtn) {
    addEquipBtn.addEventListener('click', () => {
      openModal('modal-add-equipment');
    });
  }

  // Close buttons on modals
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}
