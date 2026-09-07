// ============================================================
// SECURED VERSION — SSTI + Path Traversal FIXES
// ------------------------------------------------------------
// Educational use / local testing only. Dummy data only.
// ============================================================

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const { protect } = require('../middleware/auth');

const REPORTS_DIR = path.join(__dirname, '..', 'uploads', 'reports');
const INTERNAL_DIR = path.join(__dirname, '..', 'internal');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(INTERNAL_DIR)) fs.mkdirSync(INTERNAL_DIR, { recursive: true });

const sampleReportPath = path.join(REPORTS_DIR, 'sample-visit-summary.txt');
if (!fs.existsSync(sampleReportPath)) {
    fs.writeFileSync(sampleReportPath, 'Visit Summary\n--------------\nPatient: Test Patient Alpha\nSummary: Routine checkup, no issues noted.\n(Dummy data)\n');
}

// ------------------------------------------------------------
// FIX (SSTI): the template is now a FIXED string, defined here in the
// codebase — never taken from the request — and compiled exactly ONCE
// at startup, not per-request from user input. Whatever the client
// sends in a "template" field (if anything) is ignored entirely.
//
// User-supplied values (patientName, doctorName, date) are only ever
// passed in as DATA to render into the fixed template's placeholders —
// they can never become template *code*, because they're never
// compiled. This is the core fix: separating template (trusted,
// developer-controlled) from data (untrusted, user-controlled).
// ------------------------------------------------------------
const APPOINTMENT_LETTER_TEMPLATE = Handlebars.compile(
    'Dear {{patientName}},\n\nThis confirms your appointment with {{doctorName}} on {{date}}.\n\nClinic Administration'
);

// ------------------------------------------------------------
// @route   POST /api/reports/appointment-letter
// @desc    Generate an appointment confirmation letter from a fixed template
// @access  Private
// ------------------------------------------------------------
router.post('/appointment-letter', protect, (req, res) => {
    const { patientName, doctorName, date } = req.body;

    if (!patientName || !doctorName || !date) {
        return res.status(400).json({ message: 'patientName, doctorName, and date are required' });
    }

    try {
        // --- FIX: render the pre-compiled fixed template with user
        // values as plain data. Handlebars automatically HTML-escapes
        // these values by default (via {{ }}), and no user input is
        // ever passed to Handlebars.compile(). ---
        const letter = APPOINTMENT_LETTER_TEMPLATE({ patientName, doctorName, date });
        res.json({ letter });
    } catch (error) {
        console.error('[reports] letter generation failed:', error);
        res.status(500).json({ message: 'Failed to generate letter. Please try again.' });
    }
});

// ------------------------------------------------------------
// @route   GET /api/reports/download?file=
// @desc    Download a report file by name from the reports directory
// @access  Private
//
// FIX (Path Traversal): two layers of defense —
//   1. path.basename() strips any directory components from the input
//      entirely (so "../internal/x.txt" becomes just "x.txt").
//   2. The resolved absolute path is re-verified to still be located
//      inside REPORTS_DIR before the file is read, as defense-in-depth
//      against any path-normalization edge case basename() might miss.
// ------------------------------------------------------------
router.get('/download', protect, (req, res) => {
    const requested = req.query.file || 'sample-visit-summary.txt';

    // --- FIX: discard any directory traversal segments up front ---
    const safeName = path.basename(requested);

    const resolvedBase = path.resolve(REPORTS_DIR);
    const resolvedPath = path.resolve(resolvedBase, safeName);

    // --- FIX: verify the resolved path is still inside REPORTS_DIR ---
    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
        return res.status(400).json({ message: 'Invalid filename' });
    }

    fs.readFile(resolvedPath, 'utf8', (err, data) => {
        if (err) {
            // FIX: generic message, no internal path/error leaked to client
            console.error('[reports] download failed:', err);
            return res.status(404).json({ message: 'File not found' });
        }
        res.type('text/plain').send(data);
    });
});

module.exports = router;
