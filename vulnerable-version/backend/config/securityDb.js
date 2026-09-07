// ============================================================
// VULNERABLE VERSION — Security-training SQL component
// ------------------------------------------------------------
// This is a small, self-contained SQLite database added ONLY
// to demonstrate SQL Injection. The main clinic application
// continues to run on MongoDB/Mongoose — this file is not
// part of the core clinic data model.
//
// Contains ONLY dummy/fake data. No real patient information.
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'security.db');

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

function initSecurityDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'staff'
        );

        CREATE TABLE IF NOT EXISTS patient_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            ssn_dummy TEXT NOT NULL,
            insurance_id TEXT NOT NULL,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS security_flags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flag_name TEXT NOT NULL,
            flag_value TEXT NOT NULL
        );
    `);

    const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
    if (adminCount === 0) {
        // Dummy staff accounts — fake credentials only, used to demonstrate
        // SQLi authentication bypass. Never use real credentials here.
        const insertAdmin = db.prepare(
            'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)'
        );
        insertAdmin.run('front_desk', 'FrontDesk#2026', 'staff');
        insertAdmin.run('clinic_admin', 'DummyAdminPass#2026', 'admin');

        const insertPatient = db.prepare(
            'INSERT INTO patient_records (full_name, ssn_dummy, insurance_id, notes) VALUES (?, ?, ?, ?)'
        );
        insertPatient.run('Test Patient Alpha', '000-00-0001', 'INS-DUMMY-001', 'Fake record for SQLi demo');
        insertPatient.run('Test Patient Beta', '000-00-0002', 'INS-DUMMY-002', 'Fake record for SQLi demo');
        insertPatient.run('Test Patient Gamma', '000-00-0003', 'INS-DUMMY-003', 'Fake record for SQLi demo');

        const insertFlag = db.prepare(
            'INSERT INTO security_flags (flag_name, flag_value) VALUES (?, ?)'
        );
        insertFlag.run('flag_5_sqli', 'flag_5_Fifth_Part_Of_the_hash{24dd24}');

        console.log('[securityDb] Seeded dummy SQLite security data.');
    }
}

module.exports = { db, initSecurityDb, DB_PATH };
