/* ==========================================================================
   STREAMFLIX API CLIENT LAYER
   Connects UI to server.py and final.py backend models
   ========================================================================== */

const API_BASE = '/api';

export const API = {
  // Auth & User Profile (Backed by final.py User class)
  async getUser() {
    try {
      const res = await fetch(`${API_BASE}/auth/user`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return await res.json();
    } catch (err) {
      console.error('API Error in getUser:', err);
      return null;
    }
  },

  async login(password, name = 'Rahul') {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Login failed');
    }
    return await res.json();
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    return await res.json();
  },

  // Subscription Plans (Backed by VALID_PLANS in final.py)
  async getPlans() {
    try {
      const res = await fetch(`${API_BASE}/subscription/plans`);
      return await res.json();
    } catch (err) {
      console.error('API Error in getPlans:', err);
      return [];
    }
  },

  async upgradePlan(planName) {
    const res = await fetch(`${API_BASE}/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planName })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upgrade failed');
    }
    return await res.json();
  },

  // Movies & Catalog
  async getCatalog(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `${API_BASE}/movies${params ? '?' + params : ''}`;
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('API Error in getCatalog:', err);
      return { all: [], featured: null, categories: {} };
    }
  },

  async getMovieDetail(id) {
    const res = await fetch(`${API_BASE}/movies/${id}`);
    if (!res.ok) throw new Error('Movie not found');
    return await res.json();
  },

  async watchMovie(id) {
    const res = await fetch(`${API_BASE}/movies/${id}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Streaming authorization failed');
    }
    return await res.json();
  },

  // Search & Filtering
  async search(query = '', type = 'all', genre = 'all', sort = 'relevance') {
    try {
      const params = new URLSearchParams({ q: query, type, genre, sort }).toString();
      const res = await fetch(`${API_BASE}/search?${params}`);
      return await res.json();
    } catch (err) {
      console.error('API Error in search:', err);
      return { query, count: 0, results: [], suggestions: [] };
    }
  },

  // My List
  async getMyList() {
    try {
      const res = await fetch(`${API_BASE}/mylist`);
      return await res.json();
    } catch (err) {
      console.error('API Error in getMyList:', err);
      return [];
    }
  },

  async addToMyList(id) {
    const res = await fetch(`${API_BASE}/mylist/${id}`, { method: 'POST' });
    return await res.json();
  },

  async removeFromMyList(id) {
    const res = await fetch(`${API_BASE}/mylist/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // History / Continue Watching
  async getHistory() {
    try {
      const res = await fetch(`${API_BASE}/history`);
      return await res.json();
    } catch (err) {
      console.error('API Error in getHistory:', err);
      return [];
    }
  },

  async updateHistory(id, progressPercent, stoppedSeconds) {
    try {
      await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          progress_percent: progressPercent,
          stopped_at_seconds: Math.floor(stoppedSeconds)
        })
      });
    } catch (err) {
      console.warn('Could not update history:', err);
    }
  }
};
