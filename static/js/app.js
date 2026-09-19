/* ==========================================================================
   STREAMFLIX MAIN APPLICATION CONTROLLER
   ========================================================================== */

import { API } from './api.js';
import { Navbar } from './components/navbar.js';
import { HeroBanner } from './components/hero.js';
import { MovieCarousel, createMovieCard } from './components/carousel.js';
import { MovieModal } from './components/movieModal.js';
import { VideoPlayer } from './components/videoPlayer.js';
import { ProfileModal } from './components/profileModal.js';

class StreamFlixApp {
  constructor() {
    this.currentUser = null;
    this.catalogData = null;
    this.myListIds = new Set();
    this.currentView = 'home';

    this.init();
  }

  async init() {
    // 1. Fetch initial state
    try {
      this.currentUser = await API.getUser();
      this.catalogData = await API.getCatalog();
      const myList = await API.getMyList();
      this.myListIds = new Set(myList.map(m => m.id));
    } catch (err) {
      console.error('Initialization error:', err);
      this.showToast('Could not reach StreamFlix backend', 'error');
    }

    // 2. Initialize Subcomponents
    this.navbar = new Navbar({
      onNavigate: (view) => this.switchView(view),
      onOpenSearch: () => this.switchView('search'),
      onOpenProfile: () => this.profileModal.open(),
      onOpenLogin: () => this.profileModal.open()
    });
    this.navbar.updateUser(this.currentUser);

    this.hero = new HeroBanner({
      onWatch: (id) => this.startStreaming(id),
      onToggleMyList: (id) => this.toggleMyList(id),
      onOpenDetails: (id) => this.openMovieDetails(id)
    });

    this.movieModal = new MovieModal({
      onWatch: (id) => this.startStreaming(id),
      onToggleMyList: (id) => this.toggleMyList(id),
      onOpenDetails: (id) => this.openMovieDetails(id)
    });

    this.videoPlayer = new VideoPlayer({
      onBack: () => {},
      onShowToast: (msg, type) => this.showToast(msg, type),
      onOpenProfile: () => this.profileModal.open()
    });

    this.profileModal = new ProfileModal({
      onUserUpdated: (user) => {
        this.currentUser = user;
        this.navbar.updateUser(user);
      },
      onShowToast: (msg, type) => this.showToast(msg, type),
      onWatch: (id) => this.startStreaming(id)
    });

    // 3. Setup Views
    this.renderHome();
    this.initSearch();
    this.initGenreView();

    // 4. Initial Navigation
    this.switchView('home');
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'mylist') {
      this.renderMyListView();
    } else if (viewName === 'movies') {
      this.renderFilteredView('movie');
    } else if (viewName === 'tv') {
      this.renderFilteredView('series');
    } else if (viewName === 'search') {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.focus();
    }
  }

  async renderHome() {
    if (!this.catalogData) return;

    // Featured Movie in Hero
    const featured = this.catalogData.featured || this.catalogData.all[0];
    this.hero.render(featured, this.myListIds.has(featured.id));

    // Rows Container
    const rowsContainer = document.getElementById('homeRowsContainer');
    rowsContainer.innerHTML = '';

    // Continue Watching row (if history exists)
    const history = await API.getHistory();
    if (history && history.length > 0) {
      const historyCarousel = new MovieCarousel({
        title: 'Continue Watching',
        movies: history,
        onWatch: (id) => this.startStreaming(id),
        onToggleMyList: (id) => this.toggleMyList(id),
        onOpenDetails: (id) => this.openMovieDetails(id),
        myListIds: this.myListIds,
        showProgress: true
      });
      const node = historyCarousel.render();
      if (node) rowsContainer.appendChild(node);
    }

    // Category Carousels
    const categories = this.catalogData.categories || {};
    for (const [catTitle, movies] of Object.entries(categories)) {
      if (movies && movies.length > 0) {
        const carousel = new MovieCarousel({
          title: catTitle,
          movies,
          onWatch: (id) => this.startStreaming(id),
          onToggleMyList: (id) => this.toggleMyList(id),
          onOpenDetails: (id) => this.openMovieDetails(id),
          myListIds: this.myListIds
        });
        const node = carousel.render();
        if (node) rowsContainer.appendChild(node);
      }
    }
  }

  renderFilteredView(type) {
    const container = document.getElementById(type === 'movie' ? 'moviesGrid' : 'tvGrid');
    if (!container || !this.catalogData) return;
    container.innerHTML = '';

    const items = this.catalogData.all.filter(m => m.type === type);
    items.forEach(item => {
      const card = createMovieCard(item, {
        onWatch: (id) => this.startStreaming(id),
        onToggleMyList: (id) => this.toggleMyList(id),
        onOpenDetails: (id) => this.openMovieDetails(id),
        isInMyList: this.myListIds.has(item.id)
      });
      container.appendChild(card);
    });
  }

  initGenreView() {
    const genres = ['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Mystery'];
    const tabsContainer = document.getElementById('genreTabs');
    const contentContainer = document.getElementById('genreMoviesGrid');
    if (!tabsContainer || !contentContainer) return;

    tabsContainer.innerHTML = '';
    genres.forEach((genre, idx) => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${idx === 0 ? 'active' : ''}`;
      btn.textContent = genre;
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGenreMovies(genre);
      });
      tabsContainer.appendChild(btn);
    });

    this.renderGenreMovies(genres[0]);
  }

  renderGenreMovies(genre) {
    const contentContainer = document.getElementById('genreMoviesGrid');
    if (!contentContainer || !this.catalogData) return;
    contentContainer.innerHTML = '';

    const items = this.catalogData.all.filter(m => m.genres && m.genres.includes(genre));
    items.forEach(item => {
      const card = createMovieCard(item, {
        onWatch: (id) => this.startStreaming(id),
        onToggleMyList: (id) => this.toggleMyList(id),
        onOpenDetails: (id) => this.openMovieDetails(id),
        isInMyList: this.myListIds.has(item.id)
      });
      contentContainer.appendChild(card);
    });
  }

  async renderMyListView() {
    const container = document.getElementById('myListGrid');
    const emptyState = document.getElementById('myListEmpty');
    const countBadge = document.getElementById('myListCount');
    if (!container) return;

    container.innerHTML = '';
    const myList = await API.getMyList();
    this.myListIds = new Set(myList.map(m => m.id));

    if (countBadge) countBadge.textContent = `${myList.length} titles`;

    if (myList.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      container.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.style.display = 'grid';

    myList.forEach(item => {
      const card = createMovieCard(item, {
        onWatch: (id) => this.startStreaming(id),
        onToggleMyList: async (id) => {
          await this.toggleMyList(id);
          this.renderMyListView();
        },
        onOpenDetails: (id) => this.openMovieDetails(id),
        isInMyList: true
      });
      container.appendChild(card);
    });
  }

  initSearch() {
    const input = document.getElementById('searchInput');
    const sortSelect = document.getElementById('searchSort');
    const typePills = document.querySelectorAll('.search-type-pill');
    let currentType = 'all';

    typePills.forEach(pill => {
      pill.addEventListener('click', () => {
        typePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentType = pill.getAttribute('data-type');
        this.performSearch(input.value, currentType, sortSelect.value);
      });
    });

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.performSearch(input.value, currentType, sortSelect.value);
      }, 250);
    });

    sortSelect.addEventListener('change', () => {
      this.performSearch(input.value, currentType, sortSelect.value);
    });

    // Initial search query
    this.performSearch('', 'all', 'relevance');
  }

  async performSearch(query, type, sort) {
    const resultsContainer = document.getElementById('searchResultsGrid');
    const emptyState = document.getElementById('searchEmptyState');
    const resultsCount = document.getElementById('searchResultsCount');

    const res = await API.search(query, type, 'all', sort);
    resultsContainer.innerHTML = '';

    if (resultsCount) {
      resultsCount.textContent = `Found ${res.count} title${res.count === 1 ? '' : 's'}`;
    }

    if (res.results.length === 0) {
      emptyState.style.display = 'block';
      resultsContainer.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    resultsContainer.style.display = 'grid';

    res.results.forEach(movie => {
      const card = createMovieCard(movie, {
        onWatch: (id) => this.startStreaming(id),
        onToggleMyList: (id) => this.toggleMyList(id),
        onOpenDetails: (id) => this.openMovieDetails(id),
        isInMyList: this.myListIds.has(movie.id)
      });
      resultsContainer.appendChild(card);
    });
  }

  async openMovieDetails(id) {
    try {
      const movie = await API.getMovieDetail(id);
      this.movieModal.open(movie, this.myListIds.has(id));
    } catch (err) {
      this.showToast('Could not load movie details', 'error');
    }
  }

  async startStreaming(id) {
    try {
      // Calls final.py User.watch_movie(movie)
      const streamData = await API.watchMovie(id);
      const movie = await API.getMovieDetail(id);

      // Launch Video Player
      this.videoPlayer.open(movie, this.currentUser, streamData);
    } catch (err) {
      this.showToast(err.message || 'Stream authorization error', 'error');
      // If not logged in error, prompt profile modal to login
      if (err.message && err.message.toLowerCase().includes('login')) {
        this.profileModal.open();
      }
    }
  }

  async toggleMyList(id) {
    const isInList = this.myListIds.has(id);
    try {
      if (isInList) {
        await API.removeFromMyList(id);
        this.myListIds.delete(id);
        this.showToast('Removed from My List', 'success');
      } else {
        await API.addToMyList(id);
        this.myListIds.add(id);
        this.showToast('Added to My List', 'success');
      }

      // Update hero if active
      if (this.hero.currentMovie && this.hero.currentMovie.id === id) {
        this.hero.updateMyListStatus(!isInList);
      }

      // Refresh card icons in DOM
      document.querySelectorAll(`.movie-card[data-id="${id}"]`).forEach(card => {
        const btn = card.querySelector('.card-btn-icon[data-action="mylist"]');
        if (btn) {
          if (!isInList) {
            btn.classList.add('active');
            btn.title = 'Remove from List';
            btn.querySelector('svg').innerHTML = '<path d="M20 6L9 17l-5-5"/>';
          } else {
            btn.classList.remove('active');
            btn.title = 'Add to List';
            btn.querySelector('svg').innerHTML = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
          }
        }
      });
    } catch (err) {
      this.showToast('Could not update My List', 'error');
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSvg = type === 'success'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StreamFlixApp();
});
