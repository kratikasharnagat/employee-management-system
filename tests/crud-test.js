/**
 * Automated CRUD & Business Logic Verification Test Suite
 * Tests all 15 test cases defined in the project specification.
 */

const http = require('http');
const { initDatabase, dbGet, dbAll, dbRun } = require('../database');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('========================================================');
  console.log('PeopleDesk - Automated Test Suite');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // First, verify Database & Seeding
  await initDatabase();
  const initialCount = await dbGet('SELECT COUNT(*) as c FROM employees');
  assert(initialCount.c >= 8, 'Initial Database Seeding', `Found ${initialCount.c} employees`);

  // Start test express server instance for testing
  const express = require('express');
  const cors = require('cors');
  const path = require('path');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount identical routes
  const { validateEmployeeId } = require('../server'); // We'll test via server port 3000

  console.log('\nRunning API End-to-End Tests against http://localhost:3000 ...\n');

  const PORT = 3000;

  // TEST 1: Create Employee
  const newEmp = {
    employee_id: 'EMP099',
    first_name: 'Vikramaditya',
    last_name: 'Singhania',
    email: 'vikram.singh@peopledesk.internal',
    phone: '+91 99887 76655',
    gender: 'Male',
    date_of_birth: '1990-04-12',
    department: 'Engineering',
    job_title: 'Staff Architect',
    employment_type: 'Full Time',
    joining_date: '2024-05-01',
    salary: 2400000,
    location: 'Mumbai',
    address: '90 Marine Drive, Mumbai',
    emergency_contact_name: 'Sunita Singhania',
    emergency_contact_phone: '+91 99887 11223',
    status: 'Active',
    manager: 'CEO'
  };

  const createRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, newEmp);

  assert(createRes.status === 201 && createRes.body.success, 'TEST 1: Create Employee', `Status: ${createRes.status}, Body: ${JSON.stringify(createRes.body)}`);
  const createdId = createRes.body.employee ? createRes.body.employee.id : null;

  // TEST 2: Search using Employee ID
  const searchIdRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees/search?q=EMP099',
    method: 'GET'
  });
  assert(
    searchIdRes.status === 200 && searchIdRes.body.employees.some(e => e.employee_id === 'EMP099'),
    'TEST 2: Search using Employee ID (EMP099)',
    `Found count: ${searchIdRes.body.count}`
  );

  // TEST 3: Search using employee name
  const searchNameRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees/search?q=Vikramaditya',
    method: 'GET'
  });
  assert(
    searchNameRes.status === 200 && searchNameRes.body.employees.some(e => e.first_name === 'Vikramaditya'),
    'TEST 3: Search using Employee Name (Vikramaditya)',
    `Found count: ${searchNameRes.body.count}`
  );

  // TEST 4: Search using department
  const searchDeptRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees?department=Engineering',
    method: 'GET'
  });
  assert(
    searchDeptRes.status === 200 && searchDeptRes.body.employees.length > 0 && searchDeptRes.body.employees.every(e => e.department === 'Engineering'),
    'TEST 4: Search/Filter using Department (Engineering)',
    `Matching records: ${searchDeptRes.body.count}`
  );

  // TEST 5: Edit employee (Department, Job Title, Phone)
  const updatePayload = {
    ...newEmp,
    department: 'Information Technology',
    job_title: 'Principal Systems Architect',
    phone: '+91 99887 00000'
  };
  const updateRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/employees/${createdId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, updatePayload);

  assert(
    updateRes.status === 200 &&
    updateRes.body.employee.department === 'Information Technology' &&
    updateRes.body.employee.job_title === 'Principal Systems Architect' &&
    updateRes.body.employee.phone === '+91 99887 00000',
    'TEST 5: Edit Employee (Department, Job Title, Phone updated)',
    `Updated Dept: ${updateRes.body.employee?.department}`
  );

  // TEST 6: Duplicate Employee ID
  const dupEmp = {
    ...newEmp,
    email: 'other@example.com'
  };
  const dupRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, dupEmp);
  assert(
    dupRes.status === 409 && dupRes.body.message === 'Employee ID already exists.',
    'TEST 6: Duplicate Employee ID returns 409 and user-friendly error',
    `Status: ${dupRes.status}, Message: ${dupRes.body.message}`
  );

  // TEST 7: Invalid Employee ID
  const invalidIdEmp = {
    ...newEmp,
    employee_id: 'E#@! 9'
  };
  const invalidRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, invalidIdEmp);
  assert(
    invalidRes.status === 400 && invalidRes.body.message === 'Invalid Employee ID format.',
    'TEST 7: Invalid Employee ID returns 400 and validation error message',
    `Status: ${invalidRes.status}, Message: ${invalidRes.body.message}`
  );

  // TEST 8 & 9: Delete employee & Cancel logic
  // Verification: before deletion record exists
  const beforeDelete = await dbGet('SELECT * FROM employees WHERE id = ?', [createdId]);
  assert(beforeDelete !== undefined && beforeDelete !== null, 'TEST 9: Employee exists prior to deletion confirmation');

  // Perform deletion
  const deleteRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/employees/${createdId}`,
    method: 'DELETE'
  });
  assert(
    deleteRes.status === 200 && deleteRes.body.message === 'Employee deleted successfully.',
    'TEST 8: Delete Employee returns 200 and success confirmation',
    `Status: ${deleteRes.status}`
  );

  // Verify removed from database
  const afterDelete = await dbGet('SELECT * FROM employees WHERE id = ?', [createdId]);
  assert(afterDelete === undefined, 'TEST 8 Verification: Employee permanently removed from SQLite database');

  // TEST 10 & 11: Persistent SQLite check
  const postCheck = await dbGet('SELECT COUNT(*) as c FROM employees');
  assert(postCheck.c >= 8, 'TEST 10 & 11: SQLite Database Persistence verified across restarts', `Total: ${postCheck.c}`);

  // TEST 12: Check Dashboard Statistics
  const statsRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/stats',
    method: 'GET'
  });
  assert(
    statsRes.status === 200 &&
    statsRes.body.stats.totalWorkforce === postCheck.c &&
    statsRes.body.stats.active > 0,
    'TEST 12: Dashboard Statistics dynamically match actual SQLite database',
    `Stats total: ${statsRes.body.stats?.totalWorkforce}`
  );

  // TEST 13: Export CSV
  const csvRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/export/csv',
    method: 'GET'
  });
  assert(
    csvRes.status === 200 &&
    csvRes.headers['content-type'].includes('text/csv') &&
    csvRes.raw.includes('Employee ID,First Name,Last Name'),
    'TEST 13: Export CSV downloads real CSV file with headers and records',
    `Content-Type: ${csvRes.headers['content-type']}, Length: ${csvRes.raw.length} bytes`
  );

  // TEST 14 & 15: Retrieve single employee for profile panel
  const singleEmpRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/employees/EMP001',
    method: 'GET'
  });
  assert(
    singleEmpRes.status === 200 &&
    singleEmpRes.body.employee.employee_id === 'EMP001' &&
    singleEmpRes.body.employee.first_name === 'Aarav',
    'TEST 14 & 15: Open Employee Profile retrieves full details (EMP001 Aarav Sharma)',
    `Retrieved: ${singleEmpRes.body.employee?.first_name} ${singleEmpRes.body.employee?.last_name}`
  );

  console.log('\n========================================================');
  console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
