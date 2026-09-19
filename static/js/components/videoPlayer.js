/* ==========================================================================
   STREAMFLIX CINEMATIC CUSTOM VIDEO PLAYER
   Distraction-free, responsive, plan-aware quality selector, shortcuts
   ========================================================================== */

export class VideoPlayer {
  constructor({ onBack, onShowToast, onOpenProfile }) {
    this.container = document.getElementById('playerView');
    this.video = document.getElementById('mainVideo');
    this.onBack = onBack;
    this.onShowToast = onShowToast;
    this.onOpenProfile = onOpenProfile;

    this.currentMovie = null;
    this.currentUser = null;
    this.streamData = null;
    this.idleTimer = null;
    this.historyTimer = null;

    this.initEvents();
  }

  initEvents() {
    // Play / Pause
    const playBtn = document.getElementById('playerPlayBtn');
    playBtn.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('click', () => this.togglePlay());

    // Center splash
    this.video.addEventListener('play', () => {
      this.updatePlayState(true);
      this.flashSplash(false);
    });
    this.video.addEventListener('pause', () => {
      this.updatePlayState(false);
      this.flashSplash(true);
    });

    // Time update & Scrubber
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('progress', () => this.onBufferUpdate());

    const scrubber = document.getElementById('playerScrubber');
    scrubber.addEventListener('click', (e) => this.seek(e));
    scrubber.addEventListener('mousemove', (e) => this.showScrubberTooltip(e));
    scrubber.addEventListener('mouseleave', () => {
      document.getElementById('playerTooltip').style.display = 'none';
    });

    // Skips ±10s
    document.getElementById('playerSkipBack').addEventListener('click', () => {
      this.video.currentTime = Math.max(0, this.video.currentTime - 10);
    });
    document.getElementById('playerSkipForward').addEventListener('click', () => {
      this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
    });

    // Volume & Mute
    const volBtn = document.getElementById('playerVolBtn');
    const volSlider = document.getElementById('playerVolSlider');
    volBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      volSlider.value = this.video.muted ? 0 : this.video.volume;
      this.updateVolumeIcon();
    });
    volSlider.addEventListener('input', (e) => {
      this.video.volume = parseFloat(e.target.value);
      this.video.muted = (this.video.volume === 0);
      this.updateVolumeIcon();
    });

    // Fullscreen
    document.getElementById('playerFullscreenBtn').addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Back Button
    document.getElementById('playerBackBtn').addEventListener('click', () => {
      this.close();
    });

    // Speed Menu
    const speedBtn = document.getElementById('playerSpeedBtn');
    const speedMenu = document.getElementById('playerSpeedMenu');
    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeMenus();
      speedMenu.classList.toggle('active');
    });

    speedMenu.querySelectorAll('.player-menu-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const speed = parseFloat(opt.getAttribute('data-speed'));
        this.video.playbackRate = speed;
        speedMenu.querySelectorAll('.player-menu-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        speedBtn.querySelector('span').textContent = `${speed}x`;
        speedMenu.classList.remove('active');
      });
    });

    // Quality Menu
    const qualityBtn = document.getElementById('playerQualityBtn');
    const qualityMenu = document.getElementById('playerQualityMenu');
    qualityBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeMenus();
      qualityMenu.classList.toggle('active');
    });

    // Auto-hide controls on mouse idle
    this.container.addEventListener('mousemove', () => this.resetIdleTimer());
    this.container.addEventListener('touchstart', () => this.resetIdleTimer());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.container.classList.contains('active')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.video.volume = Math.min(1, this.video.volume + 0.1);
        volSlider.value = this.video.volume;
        this.video.muted = false;
        this.updateVolumeIcon();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
        volSlider.value = this.video.volume;
        this.updateVolumeIcon();
      } else if (e.key.toLowerCase() === 'm') {
        this.video.muted = !this.video.muted;
        volSlider.value = this.video.muted ? 0 : this.video.volume;
        this.updateVolumeIcon();
      } else if (e.key.toLowerCase() === 'f') {
        this.toggleFullscreen();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    // Close menus when clicking outside
    document.addEventListener('click', () => this.closeMenus());
  }

  closeMenus() {
    document.getElementById('playerSpeedMenu').classList.remove('active');
    document.getElementById('playerQualityMenu').classList.remove('active');
  }

  open(movie, user, streamData) {
    this.currentMovie = movie;
    this.currentUser = user;
    this.streamData = streamData;

    document.getElementById('playerMovieTitle').textContent = movie.title;
    document.getElementById('playerTierBadge').textContent = `${streamData.quality} • ${user.subscription.name}`;

    // Setup Quality Picker with plan constraints
    this.setupQualityOptions();

    this.video.src = streamData.video_url;
    this.container.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.video.play().catch(() => {
      // Autoplay with audio might be blocked in some browsers; mute if blocked
      this.video.muted = true;
      this.video.play();
    });

    this.resetIdleTimer();

    // Start tracking watch progress
    this.startHistoryTracker();
  }

  setupQualityOptions() {
    const qualityMenu = document.getElementById('playerQualityMenu');
    const userPlan = this.currentUser.subscription.id; // 'basic', 'standard', 'premium'

    const qualities = [
      { id: '4k', label: '4K Ultra HD', required: 'premium' },
      { id: '1080p', label: '1080p Full HD', required: 'standard' },
      { id: '720p', label: '720p HD', required: 'basic' }
    ];

    qualityMenu.innerHTML = '';
    qualities.forEach(q => {
      const isAllowed = (userPlan === 'premium') || 
                        (userPlan === 'standard' && q.required !== 'premium') || 
                        (userPlan === 'basic' && q.required === 'basic');

      const isCurrent = (userPlan === 'premium' && q.id === '4k') ||
                        (userPlan === 'standard' && q.id === '1080p') ||
                        (userPlan === 'basic' && q.id === '720p');

      const opt = document.createElement('div');
      opt.className = `player-menu-option ${isCurrent ? 'selected' : ''} ${!isAllowed ? 'locked' : ''}`;
      opt.innerHTML = `
        <span>${q.label}</span>
        ${isAllowed ? (isCurrent ? '✓' : '') : '<span style="font-size:0.75rem; color:var(--accent-violet-light)">Upgrade 🔒</span>'}
      `;

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isAllowed) {
          this.onShowToast(`Streaming in ${q.label} requires ${q.required.toUpperCase()} Plan!`, 'error');
          this.close();
          this.onOpenProfile();
          return;
        }

        qualityMenu.querySelectorAll('.player-menu-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        document.getElementById('playerQualityBtn').querySelector('span').textContent = q.label;
        this.onShowToast(`Switched quality to ${q.label}`, 'success');
        this.closeMenus();
      });

      qualityMenu.appendChild(opt);
    });

    const activeLabel = (userPlan === 'premium') ? '4K Ultra HD' : (userPlan === 'standard') ? '1080p' : '720p';
    document.getElementById('playerQualityBtn').querySelector('span').textContent = activeLabel;
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  updatePlayState(isPlaying) {
    const playBtn = document.getElementById('playerPlayBtn');
    playBtn.innerHTML = isPlaying 
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }

  flashSplash(isPaused) {
    const splash = document.getElementById('playerCenterSplash');
    splash.innerHTML = isPaused
      ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    splash.classList.add('animate');
    setTimeout(() => splash.classList.remove('animate'), 400);
  }

  onTimeUpdate() {
    const current = this.video.currentTime;
    const total = this.video.duration || 1;
    const percent = (current / total) * 100;

    document.getElementById('playerScrubberFill').style.width = `${percent}%`;
    document.getElementById('playerTimeText').textContent = `${this.formatTime(current)} / ${this.formatTime(total)}`;
  }

  onBufferUpdate() {
    if (this.video.buffered.length > 0) {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const duration = this.video.duration || 1;
      const percent = (bufferedEnd / duration) * 100;
      document.getElementById('playerScrubberBuffer').style.width = `${percent}%`;
    }
  }

  seek(e) {
    const scrubber = document.getElementById('playerScrubber');
    const rect = scrubber.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    this.video.currentTime = pos * (this.video.duration || 1);
  }

  showScrubberTooltip(e) {
    const scrubber = document.getElementById('playerScrubber');
    const tooltip = document.getElementById('playerTooltip');
    const rect = scrubber.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (this.video.duration || 0);

    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.textContent = this.formatTime(targetTime);
    tooltip.style.display = 'block';
  }

  updateVolumeIcon() {
    const icon = document.getElementById('playerVolIcon');
    if (this.video.muted || this.video.volume === 0) {
      icon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    } else {
      icon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  resetIdleTimer() {
    this.container.classList.remove('controls-hidden');
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!this.video.paused) {
        this.container.classList.add('controls-hidden');
        this.closeMenus();
      }
    }, 3000);
  }

  startHistoryTracker() {
    clearInterval(this.historyTimer);
    this.historyTimer = setInterval(async () => {
      if (!this.video.paused && this.currentMovie) {
        const percent = Math.round((this.video.currentTime / (this.video.duration || 1)) * 100);
        const { API } = await import('../api.js');
        API.updateHistory(this.currentMovie.id, percent, this.video.currentTime);
      }
    }, 5000);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  close() {
    clearInterval(this.historyTimer);
    clearTimeout(this.idleTimer);
    this.video.pause();
    this.video.src = '';
    this.container.classList.remove('active');
    document.body.style.overflow = '';
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.onBack();
  }
}
