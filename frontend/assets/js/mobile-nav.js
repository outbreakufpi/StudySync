// Mobile Navigation Manager
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('mobile-sidebar');
  const toggleBtn = document.getElementById('menu-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar || !toggleBtn) return;
  
  // Toggle sidebar
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('opacity-0');
    overlay?.classList.toggle('pointer-events-none');
  });
  
  // Close sidebar when overlay is clicked
  overlay?.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('opacity-0');
    overlay.classList.add('pointer-events-none');
  });
  
  // Close sidebar when a link is clicked
  sidebar.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      overlay?.classList.add('opacity-0');
      overlay?.classList.add('pointer-events-none');
    });
  });
  
  // Close sidebar on window resize (back to desktop)
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      sidebar.classList.remove('-translate-x-full');
      overlay?.classList.add('opacity-0');
      overlay?.classList.add('pointer-events-none');
    }
  });
});
