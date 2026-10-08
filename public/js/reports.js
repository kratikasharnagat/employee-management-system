/**
 * PeopleDesk - Reports & Analytics Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  loadReportsData();
  setupReportActions();
});

async function loadReportsData() {
  try {
    const statsRes = await apiGet('/api/stats');
    const { stats } = statsRes;

    // Render Department Breakdown Table
    const deptTbody = document.getElementById('reportDeptTableBody');
    if (deptTbody && stats.departments) {
      deptTbody.innerHTML = stats.departments.map(d => {
        const pct = stats.totalWorkforce > 0 ? Math.round((d.count / stats.totalWorkforce) * 100) : 0;
        return `
          <tr>
            <td style="font-weight: 600;">${escapeHtml(d.department)}</td>
            <td>${d.count}</td>
            <td>${pct}%</td>
            <td>
              <div class="bar-track" style="height: 6px; width: 100px;">
                <div class="bar-fill" style="width: ${pct}%;"></div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Render Employment Type Breakdown Table
    const typeTbody = document.getElementById('reportTypeTableBody');
    if (typeTbody && stats.employmentTypes) {
      typeTbody.innerHTML = stats.employmentTypes.map(t => {
        const pct = stats.totalWorkforce > 0 ? Math.round((t.count / stats.totalWorkforce) * 100) : 0;
        return `
          <tr>
            <td style="font-weight: 600;">${escapeHtml(t.employment_type)}</td>
            <td>${t.count}</td>
            <td>${pct}%</td>
            <td>
              <div class="bar-track" style="height: 6px; width: 100px;">
                <div class="bar-fill" style="width: ${pct}%; background-color: #2563EB;"></div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Render Status Breakdown Table
    const statusTbody = document.getElementById('reportStatusTableBody');
    if (statusTbody) {
      const statusItems = [
        { label: 'Active', count: stats.active, pill: 'status-active', color: 'var(--status-active-dot)' },
        { label: 'On Leave', count: stats.onLeave, pill: 'status-on-leave', color: 'var(--status-leave-dot)' },
        { label: 'Probation', count: stats.probation, pill: 'status-probation', color: 'var(--status-probation-dot)' },
        { label: 'Inactive', count: stats.inactive, pill: 'status-inactive', color: 'var(--status-inactive-dot)' }
      ];

      statusTbody.innerHTML = statusItems.map(s => {
        const pct = stats.totalWorkforce > 0 ? Math.round((s.count / stats.totalWorkforce) * 100) : 0;
        return `
          <tr>
            <td>${formatStatusPill(s.label)}</td>
            <td style="font-weight: 600;">${s.count}</td>
            <td>${pct}%</td>
            <td>
              <div class="bar-track" style="height: 6px; width: 100px;">
                <div class="bar-fill" style="width: ${pct}%; background-color: ${s.color};"></div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Render Recent Hires Report Table
    const hiresTbody = document.getElementById('reportHiresTableBody');
    if (hiresTbody && stats.recentHires) {
      hiresTbody.innerHTML = stats.recentHires.map(h => {
        return `
          <tr>
            <td>
              <div class="emp-cell">
                ${renderAvatar(h.first_name, h.last_name)}
                <div class="emp-names-group">
                  <span class="emp-full-name">${escapeHtml(h.first_name)} ${escapeHtml(h.last_name)}</span>
                  <span class="emp-email">${escapeHtml(h.email)}</span>
                </div>
              </div>
            </td>
            <td><span class="emp-id-badge">${escapeHtml(h.employee_id)}</span></td>
            <td>${escapeHtml(h.department)}</td>
            <td>${escapeHtml(h.job_title)}</td>
            <td style="font-family: var(--font-mono); font-size: 12px;">${formatDate(h.joining_date)}</td>
            <td>${formatStatusPill(h.status)}</td>
          </tr>
        `;
      }).join('');
    }

    // Timestamp
    const reportDateSpan = document.getElementById('reportGeneratedAt');
    if (reportDateSpan) {
      reportDateSpan.textContent = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    }

  } catch (err) {
    console.error('Failed to load reports:', err);
    showToast('Failed to load report analytics.', 'error');
  }
}

function setupReportActions() {
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const printReportBtn = document.getElementById('printReportBtn');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', downloadCsvExport);
  }

  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

async function downloadCsvExport() {
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const originalText = exportCsvBtn.innerHTML;

  try {
    exportCsvBtn.disabled = true;
    exportCsvBtn.innerHTML = `<span>Exporting...</span>`;

    const response = await fetch('/api/export/csv');
    if (!response.ok) {
      throw new Error('Failed to generate workforce CSV file.');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `PeopleDesk_Workforce_Report_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    showToast('✓ CSV file downloaded successfully.', 'success');
  } catch (err) {
    console.error('Export error:', err);
    showToast('Error exporting CSV: ' + err.message, 'error');
  } finally {
    exportCsvBtn.disabled = false;
    exportCsvBtn.innerHTML = originalText;
  }
}
