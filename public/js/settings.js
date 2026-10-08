/**
 * PeopleDesk - Application Settings Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  loadCurrentSettings();
  setupSettingsForm();
});

function loadCurrentSettings() {
  const settings = getSettings();

  document.getElementById('settingCompanyName').value = settings.companyName || '';
  document.getElementById('settingAdminName').value = settings.adminName || '';
  document.getElementById('settingDefaultLocation').value = settings.defaultLocation || 'Mumbai';
  document.getElementById('settingFinancialYear').value = settings.financialYear || '2026 - 2027';
  document.getElementById('settingDefaultStatus').value = settings.defaultStatus || 'Active';
}

function setupSettingsForm() {
  const form = document.getElementById('settingsForm');
  const resetBtn = document.getElementById('resetSettingsBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newSettings = {
        companyName: document.getElementById('settingCompanyName').value.trim() || 'PeopleDesk Technologies Inc.',
        adminName: document.getElementById('settingAdminName').value.trim() || 'Administrator',
        defaultLocation: document.getElementById('settingDefaultLocation').value.trim() || 'Mumbai',
        financialYear: document.getElementById('settingFinancialYear').value.trim() || '2026 - 2027',
        defaultStatus: document.getElementById('settingDefaultStatus').value.trim() || 'Active'
      };

      saveSettings(newSettings);

      // Update Nav profile badge
      const adminLabel = document.getElementById('navAdminName');
      if (adminLabel) adminLabel.textContent = newSettings.adminName;

      showToast('✓ Settings updated successfully.', 'success');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset application settings to corporate defaults?')) {
        saveSettings(DEFAULT_SETTINGS);
        loadCurrentSettings();

        const adminLabel = document.getElementById('navAdminName');
        if (adminLabel) adminLabel.textContent = DEFAULT_SETTINGS.adminName;

        showToast('✓ Settings reset to defaults.', 'info');
      }
    });
  }
}
