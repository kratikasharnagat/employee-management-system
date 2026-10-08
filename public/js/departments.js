/**
 * PeopleDesk - Departments Section Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  loadDepartmentsList();
});

async function loadDepartmentsList() {
  const container = document.getElementById('departmentsGrid');
  const countBadge = document.getElementById('deptCountBadge');

  if (container) {
    container.innerHTML = `
      <div class="loading-spinner-row" style="grid-column: 1 / -1;">
        <div class="spinner"></div>
        <span>Loading organizational departments...</span>
      </div>
    `;
  }

  try {
    const res = await apiGet('/api/departments');
    const departments = res.departments || [];

    if (countBadge) {
      countBadge.textContent = `${departments.length} departments`;
    }

    if (!departments || departments.length === 0) {
      if (container) {
        container.innerHTML = `
          <div class="empty-state-box" style="grid-column: 1 / -1;">
            <div class="empty-state-title">No Departments Configured</div>
            <p class="empty-state-desc">Assign team members to departments to visualize your corporate structure.</p>
          </div>
        `;
      }
      return;
    }

    if (container) {
      container.innerHTML = departments.map(d => {
        return `
          <div class="dept-card" onclick="navigateToDeptDirectory('${escapeHtml(d.name)}')">
            <div class="dept-card-top">
              <div>
                <h3 class="dept-name">${escapeHtml(d.name)}</h3>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
                  Lead: <strong style="color: var(--text-primary);">${escapeHtml(d.lead || 'Unassigned')}</strong>
                </div>
              </div>
              <span class="dept-headcount-badge">${d.employee_count} Members</span>
            </div>

            <div class="dept-stats-row">
              <div class="dept-stat-item">
                <span class="dept-stat-label">Active Staff</span>
                <span class="dept-stat-val" style="color: var(--status-active-text);">${d.active_count}</span>
              </div>
              <div class="dept-stat-item">
                <span class="dept-stat-label">Off-Duty / Inactive</span>
                <span class="dept-stat-val" style="color: var(--text-secondary);">${d.employee_count - d.active_count}</span>
              </div>
            </div>

            <div class="dept-footer">
              <span>View team members</span>
              <span class="dept-link-action">
                Browse Directory
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Failed to load departments:', err);
    if (container) {
      container.innerHTML = `
        <div class="empty-state-box" style="grid-column: 1 / -1;">
          <div class="empty-state-title" style="color:#DC2626;">Error Loading Departments</div>
          <p class="empty-state-desc">${escapeHtml(err.message)}</p>
          <button class="btn btn-secondary btn-sm" onclick="loadDepartmentsList()">Retry</button>
        </div>
      `;
    }
  }
}

function navigateToDeptDirectory(departmentName) {
  window.location.href = `employees.html?department=${encodeURIComponent(departmentName)}`;
}
