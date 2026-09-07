// ============================================================
// VULNERABLE VERSION — SQL Injection demo routes
// ------------------------------------------------------------
// Backed by the small SQLite "security" database (config/securityDb.js).
// Contains ONLY dummy data. Educational use / local testing only.
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../config/securityDb');
const { protect, authorize } = require('../middleware/auth');

// ------------------------------------------------------------
// @route   GET /api/security/patient-search?q=
// @desc    Search dummy SQL-backed patient records by name
// @access  Private (Admin)
//
// VULNERABLE: builds the SQL query via raw string concatenation
// from user input, with no parameterization. Supports UNION-based,
// boolean-based, and error-based SQLi against the SQLite DB above.
// ------------------------------------------------------------
router.get('/patient-search', protect, authorize('admin'), (req, res) => {
    const q = req.query.q || '';

    // --- VULNERABLE QUERY CONSTRUCTION ---
    const query = `SELECT id, full_name, ssn_dummy, insurance_id, notes FROM patient_records WHERE full_name LIKE '%${q}%'`;

    try {
        const rows = db.prepare(query).all();
        res.json({ query, results: rows });
    } catch (error) {
        // VULNERABLE: raw DB error returned to client (also demonstrates
        // error-based SQLi + information disclosure together).
        res.status(500).json({ message: 'Query failed', error: error.message, query });
    }
});

// ------------------------------------------------------------
// @route   POST /api/security/staff-login
// @desc    Separate "staff portal" login backed by the SQLite admins table
// @access  Public
//
// VULNERABLE: classic SQLi authentication bypass via string concatenation,
// e.g. username = admin' OR '1'='1' --
// ------------------------------------------------------------
router.post('/staff-login', (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM admins WHERE username = '${username}' AND password = '${password}'`;

    try {
        const user = db.prepare(query).get();
        if (user) {
            return res.json({
                message: 'Staff login successful',
                staff: { username: user.username, role: user.role }
            });
        }
        return res.status(401).json({ message: 'Invalid staff credentials' });
    } catch (error) {
        res.status(500).json({ message: 'Query failed', error: error.message, query });
    }
});

module.exports = router;
