/**
 * PeopleDesk - Global App Utilities & Shared Logic
 */

// Toast notification management
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">${escapeHtml(message)}</div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const removeToast = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  };

  toast.querySelector('.toast-close').addEventListener('click', removeToast);
  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

// API helper functions
async function apiGet(endpoint) {
  const response = await fetch(endpoint);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

async function apiPost(endpoint, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to submit data');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function apiPut(endpoint, body) {
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update data');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function apiDelete(endpoint) {
  const response = await fetch(endpoint, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to delete record');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Avatar color palette based on name hashing
const AVATAR_COLORS = [
  '#FF6B35', '#E85D04', '#2563EB', '#7C3AED',
  '#059669', '#D97706', '#DC2626', '#4B5563',
  '#0D9488', '#4338CA', '#9333EA', '#C026D3'
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(firstName = '', lastName = '') {
  const f = (firstName || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  return (f + l) || 'EP';
}

function renderAvatar(firstName, lastName, sizeClass = '') {
  const initials = getInitials(firstName, lastName);
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  const color = getAvatarColor(fullName);
  return `<div class="avatar-circle ${sizeClass}" style="background-color: ${color}">${initials}</div>`;
}

function formatStatusPill(status) {
  const s = status || 'Active';
  let cssClass = 'status-active';
  if (s === 'On Leave') cssClass = 'status-on-leave';
  else if (s === 'Probation') cssClass = 'status-probation';
  else if (s === 'Inactive') cssClass = 'status-inactive';

  return `<span class="status-pill ${cssClass}"><span class="status-dot"></span>${escapeHtml(s)}</span>`;
}

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
  return dateStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Settings storage helper
const DEFAULT_SETTINGS = {
  companyName: 'PeopleDesk Technologies Inc.',
  adminName: 'Administrator',
  defaultLocation: 'Mumbai',
  financialYear: '2026 - 2027',
  defaultStatus: 'Active'
};

function getSettings() {
  try {
    const raw = localStorage.getItem('peopledesk_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  localStorage.setItem('peopledesk_settings', JSON.stringify(settings));
}

// Global initialization across all pages
document.addEventListener('DOMContentLoaded', () => {
  const settings = getSettings();

  // Apply Admin Name in Top Navigation
  const adminLabel = document.getElementById('navAdminName');
  if (adminLabel) adminLabel.textContent = settings.adminName || 'Administrator';

  // Apply Greeting on Overview page if element exists
  const overviewGreeting = document.getElementById('overviewGreeting');
  if (overviewGreeting) {
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';
    overviewGreeting.textContent = `Good ${timeOfDay}, ${settings.adminName || 'Administrator'}.`;
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Header quick search
  const headerSearchInput = document.getElementById('globalSearchInput');
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = headerSearchInput.value.trim();
        if (query) {
          window.location.href = `employees.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // Notifications button interactive dialog
  const notifBtn = document.getElementById('navNotifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      showToast('System operational: SQLite database healthy. All services online.', 'info', 4000);
    });
  }
});
