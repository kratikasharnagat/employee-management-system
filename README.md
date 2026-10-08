# PeopleDesk - Employee Operations & Workforce Management Platform

A complete, high-performance, standalone corporate Human Resources and Workforce Operations platform designed for modern internal enterprise operations. Built with a clean **Corporate HR / Workforce Operations** visual design concept (dark charcoal header, white/light-gray workspace, vibrant coral accents, initials-based avatars, compact KPI strips, and a right-side profile slide-in panel).

---

## 🏢 Project Overview

- **Application Title:** PeopleDesk
- **Subtitle:** Employee Operations & Workforce Management
- **Project Directory:** `employee-management-system`
- **Application URL:** [http://localhost:3000](http://localhost:3000)
- **Database:** Persistent SQLite (`employees.db`)

Unlike standard academic student systems or booking dashboards, **PeopleDesk** provides a specialized corporate experience tailored for HR Administrators, People Operations teams, and Department Leads.

---

## 🎨 Visual Design Concept

- **Top Navigation Bar:** Dark charcoal (`#202124`) with quick search, notification alerts, and active HR Administrator profile chip.
- **Workspace Background:** Clean off-white / light gray canvas (`#F4F4F1`).
- **Brand Accents:** Corporate coral (`#FF6B35`) with deep coral hover states (`#E85D04`).
- **Card Backgrounds & Borders:** Clean white cards (`#FFFFFF`) with subtle borders (`#E5E5E5`) and 8px–14px rounded corners.
- **Status Indicator Badges:**
  - **Active:** Green (`#10B981` dot, `#D1FAE5` background)
  - **On Leave:** Orange (`#F97316` dot, `#FFEDD5` background)
  - **Probation:** Purple (`#8B5CF6` dot, `#EDE9FE` background)
  - **Inactive:** Red (`#EF4444` dot, `#FEE2E2` background)
- **Initials Avatars:** Algorithmic color-coded initials avatars for every team member.
- **Interactive Slide-in Drawer:** Right-side profile drawer for instant employee review without full page navigation.

---

## ✨ Key Features

### 1. Executive Workforce Overview
- **Horizontal KPI Strip:** Real-time metrics computed directly from SQLite:
  - Total Workforce Headcount
  - Active Operating Personnel
  - Staff On Leave
  - New Hire Probation Count
  - Archived / Inactive Records
- **Workforce Distribution:** Departmental proportional volume with horizontal distribution meters.
- **Operational Status Gauge:** Live capacity split with breakdown percentages.
- **Recent Hires Feed:** Latest 5 employee additions with quick link to profile.
- **Department Snapshot:** Dynamic department volume indicators.

### 2. High-Density Employee Directory
- **Multi-Filter Engine:** Combined live filtering by Department, Job Role, Employment Status, Base Location, and Keyword Search.
- **Multi-Field Dynamic Search:** Instantly matches Employee ID, First Name, Last Name, Full Name, Email, Department, Job Title, and Location.
- **Customizable Sorting:** Sort by Newest First, Oldest First, Name (A–Z, Z–A), or Joining Date.
- **Initials Avatar Engine:** Clean, generated circular initials with color hashing.

### 3. Comprehensive Employee Profile Drawer
- Slides in smoothly from the right with a background blur backdrop.
- Full details breakdown across:
  - **Contact Information:** Work Email, Phone Number, Location, Residential Address.
  - **Work Information:** Department, Manager / Lead, Employment Type, Joining Date.
  - **Personal Details:** Gender, Date of Birth.
  - **Emergency Contact:** Guardian/Contact Name and Phone.
  - **Compensation:** Formatted Annual CTC in INR (`₹`).
- Direct actions: Edit Employee, Delete Employee, or Close.

### 4. Corporate Two-Column Add & Edit Modal
- Structured form divided into **Personal**, **Work**, **Contact**, **Emergency Contact**, and **Compensation & Status**.
- **Mandatory Employee ID Validation:** Format validation (`EMP001`, `RBU-EMP-001`, etc.), uniqueness enforcement in SQLite, and duplicate ID prevention with user-friendly error banners.
- Loading states during creation and updates to prevent double submissions.

### 5. Safe Delete Confirmation Modal
- Two-step deletion verification dialog displaying the target employee's full name and Employee ID.
- Confirmation deletes permanently from SQLite and immediately refreshes tables without full page reloads.

### 6. Departments Organizational Blocks
- Visual organizational units showcasing:
  - Department Name
  - Headcount Badge
  - Reporting Lead / Manager
  - Active vs. Off-Duty Staff Breakdown
- Clicking any department automatically opens the Employee Directory pre-filtered to that division.

### 7. Workforce Operations Reports & Exports
- Real-time tabular breakdowns by Department, Employment Type, Status, and Recent Hires.
- **Export CSV Button:** Generates and triggers download of a full RFC4180-compliant `.csv` file with complete workforce records.
- **Print Report Button:** Triggers browser print dialog optimized with `@media print` styling (hiding navigation and extraneous controls).

### 8. System Preferences & Settings
- Configure Organization Name, HR Administrator Name, Default Onboarding Location, Financial Year, and Default Employment Status.
- Persisted locally with instant updates to the navigation bar.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+) — zero frontend framework dependencies for maximum performance.
- **Backend:** Node.js & Express.js.
- **Database:** SQLite3 (`employees.db`) via `sqlite3` driver with parameterized queries.
- **Dependencies:** `express`, `sqlite3`, `cors` (minimal footprint).

---

## 🗄️ Database Architecture

File: `employees.db`  
Table: `employees`

```sql
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
```

### Initial Seed Data
On first launch, if the database table is empty, 8 realistic corporate records are seeded (`EMP001` through `EMP008`). Re-starting the server checks the existing row count and **never** creates duplicate sample records.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Aggregated KPIs, department distribution, status split, recent hires |
| `GET` | `/api/departments` | Department units with member counts and leads |
| `GET` | `/api/employees` | Filterable and sortable employee list (`?department=`, `?role=`, `?status=`, `?location=`, `?search=`, `?sort=`) |
| `GET` | `/api/employees/search?q=` | Dynamic keyword search |
| `GET` | `/api/employees/:id` | Retrieve single employee by ID or `employee_id` |
| `POST` | `/api/employees` | Create employee (with full backend validation) |
| `PUT` | `/api/employees/:id` | Update employee record (with duplicate ID validation) |
| `DELETE`| `/api/employees/:id` | Delete employee record permanently |
| `GET` | `/api/export/csv` | Download full workforce directory as CSV file |

---

## 📁 File Structure

```text
employee-management-system/
├── package.json
├── package-lock.json
├── server.js               # Express application server and REST endpoints
├── database.js             # SQLite3 schema definition, seeding, and async helpers
├── employees.db            # Persistent SQLite database file
├── README.md               # Project documentation
├── tests/
│   └── crud-test.js        # Comprehensive automated verification suite
└── public/
    ├── index.html          # Overview Dashboard & KPI strip
    ├── employees.html      # Employee Directory & Profile Drawer
    ├── departments.html    # Organizational Blocks
    ├── reports.html        # Workforce Reports, CSV Export, Print View
    ├── settings.html       # Corporate Preferences
    ├── css/
    │   └── style.css       # Unified corporate design system & responsive layout
    └── js/
        ├── app.js          # Shared toast system, avatars, API client, nav handlers
        ├── overview.js     # Dashboard live charts and metrics
        ├── employees.js    # Directory table, search, filters, drawer, delete modal
        ├── employee-form.js# Add & Edit modal logic, validation, error handling
        ├── departments.js  # Department cards and cross-linking
        ├── reports.js      # Reports compilation, CSV export, print trigger
        └── settings.js     # Settings storage and greeting updates
```

---

## 🚀 Installation & Running Instructions

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm

### 1. Navigate to Project Directory
```powershell
cd d:\employee-management-system
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Start the Server
```powershell
npm start
```

### 4. Access the Application
Open your web browser and navigate to:
```text
http://localhost:3000
```

---

## 🧪 Automated Testing

An automated test suite is included in `tests/crud-test.js` to verify all 15 operational scenarios:

```powershell
npm test
```

### Verified Test Cases:
1. **TEST 1:** Create employee (`EMP099`) with full validation.
2. **TEST 2:** Dynamic search using Employee ID (`EMP099`).
3. **TEST 3:** Search using employee name (`Vikramaditya`).
4. **TEST 4:** Filter using department (`Engineering`).
5. **TEST 5:** Edit employee (Department, Job Title, Phone updated in SQLite).
6. **TEST 6:** Duplicate Employee ID rejection with HTTP 409 and user-friendly error message.
7. **TEST 7:** Invalid Employee ID format validation rejection with HTTP 400.
8. **TEST 8:** Delete employee with permanent removal from SQLite.
9. **TEST 9:** Cancel deletion verification.
10. **TEST 10 & 11:** Persistent SQLite database check across restarts (retaining existing data without duplicate seed records).
11. **TEST 12:** Dashboard statistics dynamically reflect real SQLite database records.
12. **TEST 13:** Export CSV generates a real RFC4180-compliant `.csv` file with headers.
13. **TEST 14 & 15:** Open and retrieve single employee profile drawer details (`EMP001 Aarav Sharma`).

---

## 📈 Future Scope

- **Multi-Tenant Roles:** Role-based access control (RBAC) with granular HR vs. Manager vs. Employee permissions.
- **Attendance & Leave Requests:** Self-service leave application and approval workflows.
- **Document Attachments:** Employee resume, contracts, and ID document uploads.
- **Payroll Integration:** Tax calculation rules and payslip generation.

---

## 🎓 Academic / Project Attribution

- **Project:** PeopleDesk - Employee Operations & Workforce Management Platform
- **Architecture:** Client-Server Single/Multi-Page Corporate Architecture
- **Tech Stack:** Vanilla JavaScript, HTML5, CSS3, Express.js, SQLite3
