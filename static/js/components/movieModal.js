/* ==========================================================================
   STREAMFLIX CINEMATIC MOVIE DETAILS MODAL
   ========================================================================== */

import { createMovieCard } from './carousel.js';

export class MovieModal {
  constructor({ onWatch, onToggleMyList, onOpenDetails }) {
    this.modalOverlay = document.getElementById('movieDetailModal');
    this.onWatch = onWatch;
    this.onToggleMyList = onToggleMyList;
    this.onOpenDetails = onOpenDetails;
    this.currentMovie = null;

    this.initEvents();
  }

  initEvents() {
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
        this.close();
      }
    });
  }

  open(movie, isInMyList = false) {
    this.currentMovie = movie;
    const dialog = this.modalOverlay.querySelector('.modal-dialog');

    dialog.innerHTML = `
      <button class="modal-close-btn" id="modalCloseBtn" aria-label="Close modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="modal-hero">
        <img class="modal-backdrop-img" src="${movie.backdrop_url}" alt="${movie.title}" />
        <div class="modal-hero-gradient"></div>
        <div class="modal-hero-content">
          <div>
            <div class="hero-meta-badges">
              <span class="badge badge-match">${movie.match_score || 98}% Match</span>
              <span class="badge badge-star">★ ${movie.rating.toFixed(1)}</span>
              <span class="badge">${movie.year}</span>
              <span class="badge">${movie.duration_str}</span>
              <span class="badge badge-uhd">Ultra HD 4K</span>
            </div>
            <h1 class="modal-movie-title">${movie.title}</h1>
          </div>
          <div class="hero-actions">
            <button class="btn-primary" id="modalWatchBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Watch
            </button>
            <button class="btn-secondary" id="modalMyListBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                ${isInMyList ? '<path d="M20 6L9 17l-5-5"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
              </svg>
              <span>${isInMyList ? 'In My List' : 'Add to List'}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="modal-grid">
          <div>
            <p class="modal-synopsis">${movie.description}</p>

            ${movie.episodes ? `
              <div style="margin-top: 2rem;">
                <h3 style="font-size: 1.2rem; margin-bottom: 1rem; color: #fff;">Episodes</h3>
                <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                  ${movie.episodes.map(ep => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast);" class="episode-row" data-action="watch">
                      <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-weight: 700; color: var(--accent-violet-light);">${ep.num}</span>
                        <div>
                          <h4 style="font-size: 0.95rem; color: #fff;">${ep.title}</h4>
                          <span style="font-size: 0.8rem; color: var(--text-muted);">${ep.duration}</span>
                        </div>
                      </div>
                      <button class="card-btn-play" style="width: 32px; height: 32px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div>
            <div class="modal-info-item">
              <div class="modal-info-label">Genres</div>
              <div class="modal-info-val">${movie.genres ? movie.genres.join(', ') : movie.genre}</div>
            </div>
            <div class="modal-info-item">
              <div class="modal-info-label">Director</div>
              <div class="modal-info-val">${movie.director}</div>
            </div>
            <div class="modal-info-item">
              <div class="modal-info-label">Starring Cast</div>
              <div class="modal-info-val">${movie.cast ? movie.cast.join(', ') : 'Cast information available'}</div>
            </div>
            <div class="modal-info-item">
              <div class="modal-info-label">Maturity Rating</div>
              <div class="modal-info-val">${movie.age_rating} (Recommended for mature viewers)</div>
            </div>
          </div>
        </div>

        ${movie.related && movie.related.length > 0 ? `
          <div style="margin-top: 2rem;">
            <h3 style="font-size: 1.25rem; margin-bottom: 1.25rem; color: #fff;">More Like This</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.25rem;" id="modalRelatedGrid"></div>
          </div>
        ` : ''}
      </div>
    `;

    // Bind related movies
    const relatedContainer = dialog.querySelector('#modalRelatedGrid');
    if (relatedContainer && movie.related) {
      movie.related.forEach(rel => {
        const card = createMovieCard(rel, {
          onWatch: (id) => {
            this.close();
            this.onWatch(id);
          },
          onToggleMyList: this.onToggleMyList,
          onOpenDetails: (id) => {
            this.onOpenDetails(id);
          }
        });
        relatedContainer.appendChild(card);
      });
    }

    // Modal buttons
    dialog.querySelector('#modalCloseBtn').addEventListener('click', () => this.close());
    dialog.querySelector('#modalWatchBtn').addEventListener('click', () => {
      this.close();
      this.onWatch(movie.id);
    });
    dialog.querySelector('#modalMyListBtn').addEventListener('click', () => {
      this.onToggleMyList(movie.id);
      this.updateMyListStatus(!isInMyList);
    });

    const epRows = dialog.querySelectorAll('.episode-row');
    epRows.forEach(row => {
      row.addEventListener('click', () => {
        this.close();
        this.onWatch(movie.id);
      });
    });

    this.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  updateMyListStatus(isInMyList) {
    const btn = this.modalOverlay.querySelector('#modalMyListBtn');
    if (btn) {
      btn.querySelector('span').textContent = isInMyList ? 'In My List' : 'Add to List';
      btn.querySelector('svg').innerHTML = isInMyList
        ? '<path d="M20 6L9 17l-5-5"/>'
        : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    }
  }

  close() {
    this.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}
