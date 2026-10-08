const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'employees.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_PATH);
  }
});

// Helper for db.all
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper for db.get
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper for db.run
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Initialize database schema and initial sample records if empty
async function initDatabase() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        gender TEXT,
        date_of_birth TEXT,
        department TEXT NOT NULL,
        job_title TEXT NOT NULL,
        employment_type TEXT NOT NULL,
        joining_date TEXT NOT NULL,
        salary REAL,
        location TEXT,
        address TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        status TEXT DEFAULT 'Active',
        manager TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await dbRun(createTableSql);

  // Check if sample data needs to be seeded
  const countRow = await dbGet('SELECT COUNT(*) as count FROM employees');
  if (countRow && countRow.count === 0) {
    console.log('Database is empty. Seeding initial 8 sample corporate employees...');
    const sampleEmployees = [
      {
        employee_id: 'EMP001',
        first_name: 'Aarav',
        last_name: 'Sharma',
        email: 'aarav.sharma@peopledesk.internal',
        phone: '+91 98201 12345',
        gender: 'Male',
        date_of_birth: '1994-06-15',
        department: 'Engineering',
        job_title: 'Software Engineer',
        employment_type: 'Full Time',
        joining_date: '2023-01-15',
        salary: 1250000,
        location: 'Mumbai',
        address: '402 Palm Heights, Andheri West, Mumbai',
        emergency_contact_name: 'Ramesh Sharma',
        emergency_contact_phone: '+91 98201 54321',
        status: 'Active',
        manager: 'Vikram Sen'
      },
      {
        employee_id: 'EMP002',
        first_name: 'Priya',
        last_name: 'Patil',
        email: 'priya.patil@peopledesk.internal',
        phone: '+91 98202 23456',
        gender: 'Female',
        date_of_birth: '1996-09-22',
        department: 'Human Resources',
        job_title: 'HR Executive',
        employment_type: 'Full Time',
        joining_date: '2023-03-10',
        salary: 850000,
        location: 'Pune',
        address: '12 Silver Oak Society, Kothrud, Pune',
        emergency_contact_name: 'Sunita Patil',
        emergency_contact_phone: '+91 98202 65432',
        status: 'Active',
        manager: 'Deepa Nair'
      },
      {
        employee_id: 'EMP003',
        first_name: 'Rohan',
        last_name: 'Deshmukh',
        email: 'rohan.deshmukh@peopledesk.internal',
        phone: '+91 98203 34567',
        gender: 'Male',
        date_of_birth: '1992-11-04',
        department: 'Finance',
        job_title: 'Accountant',
        employment_type: 'Full Time',
        joining_date: '2022-08-01',
        salary: 950000,
        location: 'Mumbai',
        address: '104 Lakeview Apts, Powai, Mumbai',
        emergency_contact_name: 'Meera Deshmukh',
        emergency_contact_phone: '+91 98203 76543',
        status: 'Active',
        manager: 'Amit Sethi'
      },
      {
        employee_id: 'EMP004',
        first_name: 'Sneha',
        last_name: 'Joshi',
        email: 'sneha.joshi@peopledesk.internal',
        phone: '+91 98204 45678',
        gender: 'Female',
        date_of_birth: '1997-03-18',
        department: 'Marketing',
        job_title: 'Marketing Executive',
        employment_type: 'Full Time',
        joining_date: '2023-07-20',
        salary: 780000,
        location: 'Bengaluru',
        address: '77 Green Glen Layout, Bellandur, Bengaluru',
        emergency_contact_name: 'Ashok Joshi',
        emergency_contact_phone: '+91 98204 87654',
        status: 'On Leave',
        manager: 'Radhika Roy'
      },
      {
        employee_id: 'EMP005',
        first_name: 'Aditya',
        last_name: 'Kulkarni',
        email: 'aditya.kulkarni@peopledesk.internal',
        phone: '+91 98205 56789',
        gender: 'Male',
        date_of_birth: '1993-01-30',
        department: 'Information Technology',
        job_title: 'System Administrator',
        employment_type: 'Full Time',
        joining_date: '2021-11-15',
        salary: 1100000,
        location: 'Pune',
        address: '3B Hill Crest, Baner, Pune',
        emergency_contact_name: 'Kavita Kulkarni',
        emergency_contact_phone: '+91 98205 98765',
        status: 'Active',
        manager: 'Rajesh Gupta'
      },
      {
        employee_id: 'EMP006',
        first_name: 'Neha',
        last_name: 'Verma',
        email: 'neha.verma@peopledesk.internal',
        phone: '+91 98206 67890',
        gender: 'Female',
        date_of_birth: '1998-05-12',
        department: 'Sales',
        job_title: 'Sales Executive',
        employment_type: 'Contract',
        joining_date: '2024-02-01',
        salary: 720000,
        location: 'Delhi NCR',
        address: '501 DLF Phase 4, Gurgaon',
        emergency_contact_name: 'Sanjay Verma',
        emergency_contact_phone: '+91 98206 09876',
        status: 'Probation',
        manager: 'Tariq Siddiqui'
      },
      {
        employee_id: 'EMP007',
        first_name: 'Kunal',
        last_name: 'Shah',
        email: 'kunal.shah@peopledesk.internal',
        phone: '+91 98207 78901',
        gender: 'Male',
        date_of_birth: '1991-08-25',
        department: 'Operations',
        job_title: 'Operations Executive',
        employment_type: 'Full Time',
        joining_date: '2020-04-10',
        salary: 980000,
        location: 'Mumbai',
        address: 'Flat 20, Sea Breeze, Worli, Mumbai',
        emergency_contact_name: 'Pooja Shah',
        emergency_contact_phone: '+91 98207 10987',
        status: 'Active',
        manager: 'Alok Mehta'
      },
      {
        employee_id: 'EMP008',
        first_name: 'Ananya',
        last_name: 'Rao',
        email: 'ananya.rao@peopledesk.internal',
        phone: '+91 98208 89012',
        gender: 'Female',
        date_of_birth: '1995-12-08',
        department: 'Engineering',
        job_title: 'Software Engineer',
        employment_type: 'Full Time',
        joining_date: '2023-09-01',
        salary: 1300000,
        location: 'Hyderabad',
        address: 'Villa 14, Silicon Meadows, Gachibowli, Hyderabad',
        emergency_contact_name: 'Suresh Rao',
        emergency_contact_phone: '+91 98208 21098',
        status: 'Active',
        manager: 'Vikram Sen'
      }
    ];

    const insertSql = `
      INSERT INTO employees (
        employee_id, first_name, last_name, email, phone, gender,
        date_of_birth, department, job_title, employment_type, joining_date,
        salary, location, address, emergency_contact_name, emergency_contact_phone,
        status, manager
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const emp of sampleEmployees) {
      await dbRun(insertSql, [
        emp.employee_id,
        emp.first_name,
        emp.last_name,
        emp.email,
        emp.phone,
        emp.gender,
        emp.date_of_birth,
        emp.department,
        emp.job_title,
        emp.employment_type,
        emp.joining_date,
        emp.salary,
        emp.location,
        emp.address,
        emp.emergency_contact_name,
        emp.emergency_contact_phone,
        emp.status,
        emp.manager
      ]);
    }
    console.log('Seeded 8 initial employees successfully.');
  }
}

module.exports = {
  db,
  dbAll,
  dbGet,
  dbRun,
  initDatabase
};
