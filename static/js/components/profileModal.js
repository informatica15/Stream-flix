/* ==========================================================================
   STREAMFLIX PROFILE & SUBSCRIPTION UPGRADE MODAL
   Directly manages OOP Subscription tiers and User login from final.py
   ========================================================================== */

import { API } from '../api.js';

export class ProfileModal {
  constructor({ onUserUpdated, onShowToast, onWatch }) {
    this.modal = document.getElementById('profileModal');
    this.onUserUpdated = onUserUpdated;
    this.onShowToast = onShowToast;
    this.onWatch = onWatch;

    this.currentUser = null;
    this.plans = [];

    this.initEvents();
  }

  initEvents() {
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    const closeBtn = document.getElementById('profileCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  async open() {
    this.currentUser = await API.getUser();
    this.plans = await API.getPlans();
    const history = await API.getHistory();

    const dialog = this.modal.querySelector('.modal-dialog');
    dialog.innerHTML = `
      <button class="modal-close-btn" id="profileCloseBtnInner" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div style="padding: 2.5rem;">
        <div class="profile-header-card">
          <div class="profile-avatar-large">
            ${this.currentUser && this.currentUser.is_logged_in ? this.currentUser.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
              <h2 style="font-size: 1.8rem; font-weight: 700;">${this.currentUser && this.currentUser.is_logged_in ? this.currentUser.name : 'Guest User'}</h2>
              <span class="tier-pill ${this.currentUser && this.currentUser.subscription && this.currentUser.subscription.id === 'premium' ? 'tier-premium' : ''}">
                ${this.currentUser && this.currentUser.is_logged_in ? this.currentUser.subscription.name : 'Not Logged In'}
              </span>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">${this.currentUser && this.currentUser.is_logged_in ? this.currentUser.email : 'Please sign in to stream and manage subscription.'}</p>
            
            <div style="display: flex; gap: 1rem; align-items: center;">
              ${this.currentUser && this.currentUser.is_logged_in ? `
                <button class="btn-secondary" id="profileLogoutBtn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">
                  Sign Out
                </button>
              ` : `
                <button class="btn-primary" id="profileLoginBtn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">
                  Sign In (Default: 1234)
                </button>
              `}
            </div>
          </div>
        </div>

        <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem; color: #fff;">Subscription Plans</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem;">
          Powered by OOP Subscription architecture. Upgrade anytime for higher resolutions and multi-device streaming.
        </p>

        <div class="subscription-grid" id="profilePlansGrid">
          ${this.plans.map(p => {
            const isCurrent = this.currentUser && this.currentUser.subscription && this.currentUser.subscription.name === p.name;
            return `
              <div class="plan-card ${isCurrent ? 'current' : ''}">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="font-size: 1.2rem; font-weight: 700; color: #fff;">${p.name}</h4>
                    ${isCurrent ? '<span class="badge badge-match">Active Plan</span>' : ''}
                  </div>
                  <div class="plan-price">
                    ₹${p.price}<span>/month</span>
                  </div>
                  <ul class="plan-features-list">
                    <li>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <strong>${p.quality}</strong> Streaming Quality
                    </li>
                    <li>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Up to <strong>${p.max_devices} device${p.max_devices > 1 ? 's' : ''}</strong> simultaneously
                    </li>
                    <li>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ${p.allows_download ? 'Offline Downloads Enabled' : 'No Downloads'}
                    </li>
                  </ul>
                </div>
                <button 
                  class="${isCurrent ? 'btn-secondary' : 'btn-primary'} plan-upgrade-btn" 
                  data-plan="${p.id}"
                  ${isCurrent ? 'disabled' : ''}
                  style="width: 100%;">
                  ${isCurrent ? 'Current Tier' : `Upgrade to ${p.name.replace('Plan', '')}`}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        ${history && history.length > 0 ? `
          <div style="margin-top: 2rem;">
            <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: #fff;">Watch History</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${history.map(item => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${item.poster_url}" alt="${item.title}" style="width: 44px; height: 60px; object-fit: cover; border-radius: 4px;" />
                    <div>
                      <h4 style="font-size: 1rem; color: #fff;">${item.title}</h4>
                      <p style="font-size: 0.82rem; color: var(--text-muted);">${item.progress_percent}% watched • Last seen ${item.last_watched}</p>
                    </div>
                  </div>
                  <button class="btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.82rem;" data-resume="${item.id}">
                    Resume
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Inner close
    dialog.querySelector('#profileCloseBtnInner').addEventListener('click', () => this.close());

    // Upgrade buttons
    dialog.querySelectorAll('.plan-upgrade-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const planId = btn.getAttribute('data-plan');
        try {
          btn.textContent = 'Upgrading...';
          const result = await API.upgradePlan(planId);
          this.onShowToast(result.message, 'success');
          this.currentUser = result.user;
          this.onUserUpdated(this.currentUser);
          await this.open(); // Refresh view
        } catch (err) {
          this.onShowToast(err.message, 'error');
          btn.textContent = 'Upgrade';
        }
      });
    });

    // Login / Logout buttons
    const logoutBtn = dialog.querySelector('#profileLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await API.logout();
        this.currentUser = await API.getUser();
        this.onUserUpdated(this.currentUser);
        this.onShowToast('Logged out successfully', 'success');
        await this.open();
      });
    }

    const loginBtn = dialog.querySelector('#profileLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        try {
          const res = await API.login('1234', 'Rahul');
          this.currentUser = res;
          this.onUserUpdated(this.currentUser);
          this.onShowToast('Logged in as Rahul', 'success');
          await this.open();
        } catch (err) {
          this.onShowToast(err.message, 'error');
        }
      });
    }

    // Resume buttons
    dialog.querySelectorAll('[data-resume]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mid = btn.getAttribute('data-resume');
        this.close();
        this.onWatch(mid);
      });
    });

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
