/* ==========================================================================
   STREAMFLIX HERO BANNER COMPONENT
   ========================================================================== */

export class HeroBanner {
  constructor({ onWatch, onToggleMyList, onOpenDetails }) {
    this.container = document.getElementById('heroSection');
    this.onWatch = onWatch;
    this.onToggleMyList = onToggleMyList;
    this.onOpenDetails = onOpenDetails;
    this.currentMovie = null;
  }

  render(movie, isInMyList = false) {
    if (!movie) return;
    this.currentMovie = movie;

    this.container.innerHTML = `
      <div class="hero-backdrop-container">
        <img class="hero-backdrop" src="${movie.backdrop_url}" alt="${movie.title} Backdrop" id="heroBackdropImg" loading="eager" />
        <div class="hero-gradient-overlay"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-meta-badges">
          <span class="badge badge-match">${movie.match_score}% Match</span>
          <span class="badge badge-uhd">4K Ultra HD</span>
          <span class="badge badge-star">★ ${movie.rating.toFixed(1)}</span>
          <span class="badge">${movie.year}</span>
          <span class="badge">${movie.duration_str}</span>
          <span class="badge">${movie.age_rating}</span>
        </div>
        <h1 class="hero-title">${movie.title}</h1>
        <p class="hero-description">${movie.description}</p>
        <div class="hero-actions">
          <button class="btn-primary" id="heroWatchBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Watch Now
          </button>
          <button class="btn-secondary" id="heroMyListBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${isInMyList 
                ? '<path d="M20 6L9 17l-5-5"/>' 
                : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
            </svg>
            <span id="heroMyListText">${isInMyList ? 'In My List' : 'Add to List'}</span>
          </button>
          <button class="btn-secondary" id="heroInfoBtn" title="More Details">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Details
          </button>
        </div>
      </div>
    `;

    // Event handlers
    document.getElementById('heroWatchBtn').addEventListener('click', () => {
      this.onWatch(movie.id);
    });

    document.getElementById('heroMyListBtn').addEventListener('click', () => {
      this.onToggleMyList(movie.id);
    });

    document.getElementById('heroInfoBtn').addEventListener('click', () => {
      this.onOpenDetails(movie.id);
    });
  }

  updateMyListStatus(isInMyList) {
    const btn = document.getElementById('heroMyListBtn');
    const text = document.getElementById('heroMyListText');
    if (btn && text) {
      text.textContent = isInMyList ? 'In My List' : 'Add to List';
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.innerHTML = isInMyList
          ? '<path d="M20 6L9 17l-5-5"/>'
          : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
      }
    }
  }
}
