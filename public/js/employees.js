/**
 * PeopleDesk - Employee Directory & Table Operations
 */

let allEmployees = [];
let currentEmployeeForDelete = null;
let currentViewingEmployee = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupFilterListeners();
  setupDeleteModalListeners();
  setupProfileDrawerListeners();
  await loadAndRenderDirectory();
  handleUrlParameters();
});

// Load employee list with current filter state
async function loadAndRenderDirectory() {
  const tableBody = document.getElementById('employeeTableBody');
  const countBadge = document.getElementById('tableCountBadge');
  const emptyState = document.getElementById('employeeEmptyState');
  const tableCard = document.getElementById('employeeTableCard');

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="loading-spinner-row">
            <div class="spinner"></div>
            <span>Loading employees from SQLite...</span>
          </div>
        </td>
      </tr>
    `;
  }

  const deptVal = document.getElementById('filterDept')?.value || 'All';
  const roleVal = document.getElementById('filterRole')?.value || 'All';
  const statusVal = document.getElementById('filterStatus')?.value || 'All';
  const locVal = document.getElementById('filterLocation')?.value || 'All';
  const searchVal = document.getElementById('employeeSearchInput')?.value || '';
  const sortVal = document.getElementById('filterSort')?.value || 'id_desc';

  try {
    const params = new URLSearchParams();
    if (deptVal !== 'All') params.append('department', deptVal);
    if (roleVal !== 'All') params.append('role', roleVal);
    if (statusVal !== 'All') params.append('status', statusVal);
    if (locVal !== 'All') params.append('location', locVal);
    if (searchVal.trim()) params.append('search', searchVal.trim());
    if (sortVal) params.append('sort', sortVal);

    const res = await apiGet(`/api/employees?${params.toString()}`);
    allEmployees = res.employees || [];

    // Populate Dynamic Filter Options once if not yet done
    populateFilterDropdowns(allEmployees);

    if (countBadge) {
      countBadge.textContent = `${allEmployees.length} workforce members`;
    }

    if (!allEmployees || allEmployees.length === 0) {
      if (tableBody) tableBody.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'flex';
        const isFiltering = searchVal.trim() || deptVal !== 'All' || roleVal !== 'All' || statusVal !== 'All' || locVal !== 'All';
        emptyState.innerHTML = `
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <div class="empty-state-title">${isFiltering ? 'No employees match your search.' : 'No employees added yet.'}</div>
          <p class="empty-state-desc">${isFiltering ? 'Try clearing or modifying your search keyword and filter criteria.' : 'Start assembling your company directory by onboarding your first team member.'}</p>
          ${isFiltering 
            ? `<button class="btn btn-secondary btn-sm" onclick="clearAllFilters()">Clear Filters</button>` 
            : `<button class="btn btn-primary btn-sm" onclick="openAddEmployeeModal()">+ Add First Employee</button>`
          }
        `;
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (tableBody) {
      tableBody.innerHTML = allEmployees.map(emp => {
        return `
          <tr data-emp-id="${emp.id}" data-code="${emp.employee_id}">
            <td>
              <div class="emp-cell">
                ${renderAvatar(emp.first_name, emp.last_name)}
                <div class="emp-names-group">
                  <span class="emp-full-name">${escapeHtml(emp.first_name)} ${escapeHtml(emp.last_name)}</span>
                  <span class="emp-email">${escapeHtml(emp.email)}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="emp-id-badge">${escapeHtml(emp.employee_id)}</span>
            </td>
            <td>
              <span style="font-weight: 500;">${escapeHtml(emp.department)}</span>
            </td>
            <td>
              <span>${escapeHtml(emp.job_title)}</span>
            </td>
            <td>
              <span>${escapeHtml(emp.location || '—')}</span>
            </td>
            <td>
              <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">
                ${formatDate(emp.joining_date)}
              </span>
            </td>
            <td>
              ${formatStatusPill(emp.status)}
            </td>
            <td>
              <div class="action-buttons-group">
                <button class="action-btn btn-view" title="View Profile" onclick="viewEmployeeProfile(${emp.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  View
                </button>
                <button class="action-btn btn-edit" title="Edit Employee" onclick="openEditEmployeeModal(${emp.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  Edit
                </button>
                <button class="action-btn btn-delete" title="Delete Employee" onclick="promptDeleteEmployee(${emp.id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load employee list:', err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state-box">
              <div class="empty-state-title" style="color:#DC2626;">Error Loading Directory</div>
              <p class="empty-state-desc">${escapeHtml(err.message)}</p>
              <button class="btn btn-secondary btn-sm" onclick="loadAndRenderDirectory()">Retry</button>
            </div>
          </td>
        </tr>
      `;
    }
  }
}

// Populate Filter Dropdowns dynamically
let filterDropdownsInitialized = false;
function populateFilterDropdowns(employees) {
  if (filterDropdownsInitialized) return;

  const deptSelect = document.getElementById('filterDept');
  const roleSelect = document.getElementById('filterRole');
  const locSelect = document.getElementById('filterLocation');

  const standardDepts = [
    'Human Resources', 'Finance', 'Engineering', 'Information Technology',
    'Sales', 'Marketing', 'Operations', 'Customer Support', 'Administration'
  ];

  const uniqueDepts = Array.from(new Set([...standardDepts, ...employees.map(e => e.department).filter(Boolean)])).sort();
  const uniqueRoles = Array.from(new Set(employees.map(e => e.job_title).filter(Boolean))).sort();
  const uniqueLocs = Array.from(new Set(employees.map(e => e.location).filter(Boolean))).sort();

  if (deptSelect && deptSelect.options.length <= 1) {
    uniqueDepts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      deptSelect.appendChild(opt);
    });
  }

  if (roleSelect && roleSelect.options.length <= 1) {
    uniqueRoles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      roleSelect.appendChild(opt);
    });
  }

  if (locSelect && locSelect.options.length <= 1) {
    uniqueLocs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l;
      locSelect.appendChild(opt);
    });
  }

  filterDropdownsInitialized = true;
}

// Event Listeners for Filters
function setupFilterListeners() {
  const searchInput = document.getElementById('employeeSearchInput');
  const deptSelect = document.getElementById('filterDept');
  const roleSelect = document.getElementById('filterRole');
  const statusSelect = document.getElementById('filterStatus');
  const locSelect = document.getElementById('filterLocation');
  const sortSelect = document.getElementById('filterSort');

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadAndRenderDirectory();
      }, 250);
    });
  }

  [deptSelect, roleSelect, statusSelect, locSelect, sortSelect].forEach(sel => {
    if (sel) {
      sel.addEventListener('change', () => {
        loadAndRenderDirectory();
      });
    }
  });
}

function clearAllFilters() {
  const searchInput = document.getElementById('employeeSearchInput');
  const deptSelect = document.getElementById('filterDept');
  const roleSelect = document.getElementById('filterRole');
  const statusSelect = document.getElementById('filterStatus');
  const locSelect = document.getElementById('filterLocation');
  const sortSelect = document.getElementById('filterSort');

  if (searchInput) searchInput.value = '';
  if (deptSelect) deptSelect.value = 'All';
  if (roleSelect) roleSelect.value = 'All';
  if (statusSelect) statusSelect.value = 'All';
  if (locSelect) locSelect.value = 'All';
  if (sortSelect) sortSelect.value = 'id_desc';

  loadAndRenderDirectory();
}

// =======================================================
// RIGHT-SIDE PROFILE PANEL (DRAWER)
// =======================================================
function setupProfileDrawerListeners() {
  const backdrop = document.getElementById('profileDrawerBackdrop');
  const closeBtn = document.getElementById('closeProfileDrawerBtn');

  if (backdrop) {
    backdrop.addEventListener('click', closeProfileDrawer);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProfileDrawer);
  }

  // Escape key closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProfileDrawer();
      closeDeleteModal();
    }
  });
}

async function viewEmployeeProfile(idOrCode) {
  try {
    const res = await apiGet(`/api/employees/${idOrCode}`);
    const emp = res.employee;
    if (!emp) {
      showToast('Employee not found.', 'error');
      return;
    }

    currentViewingEmployee = emp;

    const drawer = document.getElementById('profileDrawer');
    const backdrop = document.getElementById('profileDrawerBackdrop');

    // Populate Drawer Header
    const avatarContainer = document.getElementById('drawerAvatar');
    if (avatarContainer) {
      avatarContainer.innerHTML = renderAvatar(emp.first_name, emp.last_name, 'avatar-lg');
    }

    document.getElementById('drawerEmpName').textContent = `${emp.first_name} ${emp.last_name}`;
    document.getElementById('drawerEmpTitle').textContent = `${emp.job_title} • ${emp.department}`;
    document.getElementById('drawerEmpId').textContent = emp.employee_id;
    document.getElementById('drawerStatusContainer').innerHTML = formatStatusPill(emp.status);

    // CONTACT
    document.getElementById('drawerEmail').textContent = emp.email || '—';
    document.getElementById('drawerPhone').textContent = emp.phone || '—';
    document.getElementById('drawerLocation').textContent = emp.location || '—';
    document.getElementById('drawerAddress').textContent = emp.address || '—';

    // WORK INFORMATION
    document.getElementById('drawerDepartment').textContent = emp.department || '—';
    document.getElementById('drawerJobTitle').textContent = emp.job_title || '—';
    document.getElementById('drawerEmploymentType').textContent = emp.employment_type || '—';
    document.getElementById('drawerManager').textContent = emp.manager || '—';
    document.getElementById('drawerJoiningDate').textContent = formatDate(emp.joining_date);

    // PERSONAL
    document.getElementById('drawerGender').textContent = emp.gender || '—';
    document.getElementById('drawerDob').textContent = formatDate(emp.date_of_birth);

    // EMERGENCY CONTACT
    document.getElementById('drawerEmergencyName').textContent = emp.emergency_contact_name || '—';
    document.getElementById('drawerEmergencyPhone').textContent = emp.emergency_contact_phone || '—';

    // COMPENSATION
    document.getElementById('drawerSalary').textContent = formatCurrency(emp.salary);

    // Drawer action buttons
    const editBtn = document.getElementById('drawerEditBtn');
    if (editBtn) {
      editBtn.onclick = () => {
        closeProfileDrawer();
        openEditEmployeeModal(emp.id);
      };
    }

    const deleteBtn = document.getElementById('drawerDeleteBtn');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        closeProfileDrawer();
        promptDeleteEmployee(emp.id);
      };
    }

    // Slide in
    if (backdrop) backdrop.classList.add('active');
    if (drawer) drawer.classList.add('active');

  } catch (err) {
    showToast('Failed to retrieve employee profile.', 'error');
  }
}

function closeProfileDrawer() {
  const drawer = document.getElementById('profileDrawer');
  const backdrop = document.getElementById('profileDrawerBackdrop');
  if (drawer) drawer.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  currentViewingEmployee = null;
}

// =======================================================
// DELETE EMPLOYEE MODAL (WITH CONFIRMATION)
// =======================================================
function setupDeleteModalListeners() {
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const backdrop = document.getElementById('deleteModalBackdrop');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDeleteModal);
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', executeEmployeeDeletion);
  }
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDeleteModal();
    });
  }
}

async function promptDeleteEmployee(empId) {
  try {
    const res = await apiGet(`/api/employees/${empId}`);
    const emp = res.employee;
    if (!emp) return;

    currentEmployeeForDelete = emp;

    document.getElementById('deleteEmpName').textContent = `${emp.first_name} ${emp.last_name}`;
    document.getElementById('deleteEmpCode').textContent = emp.employee_id;

    const backdrop = document.getElementById('deleteModalBackdrop');
    if (backdrop) backdrop.classList.add('active');

  } catch (err) {
    showToast('Could not fetch employee for deletion.', 'error');
  }
}

function closeDeleteModal() {
  const backdrop = document.getElementById('deleteModalBackdrop');
  if (backdrop) backdrop.classList.remove('active');
  currentEmployeeForDelete = null;
}

async function executeEmployeeDeletion() {
  if (!currentEmployeeForDelete) return;

  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const originalText = confirmBtn.innerHTML;

  try {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span>Deleting employee...</span>`;

    await apiDelete(`/api/employees/${currentEmployeeForDelete.id}`);

    showToast('✓ Employee deleted successfully.', 'success');
    closeDeleteModal();

    // Dynamically refresh table without full reload
    await loadAndRenderDirectory();

  } catch (err) {
    showToast(err.message || 'Failed to delete employee.', 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalText;
  }
}

// Handle URL query parameters (e.g. ?department=..., ?search=..., ?view=...)
function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const deptParam = urlParams.get('department');
  const searchParam = urlParams.get('search');
  const viewParam = urlParams.get('view');

  let shouldReload = false;

  if (deptParam) {
    const deptSelect = document.getElementById('filterDept');
    if (deptSelect) {
      deptSelect.value = deptParam;
      shouldReload = true;
    }
  }

  if (searchParam) {
    const searchInput = document.getElementById('employeeSearchInput');
    if (searchInput) {
      searchInput.value = searchParam;
      shouldReload = true;
    }
  }

  if (shouldReload) {
    loadAndRenderDirectory();
  }

  if (viewParam) {
    setTimeout(() => {
      viewEmployeeProfile(viewParam);
    }, 200);
  }
}
