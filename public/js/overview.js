/**
 * PeopleDesk - Overview Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  loadOverviewMetrics();
});

async function loadOverviewMetrics() {
  const kpiContainer = document.getElementById('kpiStrip');
  const deptSnapshotContainer = document.getElementById('deptSnapshotList');
  const workforceDistContainer = document.getElementById('workforceDistList');
  const statusGridContainer = document.getElementById('statusGridContainer');
  const recentHiresContainer = document.getElementById('recentHiresList');

  try {
    const data = await apiGet('/api/stats');
    const { stats } = data;

    // Render Horizontal KPI Strip
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="kpi-item kpi-total">
          <div class="kpi-header">
            <span class="kpi-label">Total Workforce</span>
            <span class="kpi-badge" style="background:#FFE6DD; color:#FF6B35;">Headcount</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${stats.totalWorkforce}</span>
            <span class="kpi-subtext">Registered</span>
          </div>
        </div>

        <div class="kpi-item kpi-active">
          <div class="kpi-header">
            <span class="kpi-label">Active</span>
            <span class="kpi-badge" style="background:#D1FAE5; color:#065F46;">Operating</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${stats.active}</span>
            <span class="kpi-subtext">${calculatePercent(stats.active, stats.totalWorkforce)}% of staff</span>
          </div>
        </div>

        <div class="kpi-item kpi-onleave">
          <div class="kpi-header">
            <span class="kpi-label">On Leave</span>
            <span class="kpi-badge" style="background:#FFEDD5; color:#9A3412;">Temporary</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${stats.onLeave}</span>
            <span class="kpi-subtext">${calculatePercent(stats.onLeave, stats.totalWorkforce)}% off-duty</span>
          </div>
        </div>

        <div class="kpi-item kpi-probation">
          <div class="kpi-header">
            <span class="kpi-label">Probation</span>
            <span class="kpi-badge" style="background:#EDE9FE; color:#5B21B6;">Evaluating</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${stats.probation}</span>
            <span class="kpi-subtext">${calculatePercent(stats.probation, stats.totalWorkforce)}% under review</span>
          </div>
        </div>

        <div class="kpi-item kpi-inactive">
          <div class="kpi-header">
            <span class="kpi-label">Inactive</span>
            <span class="kpi-badge" style="background:#FEE2E2; color:#991B1B;">Offboarded</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${stats.inactive}</span>
            <span class="kpi-subtext">Archived</span>
          </div>
        </div>
      `;
    }

    // Render Workforce Distribution (Left Section)
    if (workforceDistContainer) {
      if (stats.departments && stats.departments.length > 0) {
        workforceDistContainer.innerHTML = stats.departments.map(d => {
          const pct = calculatePercent(d.count, stats.totalWorkforce);
          return `
            <div class="bar-row">
              <div class="bar-info">
                <span class="bar-label">${escapeHtml(d.department)}</span>
                <span class="bar-count">${d.count} staff (${pct}%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        workforceDistContainer.innerHTML = `<div class="empty-state-box"><p class="empty-state-desc">No department data recorded yet.</p></div>`;
      }
    }

    // Render Employee Status (Right Section)
    if (statusGridContainer) {
      const activePct = calculatePercent(stats.active, stats.totalWorkforce);
      const leavePct = calculatePercent(stats.onLeave, stats.totalWorkforce);
      const probPct = calculatePercent(stats.probation, stats.totalWorkforce);
      const inactPct = calculatePercent(stats.inactive, stats.totalWorkforce);

      statusGridContainer.innerHTML = `
        <div class="status-mini-card">
          <div class="status-mini-title" style="color: var(--status-active-text);">
            <span class="status-dot" style="background-color: var(--status-active-dot);"></span> Active Workforce
          </div>
          <div class="status-mini-count">${stats.active}</div>
          <div class="status-mini-percent">${activePct}% of total capacity</div>
          <div class="bar-track" style="margin-top:6px;">
            <div class="bar-fill bar-active" style="width: ${activePct}%"></div>
          </div>
        </div>

        <div class="status-mini-card">
          <div class="status-mini-title" style="color: var(--status-leave-text);">
            <span class="status-dot" style="background-color: var(--status-leave-dot);"></span> On Leave
          </div>
          <div class="status-mini-count">${stats.onLeave}</div>
          <div class="status-mini-percent">${leavePct}% on sanctioned leave</div>
          <div class="bar-track" style="margin-top:6px;">
            <div class="bar-fill bar-leave" style="width: ${leavePct}%"></div>
          </div>
        </div>

        <div class="status-mini-card">
          <div class="status-mini-title" style="color: var(--status-probation-text);">
            <span class="status-dot" style="background-color: var(--status-probation-dot);"></span> In Probation
          </div>
          <div class="status-mini-count">${stats.probation}</div>
          <div class="status-mini-percent">${probPct}% new hire evaluation</div>
          <div class="bar-track" style="margin-top:6px;">
            <div class="bar-fill bar-probation" style="width: ${probPct}%"></div>
          </div>
        </div>

        <div class="status-mini-card">
          <div class="status-mini-title" style="color: var(--status-inactive-text);">
            <span class="status-dot" style="background-color: var(--status-inactive-dot);"></span> Inactive / Exited
          </div>
          <div class="status-mini-count">${stats.inactive}</div>
          <div class="status-mini-percent">${inactPct}% alumni or suspended</div>
          <div class="bar-track" style="margin-top:6px;">
            <div class="bar-fill bar-inactive" style="width: ${inactPct}%"></div>
          </div>
        </div>
      `;
    }

    // Render Recent Hires
    if (recentHiresContainer) {
      if (stats.recentHires && stats.recentHires.length > 0) {
        recentHiresContainer.innerHTML = stats.recentHires.map(emp => `
          <div class="recent-hire-item">
            <div class="recent-hire-meta">
              ${renderAvatar(emp.first_name, emp.last_name)}
              <div>
                <a href="employees.html?view=${emp.employee_id}" class="hire-name" style="text-decoration:none;">
                  ${escapeHtml(emp.first_name)} ${escapeHtml(emp.last_name)}
                </a>
                <div class="hire-title">${escapeHtml(emp.job_title)} &bull; ${escapeHtml(emp.department)}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="hire-date">Joined ${formatDate(emp.joining_date)}</div>
              <div style="margin-top: 4px;">${formatStatusPill(emp.status)}</div>
            </div>
          </div>
        `).join('');
      } else {
        recentHiresContainer.innerHTML = `<div class="empty-state-box"><p class="empty-state-desc">No recent hires found.</p></div>`;
      }
    }

    // Render Department Snapshot (Horizontal bars)
    if (deptSnapshotContainer) {
      if (stats.departments && stats.departments.length > 0) {
        const maxDeptCount = Math.max(...stats.departments.map(d => d.count), 1);
        deptSnapshotContainer.innerHTML = stats.departments.map(d => {
          const barWidth = Math.round((d.count / maxDeptCount) * 100);
          return `
            <div class="bar-row">
              <div class="bar-info">
                <a href="employees.html?department=${encodeURIComponent(d.department)}" class="bar-label" style="text-decoration:none; color:inherit;">
                  ${escapeHtml(d.department)}
                </a>
                <span class="bar-count">${d.count} staff</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${barWidth}%"></div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        deptSnapshotContainer.innerHTML = `<div class="empty-state-box"><p class="empty-state-desc">No department data available.</p></div>`;
      }
    }

  } catch (err) {
    console.error('Error loading overview data:', err);
    showToast('Failed to load live overview metrics.', 'error');
  }
}

function calculatePercent(count, total) {
  if (!total || total === 0) return 0;
  return Math.round((count / total) * 100);
}
