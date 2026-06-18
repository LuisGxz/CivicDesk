declare global {
  interface Window { CIVICDESK_API_BASE?: string; }
}

// Overridable at deploy time (GitHub Pages injects window.CIVICDESK_API_BASE in index.html).
export const API_BASE = window.CIVICDESK_API_BASE ?? 'http://localhost:5280';
export const API_URL = `${API_BASE}/api/v1`;
