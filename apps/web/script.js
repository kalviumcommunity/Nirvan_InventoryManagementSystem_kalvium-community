document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetPageId = item.getAttribute('data-target');
      
      if (!targetPageId) return; // For tabs that aren't implemented yet (Rentals, Settings)

      // Remove active class from all nav items
      navItems.forEach(nav => {
        nav.classList.remove('active');
        const icon = nav.querySelector('i');
        if(icon.classList.contains('ph-fill')) {
            icon.classList.remove('ph-fill');
            icon.classList.add('ph');
        }
      });
      
      // Add active class to clicked nav item
      item.classList.add('active');
      const targetIcon = item.querySelector('i');
      if(targetIcon.classList.contains('ph')) {
          targetIcon.classList.remove('ph');
          targetIcon.classList.add('ph-fill');
      }

      // Hide all pages
      pages.forEach(page => {
        page.classList.remove('active');
      });

      // Show target page
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }
    });
  });

  // Filter tabs logic
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});
