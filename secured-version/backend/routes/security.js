// ============================================================
// SECURED VERSION — SQL Injection FIX
// ------------------------------------------------------------
// Backed by the small SQLite "security" database (config/securityDb.js).
// FIX: user input is now passed as bound PARAMETERS via better-sqlite3's
// prepared statements (the `?` placeholders below), never concatenated
// into the SQL string. The database driver keeps query structure and
// data completely separate, so no input value — however it's
// formatted — can change what the query does.
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../config/securityDb');
const { protect, authorize } = require('../middleware/auth');

// ------------------------------------------------------------
// @route   GET /api/security/patient-search?q=
// @desc    Search dummy SQL-backed patient records by name
// @access  Private (Admin)
// ------------------------------------------------------------
router.get('/patient-search', protect, authorize('admin'), (req, res) => {
    const q = req.query.q || '';

    // --- FIX: parameterized query — `q` is bound as data, never
    // concatenated into the SQL text, so quotes/UNION/comment syntax
    // in `q` are treated as a literal search string, not SQL. ---
    const stmt = db.prepare(
        'SELECT id, full_name, ssn_dummy, insurance_id, notes FROM patient_records WHERE full_name LIKE ?'
    );

    try {
        const rows = stmt.all(`%${q}%`);
        res.json({ results: rows });
    } catch (error) {
        // FIX: generic message to the client; details only in server logs.
        console.error('[security] patient-search query failed:', error);
        res.status(500).json({ message: 'Search failed. Please try again.' });
    }
});

// ------------------------------------------------------------
// @route   POST /api/security/staff-login
// @desc    Separate "staff portal" login backed by the SQLite admins table
// @access  Public
// ------------------------------------------------------------
router.post('/staff-login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // --- FIX: parameterized query for authentication too — a comment
    // sequence or quote in `username`/`password` can no longer alter
    // the query's logic (e.g. bypass the password check). ---
    const stmt = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?');

    try {
        const user = stmt.get(username, password);
        if (user) {
            return res.json({
                message: 'Staff login successful',
                staff: { username: user.username, role: user.role }
            });
        }
        return res.status(401).json({ message: 'Invalid staff credentials' });
    } catch (error) {
        console.error('[security] staff-login query failed:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

module.exports = router;
