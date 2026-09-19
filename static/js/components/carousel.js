/* ==========================================================================
   STREAMFLIX MOVIE CAROUSEL & CARD COMPONENT
   ========================================================================== */

export function createMovieCard(movie, { onWatch, onToggleMyList, onOpenDetails, isInMyList = false, progressPercent = null }) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.setAttribute('data-id', movie.id);

  card.innerHTML = `
    <img class="movie-card-img" src="${movie.poster_url}" alt="${movie.title}" loading="lazy" />
    ${progressPercent !== null ? `
      <div class="card-progress-bar">
        <div class="card-progress-fill" style="width: ${progressPercent}%;"></div>
      </div>
    ` : ''}
    <div class="movie-card-overlay">
      <div class="card-actions">
        <button class="card-btn-play" title="Watch Now" data-action="watch">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="card-btn-icon ${isInMyList ? 'active' : ''}" title="${isInMyList ? 'Remove from List' : 'Add to List'}" data-action="mylist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isInMyList 
              ? '<path d="M20 6L9 17l-5-5"/>' 
              : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
          </svg>
        </button>
        <button class="card-btn-icon" title="View Details" data-action="details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      <h3 class="card-title" title="${movie.title}">${movie.title}</h3>
      <div class="card-meta-row">
        <span class="badge badge-star">★ ${movie.rating.toFixed(1)}</span>
        <span>${movie.year}</span>
        <span>${movie.duration_str}</span>
      </div>
      <div class="card-genre-tag">${movie.genres ? movie.genres.slice(0, 2).join(' • ') : movie.genre}</div>
    </div>
  `;

  // Click card to view details unless an action button was clicked
  card.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('button[data-action]');
    if (!actionBtn) {
      onOpenDetails(movie.id);
      return;
    }

    const action = actionBtn.getAttribute('data-action');
    if (action === 'watch') {
      onWatch(movie.id);
    } else if (action === 'mylist') {
      onToggleMyList(movie.id, card);
    } else if (action === 'details') {
      onOpenDetails(movie.id);
    }
  });

  return card;
}

export class MovieCarousel {
  constructor({ title, movies, onWatch, onToggleMyList, onOpenDetails, myListIds = new Set(), showProgress = false }) {
    this.title = title;
    this.movies = movies;
    this.onWatch = onWatch;
    this.onToggleMyList = onToggleMyList;
    this.onOpenDetails = onOpenDetails;
    this.myListIds = myListIds;
    this.showProgress = showProgress;
  }

  render() {
    if (!this.movies || this.movies.length === 0) return null;

    const section = document.createElement('section');
    section.className = 'content-section';

    section.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">
          ${this.title}
          <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">(${this.movies.length})</span>
        </h2>
      </div>
      <div class="carousel-container">
        <button class="carousel-btn prev" aria-label="Scroll left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="carousel-track"></div>
        <button class="carousel-btn next" aria-label="Scroll right">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    `;

    const track = section.querySelector('.carousel-track');
    this.movies.forEach(movie => {
      const isInList = this.myListIds.has(movie.id);
      const card = createMovieCard(movie, {
        onWatch: this.onWatch,
        onToggleMyList: this.onToggleMyList,
        onOpenDetails: this.onOpenDetails,
        isInMyList: isInList,
        progressPercent: this.showProgress ? (movie.progress_percent || 0) : null
      });
      track.appendChild(card);
    });

    const prevBtn = section.querySelector('.carousel-btn.prev');
    const nextBtn = section.querySelector('.carousel-btn.next');

    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -680, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 680, behavior: 'smooth' });
    });

    return section;
  }
}
