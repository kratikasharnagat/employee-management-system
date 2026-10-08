const express = require('express');
const cors = require('cors');
const path = require('path');
const { dbAll, dbGet, dbRun, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Helper for Employee ID validation
function validateEmployeeId(id) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    return { valid: false, message: 'Employee ID is required.' };
  }
  const trimmed = id.trim();
  // Standard corporate format: alphanumeric, hyphens, underscores (3 to 20 chars)
  // Accepts e.g. EMP001, EMP-001, RBU-EMP-001, TECH_102
  const idRegex = /^[A-Za-z0-9\-_]{3,20}$/;
  if (!idRegex.test(trimmed)) {
    return { valid: false, message: 'Invalid Employee ID format.' };
  }
  return { valid: true, value: trimmed };
}

// Helper for email validation
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Helper for phone validation
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[\+0-9\-\s\(\)]{7,25}$/;
  return phoneRegex.test(phone.trim());
}

// Helper for date validation (YYYY-MM-DD)
function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

// ==========================================
// REST API ROUTES
// ==========================================

// GET /api/stats - Dashboard KPIs & breakdown
app.get('/api/stats', async (req, res) => {
  try {
    const totalRow = await dbGet('SELECT COUNT(*) as count FROM employees');
    const total = totalRow ? totalRow.count : 0;

    const activeRow = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'");
    const leaveRow = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'On Leave'");
    const probationRow = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'Probation'");
    const inactiveRow = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'Inactive'");

    const deptRows = await dbAll(`
      SELECT department, COUNT(*) as count 
      FROM employees 
      GROUP BY department 
      ORDER BY count DESC
    `);

    const typeRows = await dbAll(`
      SELECT employment_type, COUNT(*) as count 
      FROM employees 
      GROUP BY employment_type 
      ORDER BY count DESC
    `);

    const recentHires = await dbAll(`
      SELECT id, employee_id, first_name, last_name, email, department, job_title, joining_date, status, location
      FROM employees 
      ORDER BY joining_date DESC, id DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalWorkforce: total,
        active: activeRow ? activeRow.count : 0,
        onLeave: leaveRow ? leaveRow.count : 0,
        probation: probationRow ? probationRow.count : 0,
        inactive: inactiveRow ? inactiveRow.count : 0,
        departments: deptRows,
        employmentTypes: typeRows,
        recentHires
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve stats.' });
  }
});

// GET /api/departments - Organizational overview
app.get('/api/departments', async (req, res) => {
  try {
    const standardDepts = [
      'Engineering',
      'Human Resources',
      'Finance',
      'Information Technology',
      'Sales',
      'Marketing',
      'Operations',
      'Customer Support',
      'Administration'
    ];

    const statsRows = await dbAll(`
      SELECT 
        department, 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count,
        GROUP_CONCAT(DISTINCT manager) as managers
      FROM employees 
      GROUP BY department
    `);

    const statsMap = {};
    for (const row of statsRows) {
      statsMap[row.department] = row;
    }

    const allDepts = Array.from(new Set([...standardDepts, ...Object.keys(statsMap)]));

    const departments = allDepts.map(deptName => {
      const data = statsMap[deptName];
      const count = data ? data.total_count : 0;
      const active = data ? (data.active_count || 0) : 0;
      
      let lead = 'Unassigned';
      if (data && data.managers) {
        const mgrs = data.managers.split(',').map(m => m.trim()).filter(Boolean);
        if (mgrs.length > 0) lead = mgrs[0];
      }

      return {
        name: deptName,
        employee_count: count,
        active_count: active,
        lead: lead
      };
    });

    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve departments.' });
  }
});

// GET /api/employees/search?q=
app.get('/api/employees/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const searchPattern = `%${query}%`;
    const sql = `
      SELECT * FROM employees 
      WHERE employee_id LIKE ? 
         OR first_name LIKE ? 
         OR last_name LIKE ? 
         OR (first_name || ' ' || last_name) LIKE ? 
         OR email LIKE ? 
         OR department LIKE ? 
         OR job_title LIKE ? 
         OR location LIKE ?
      ORDER BY id DESC
    `;

    const employees = await dbAll(sql, [
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    ]);

    res.json({ success: true, employees, count: employees.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to search employees.' });
  }
});

// GET /api/employees - List with filtering
app.get('/api/employees', async (req, res) => {
  try {
    const { department, role, status, location, employment_type, search, sort } = req.query;

    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (department && department !== 'All') {
      sql += ' AND department = ?';
      params.push(department);
    }

    if (role && role !== 'All') {
      sql += ' AND job_title = ?';
      params.push(role);
    }

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (location && location !== 'All') {
      sql += ' AND location = ?';
      params.push(location);
    }

    if (employment_type && employment_type !== 'All') {
      sql += ' AND employment_type = ?';
      params.push(employment_type);
    }

    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      sql += ` AND (
        employee_id LIKE ? 
        OR first_name LIKE ? 
        OR last_name LIKE ? 
        OR (first_name || ' ' || last_name) LIKE ? 
        OR email LIKE ? 
        OR department LIKE ? 
        OR job_title LIKE ? 
        OR location LIKE ?
      )`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    // Sorting
    switch (sort) {
      case 'name_asc':
        sql += ' ORDER BY first_name ASC, last_name ASC';
        break;
      case 'name_desc':
        sql += ' ORDER BY first_name DESC, last_name DESC';
        break;
      case 'date_asc':
        sql += ' ORDER BY joining_date ASC, id ASC';
        break;
      case 'date_desc':
        sql += ' ORDER BY joining_date DESC, id DESC';
        break;
      case 'id_desc':
        sql += ' ORDER BY employee_id DESC';
        break;
      case 'id_asc':
        sql += ' ORDER BY employee_id ASC';
        break;
      default:
        sql += ' ORDER BY id DESC';
        break;
    }

    const employees = await dbAll(sql, params);
    res.json({ success: true, employees, count: employees.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve employees.' });
  }
});

// GET /api/employees/:id - Retrieve single employee
app.get('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let employee = null;

    if (/^\d+$/.test(id)) {
      employee = await dbGet('SELECT * FROM employees WHERE id = ?', [Number(id)]);
    }
    if (!employee) {
      employee = await dbGet('SELECT * FROM employees WHERE employee_id = ?', [id]);
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({ success: true, employee });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve employee.' });
  }
});

// POST /api/employees - Create new employee
app.post('/api/employees', async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      gender,
      date_of_birth,
      department,
      job_title,
      employment_type,
      joining_date,
      salary,
      location,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      status,
      manager
    } = req.body;

    // Validate Employee ID
    const idValidation = validateEmployeeId(employee_id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, message: idValidation.message });
    }
    const cleanId = idValidation.value;

    // Check duplicate Employee ID
    const existing = await dbGet('SELECT id FROM employees WHERE employee_id = ?', [cleanId]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    }

    // Validate required fields
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required.' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ success: false, message: 'Last name is required.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ success: false, message: 'A valid phone number is required.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }
    if (!job_title || !job_title.trim()) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }
    if (!employment_type || !employment_type.trim()) {
      return res.status(400).json({ success: false, message: 'Employment type is required.' });
    }
    if (!joining_date || !validateDate(joining_date)) {
      return res.status(400).json({ success: false, message: 'Valid joining date (YYYY-MM-DD) is required.' });
    }

    // Optional date of birth validation
    if (date_of_birth && !validateDate(date_of_birth)) {
      return res.status(400).json({ success: false, message: 'Valid date of birth (YYYY-MM-DD) is required.' });
    }

    const cleanSalary = salary !== undefined && salary !== null && salary !== '' ? Number(salary) : 0;
    const cleanStatus = ['Active', 'On Leave', 'Probation', 'Inactive'].includes(status) ? status : 'Active';

    const insertSql = `
      INSERT INTO employees (
        employee_id, first_name, last_name, email, phone, gender,
        date_of_birth, department, job_title, employment_type, joining_date,
        salary, location, address, emergency_contact_name, emergency_contact_phone,
        status, manager
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await dbRun(insertSql, [
      cleanId,
      first_name.trim(),
      last_name.trim(),
      email.trim(),
      phone.trim(),
      (gender || '').trim(),
      date_of_birth || null,
      department.trim(),
      job_title.trim(),
      employment_type.trim(),
      joining_date.trim(),
      isNaN(cleanSalary) ? 0 : cleanSalary,
      (location || '').trim(),
      (address || '').trim(),
      (emergency_contact_name || '').trim(),
      (emergency_contact_phone || '').trim(),
      cleanStatus,
      (manager || '').trim()
    ]);

    const createdEmployee = await dbGet('SELECT * FROM employees WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: createdEmployee
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create employee.' });
  }
});

// PUT /api/employees/:id - Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let employee = null;

    if (/^\d+$/.test(id)) {
      employee = await dbGet('SELECT * FROM employees WHERE id = ?', [Number(id)]);
    }
    if (!employee) {
      employee = await dbGet('SELECT * FROM employees WHERE employee_id = ?', [id]);
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      gender,
      date_of_birth,
      department,
      job_title,
      employment_type,
      joining_date,
      salary,
      location,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      status,
      manager
    } = req.body;

    // Validate Employee ID
    const targetId = employee_id !== undefined ? employee_id : employee.employee_id;
    const idValidation = validateEmployeeId(targetId);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, message: idValidation.message });
    }
    const cleanId = idValidation.value;

    // Check duplicate ID against other records
    const duplicateCheck = await dbGet(
      'SELECT id FROM employees WHERE employee_id = ? AND id != ?',
      [cleanId, employee.id]
    );
    if (duplicateCheck) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    }

    // Validate fields
    const fName = first_name !== undefined ? first_name.trim() : employee.first_name;
    const lName = last_name !== undefined ? last_name.trim() : employee.last_name;
    const mail = email !== undefined ? email.trim() : employee.email;
    const tel = phone !== undefined ? phone.trim() : employee.phone;
    const dept = department !== undefined ? department.trim() : employee.department;
    const title = job_title !== undefined ? job_title.trim() : employee.job_title;
    const empType = employment_type !== undefined ? employment_type.trim() : employee.employment_type;
    const joinDate = joining_date !== undefined ? joining_date.trim() : employee.joining_date;

    if (!fName) return res.status(400).json({ success: false, message: 'First name is required.' });
    if (!lName) return res.status(400).json({ success: false, message: 'Last name is required.' });
    if (!validateEmail(mail)) return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    if (!validatePhone(tel)) return res.status(400).json({ success: false, message: 'A valid phone number is required.' });
    if (!dept) return res.status(400).json({ success: false, message: 'Department is required.' });
    if (!title) return res.status(400).json({ success: false, message: 'Job title is required.' });
    if (!empType) return res.status(400).json({ success: false, message: 'Employment type is required.' });
    if (!joinDate || !validateDate(joinDate)) {
      return res.status(400).json({ success: false, message: 'Valid joining date (YYYY-MM-DD) is required.' });
    }

    const dob = date_of_birth !== undefined ? date_of_birth : employee.date_of_birth;
    if (dob && !validateDate(dob)) {
      return res.status(400).json({ success: false, message: 'Valid date of birth (YYYY-MM-DD) is required.' });
    }

    const cleanSalary = salary !== undefined && salary !== null && salary !== '' ? Number(salary) : employee.salary;
    const reqStatus = status !== undefined ? status : employee.status;
    const cleanStatus = ['Active', 'On Leave', 'Probation', 'Inactive'].includes(reqStatus) ? reqStatus : 'Active';

    const updateSql = `
      UPDATE employees SET
        employee_id = ?,
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        gender = ?,
        date_of_birth = ?,
        department = ?,
        job_title = ?,
        employment_type = ?,
        joining_date = ?,
        salary = ?,
        location = ?,
        address = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        status = ?,
        manager = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await dbRun(updateSql, [
      cleanId,
      fName,
      lName,
      mail,
      tel,
      gender !== undefined ? (gender || '').trim() : employee.gender,
      dob || null,
      dept,
      title,
      empType,
      joinDate,
      isNaN(cleanSalary) ? 0 : cleanSalary,
      location !== undefined ? (location || '').trim() : employee.location,
      address !== undefined ? (address || '').trim() : employee.address,
      emergency_contact_name !== undefined ? (emergency_contact_name || '').trim() : employee.emergency_contact_name,
      emergency_contact_phone !== undefined ? (emergency_contact_phone || '').trim() : employee.emergency_contact_phone,
      cleanStatus,
      manager !== undefined ? (manager || '').trim() : employee.manager,
      employee.id
    ]);

    const updatedEmployee = await dbGet('SELECT * FROM employees WHERE id = ?', [employee.id]);

    res.json({
      success: true,
      message: 'Employee updated successfully.',
      employee: updatedEmployee
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update employee.' });
  }
});

// DELETE /api/employees/:id - Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let employee = null;

    if (/^\d+$/.test(id)) {
      employee = await dbGet('SELECT * FROM employees WHERE id = ?', [Number(id)]);
    }
    if (!employee) {
      employee = await dbGet('SELECT * FROM employees WHERE employee_id = ?', [id]);
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await dbRun('DELETE FROM employees WHERE id = ?', [employee.id]);

    res.json({
      success: true,
      message: 'Employee deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete employee.' });
  }
});

// GET /api/export/csv - Download full employee directory as CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    const employees = await dbAll('SELECT * FROM employees ORDER BY employee_id ASC');
    
    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Gender',
      'Date of Birth',
      'Department',
      'Job Title',
      'Employment Type',
      'Joining Date',
      'Salary (INR)',
      'Location',
      'Address',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Status',
      'Manager'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = headers.join(',') + '\r\n';

    for (const e of employees) {
      const row = [
        escapeCsv(e.employee_id),
        escapeCsv(e.first_name),
        escapeCsv(e.last_name),
        escapeCsv(e.email),
        escapeCsv(e.phone),
        escapeCsv(e.gender),
        escapeCsv(e.date_of_birth),
        escapeCsv(e.department),
        escapeCsv(e.job_title),
        escapeCsv(e.employment_type),
        escapeCsv(e.joining_date),
        escapeCsv(e.salary),
        escapeCsv(e.location),
        escapeCsv(e.address),
        escapeCsv(e.emergency_contact_name),
        escapeCsv(e.emergency_contact_phone),
        escapeCsv(e.status),
        escapeCsv(e.manager)
      ];
      csvContent += row.join(',') + '\r\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="peopledesk_workforce_export.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
  }
});

// Fallback for HTML5 direct file routes and 404 API calls
app.use((req, res) => {
  // If it's an API request that wasn't handled
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  // Otherwise serve index.html for client-side routing
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server after initializing DB
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`PeopleDesk Server is running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Database initialization error:', err);
  process.exit(1);
});
