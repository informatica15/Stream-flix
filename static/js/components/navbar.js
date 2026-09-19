/* ==========================================================================
   STREAMFLIX NAVBAR COMPONENT
   ========================================================================== */

export class Navbar {
  constructor({ onNavigate, onOpenSearch, onOpenProfile, onOpenLogin }) {
    this.navElement = document.getElementById('mainNavbar');
    this.onNavigate = onNavigate;
    this.onOpenSearch = onOpenSearch;
    this.onOpenProfile = onOpenProfile;
    this.onOpenLogin = onOpenLogin;
    
    this.initScrollListener();
    this.initEvents();
  }

  initScrollListener() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        this.navElement.classList.add('scrolled');
      } else {
        this.navElement.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  initEvents() {
    // Nav links
    const links = document.querySelectorAll('.nav-link, .mobile-nav-item');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        if (targetView) {
          this.setActiveView(targetView);
          this.onNavigate(targetView);
        }
      });
    });

    // Search Trigger
    const searchBtn = document.getElementById('navSearchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.setActiveView('search');
        this.onOpenSearch();
      });
    }

    // Profile Trigger
    const profileBtn = document.getElementById('userProfileTrigger');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.onOpenProfile();
      });
    }
  }

  setActiveView(viewName) {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  updateUser(user) {
    const avatar = document.getElementById('navAvatar');
    const tierPill = document.getElementById('navTierPill');
    if (user && user.is_logged_in) {
      if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
      if (tierPill) {
        tierPill.textContent = user.subscription.name.replace('Plan', '');
        if (user.subscription.id === 'premium') {
          tierPill.classList.add('tier-premium');
        } else {
          tierPill.classList.remove('tier-premium');
        }
      }
    } else {
      if (avatar) avatar.textContent = '?';
      if (tierPill) {
        tierPill.textContent = 'Guest';
        tierPill.classList.remove('tier-premium');
      }
    }
  }
}
