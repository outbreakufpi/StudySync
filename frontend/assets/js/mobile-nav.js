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

  // Highlight the active sidebar link based on current path or hash
  function setActiveSidebarLink() {
    const links = sidebar.querySelectorAll('nav a');
    const currentPath = window.location.pathname.replace(/\/+$/, '');
    const currentHash = window.location.hash || '';

    links.forEach(link => {
      // classes used for the active state in the markup
      const activeClasses = ['text-teal-600', 'dark:text-teal-400', 'font-bold', 'bg-white', 'dark:bg-slate-800', 'rounded-lg', 'shadow-sm'];
      const defaultTextClasses = ['text-slate-500', 'dark:text-slate-400', 'font-medium'];

      // remove active classes first
      activeClasses.forEach(c => link.classList.remove(c));
      // ensure default text classes exist
      defaultTextClasses.forEach(c => link.classList.add(c));

      try {
        const url = new URL(link.href);
        const linkPath = url.pathname.replace(/\/+$/, '');
        const linkHash = url.hash || '';

        let isActive = false;
        if (linkPath && linkPath === currentPath) isActive = true;
        // If link points to an anchor on the same page
        if (!linkPath && linkHash && linkHash === currentHash) isActive = true;
        // If link has a hash and current page includes that hash
        if (linkHash && currentHash && linkHash === currentHash) isActive = true;

        if (isActive) {
          activeClasses.forEach(c => link.classList.add(c));
          // remove default text classes when active
          defaultTextClasses.forEach(c => link.classList.remove(c));
        }
      } catch (e) {
        // ignore malformed hrefs
      }
    });
  }

  // Run once on load and also when hash changes
  setActiveSidebarLink();
  window.addEventListener('hashchange', setActiveSidebarLink);
});
