/**
 * PeopleDesk - Employee Form Management (Add & Edit Modal)
 */

let editingEmployeeId = null;

document.addEventListener('DOMContentLoaded', () => {
  setupEmployeeFormListeners();
});

function setupEmployeeFormListeners() {
  const formModal = document.getElementById('employeeFormModal');
  const form = document.getElementById('employeeForm');
  const cancelBtn = document.getElementById('cancelFormBtn');
  const closeBtn = document.getElementById('closeFormModalBtn');
  const addBtn = document.getElementById('addEmployeeBtn');

  if (addBtn) {
    addBtn.addEventListener('click', openAddEmployeeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEmployeeFormModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeEmployeeFormModal);
  }

  if (formModal) {
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeEmployeeFormModal();
    });
  }

  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

function openAddEmployeeModal() {
  editingEmployeeId = null;
  const form = document.getElementById('employeeForm');
  if (form) form.reset();

  clearFormValidationErrors();

  document.getElementById('formModalTitle').textContent = 'Add New Employee';
  document.getElementById('formSubmitBtnText').textContent = 'Create Employee';

  // Apply default values from settings
  const settings = getSettings();
  const locInput = document.getElementById('formLocation');
  const statusInput = document.getElementById('formStatus');
  const joinDateInput = document.getElementById('formJoiningDate');

  if (locInput) locInput.value = settings.defaultLocation || 'Mumbai';
  if (statusInput) statusInput.value = settings.defaultStatus || 'Active';
  if (joinDateInput && !joinDateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    joinDateInput.value = today;
  }

  const modal = document.getElementById('employeeFormModal');
  if (modal) modal.classList.add('active');
}

async function openEditEmployeeModal(empId) {
  try {
    const res = await apiGet(`/api/employees/${empId}`);
    const emp = res.employee;
    if (!emp) {
      showToast('Employee not found.', 'error');
      return;
    }

    editingEmployeeId = emp.id;
    clearFormValidationErrors();

    document.getElementById('formModalTitle').textContent = `Edit Employee: ${emp.first_name} ${emp.last_name}`;
    document.getElementById('formSubmitBtnText').textContent = 'Update Employee';

    // Populate Fields
    document.getElementById('formFirstName').value = emp.first_name || '';
    document.getElementById('formLastName').value = emp.last_name || '';
    document.getElementById('formGender').value = emp.gender || '';
    document.getElementById('formDob').value = emp.date_of_birth || '';

    document.getElementById('formEmployeeId').value = emp.employee_id || '';
    document.getElementById('formDepartment').value = emp.department || '';
    document.getElementById('formJobTitle').value = emp.job_title || '';
    document.getElementById('formEmploymentType').value = emp.employment_type || 'Full Time';
    document.getElementById('formManager').value = emp.manager || '';
    document.getElementById('formJoiningDate').value = emp.joining_date || '';
    document.getElementById('formLocation').value = emp.location || '';

    document.getElementById('formEmail').value = emp.email || '';
    document.getElementById('formPhone').value = emp.phone || '';
    document.getElementById('formAddress').value = emp.address || '';

    document.getElementById('formEmergencyName').value = emp.emergency_contact_name || '';
    document.getElementById('formEmergencyPhone').value = emp.emergency_contact_phone || '';

    document.getElementById('formSalary').value = emp.salary !== undefined && emp.salary !== null ? emp.salary : '';
    document.getElementById('formStatus').value = emp.status || 'Active';

    const modal = document.getElementById('employeeFormModal');
    if (modal) modal.classList.add('active');

  } catch (err) {
    showToast('Failed to load employee for editing.', 'error');
  }
}

function closeEmployeeFormModal() {
  const modal = document.getElementById('employeeFormModal');
  if (modal) modal.classList.remove('active');
  editingEmployeeId = null;
  clearFormValidationErrors();
}

function clearFormValidationErrors() {
  const errorElements = document.querySelectorAll('.form-error-feedback');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });

  const formGroups = document.querySelectorAll('.form-group.has-error');
  formGroups.forEach(fg => fg.classList.remove('has-error'));
}

function setFieldError(fieldId, errorMsg) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  const parent = input.closest('.form-group');
  if (parent) {
    parent.classList.add('has-error');
    const feedback = parent.querySelector('.form-error-feedback');
    if (feedback) {
      feedback.textContent = errorMsg;
      feedback.style.display = 'block';
    }
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  clearFormValidationErrors();

  const submitBtn = document.getElementById('formSubmitBtn');
  const submitText = document.getElementById('formSubmitBtnText');
  const originalLabel = submitText.textContent;

  // Gather Form Values
  const payload = {
    first_name: document.getElementById('formFirstName').value.trim(),
    last_name: document.getElementById('formLastName').value.trim(),
    gender: document.getElementById('formGender').value.trim(),
    date_of_birth: document.getElementById('formDob').value.trim() || null,

    employee_id: document.getElementById('formEmployeeId').value.trim(),
    department: document.getElementById('formDepartment').value.trim(),
    job_title: document.getElementById('formJobTitle').value.trim(),
    employment_type: document.getElementById('formEmploymentType').value.trim(),
    manager: document.getElementById('formManager').value.trim(),
    joining_date: document.getElementById('formJoiningDate').value.trim(),
    location: document.getElementById('formLocation').value.trim(),

    email: document.getElementById('formEmail').value.trim(),
    phone: document.getElementById('formPhone').value.trim(),
    address: document.getElementById('formAddress').value.trim(),

    emergency_contact_name: document.getElementById('formEmergencyName').value.trim(),
    emergency_contact_phone: document.getElementById('formEmergencyPhone').value.trim(),

    salary: document.getElementById('formSalary').value.trim() ? parseFloat(document.getElementById('formSalary').value) : 0,
    status: document.getElementById('formStatus').value.trim()
  };

  // Client-Side Pre-Validation
  let hasErrors = false;

  // Employee ID format validation
  if (!payload.employee_id) {
    setFieldError('formEmployeeId', 'Employee ID is required.');
    hasErrors = true;
  } else if (!/^[A-Za-z0-9\-_]{3,20}$/.test(payload.employee_id)) {
    setFieldError('formEmployeeId', 'Invalid Employee ID format. Use alphanumeric characters and hyphens (e.g. EMP001, RBU-EMP-001).');
    hasErrors = true;
  }

  if (!payload.first_name) {
    setFieldError('formFirstName', 'First name is required.');
    hasErrors = true;
  }

  if (!payload.last_name) {
    setFieldError('formLastName', 'Last name is required.');
    hasErrors = true;
  }

  if (!payload.email) {
    setFieldError('formEmail', 'Email address is required.');
    hasErrors = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    setFieldError('formEmail', 'Enter a valid corporate email address.');
    hasErrors = true;
  }

  if (!payload.phone) {
    setFieldError('formPhone', 'Phone number is required.');
    hasErrors = true;
  } else if (!/^[\+0-9\-\s\(\)]{7,25}$/.test(payload.phone)) {
    setFieldError('formPhone', 'Enter a valid phone number (min 7 digits).');
    hasErrors = true;
  }

  if (!payload.department) {
    setFieldError('formDepartment', 'Please select a department.');
    hasErrors = true;
  }

  if (!payload.job_title) {
    setFieldError('formJobTitle', 'Job title is required.');
    hasErrors = true;
  }

  if (!payload.employment_type) {
    setFieldError('formEmploymentType', 'Please select an employment type.');
    hasErrors = true;
  }

  if (!payload.joining_date) {
    setFieldError('formJoiningDate', 'Joining date is required.');
    hasErrors = true;
  }

  if (hasErrors) {
    showToast('Please correct the highlighted form errors.', 'warning');
    return;
  }

  // Prevent double submissions and show loading state
  try {
    submitBtn.disabled = true;
    submitText.textContent = editingEmployeeId ? 'Updating employee...' : 'Creating employee...';

    let res;
    if (editingEmployeeId) {
      res = await apiPut(`/api/employees/${editingEmployeeId}`, payload);
      showToast('✓ Employee updated successfully.', 'success');
    } else {
      res = await apiPost('/api/employees', payload);
      showToast('✓ Employee created successfully.', 'success');
    }

    closeEmployeeFormModal();

    // Refresh directory if on employees page
    if (typeof loadAndRenderDirectory === 'function') {
      await loadAndRenderDirectory();
    }

    // Refresh profile drawer if open
    if (typeof currentViewingEmployee !== 'undefined' && currentViewingEmployee && currentViewingEmployee.id === editingEmployeeId) {
      if (typeof viewEmployeeProfile === 'function') {
        viewEmployeeProfile(editingEmployeeId);
      }
    }

  } catch (err) {
    console.error('Submission error:', err);
    if (err.status === 409 || (err.message && err.message.includes('already exists'))) {
      setFieldError('formEmployeeId', 'Employee ID already exists.');
      showToast('⚠ Employee ID already exists.', 'warning');
    } else if (err.status === 400) {
      showToast(err.message || 'Invalid input data.', 'error');
    } else {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitText.textContent = originalLabel;
  }
}
