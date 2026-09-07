// ============================================================
// VULNERABLE VERSION — SSTI + Path Traversal demo routes
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

// Ensure demo directories + dummy files exist
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(INTERNAL_DIR)) fs.mkdirSync(INTERNAL_DIR, { recursive: true });

const sampleReportPath = path.join(REPORTS_DIR, 'sample-visit-summary.txt');
if (!fs.existsSync(sampleReportPath)) {
    fs.writeFileSync(sampleReportPath, 'Visit Summary\n--------------\nPatient: Test Patient Alpha\nSummary: Routine checkup, no issues noted.\n(Dummy data)\n');
}

const flag4Path = path.join(INTERNAL_DIR, 'flag_4_path_traversal.txt');
if (!fs.existsSync(flag4Path)) {
    fs.writeFileSync(flag4Path, 'flag_4_Fourth_Part_Of_the_hash{71f969}\nClue: the admin patient search endpoint is not sanitized.\n');
}

// ------------------------------------------------------------
// @route   POST /api/reports/appointment-letter
// @desc    Generate an appointment confirmation letter from a template
// @access  Private
//
// VULNERABLE: compiles the user-controlled "template" field directly
// with Handlebars.compile(), evaluating attacker-supplied template
// syntax server-side (SSTI), rather than treating it as plain data
// inside a FIXED template.
// ------------------------------------------------------------
router.post('/appointment-letter', protect, (req, res) => {
    const { patientName, doctorName, date, template } = req.body;

    // Default, realistic template — but the client can override it entirely.
    const templateSource = template || `Dear {{patientName}},\n\nThis confirms your appointment with {{doctorName}} on {{date}}.\n\nClinic Administration`;

    try {
        // --- VULNERABLE: arbitrary user input compiled as a template ---
        const compiled = Handlebars.compile(templateSource);
        const letter = compiled({
            patientName,
            doctorName,
            date,
            // Included so an SSTI payload like {{internalFlag}} can pull it,
            // simulating leakage of server-side context via template injection.
            internalFlag: 'flag_1_First_Part_Of_the_hash{abb2d3}',
            clue: 'Next: check the lab image preview feature for an internal-only service.'
        });

        res.json({ letter });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate letter', error: error.message });
    }
});

// ------------------------------------------------------------
// @route   GET /api/reports/download?file=
// @desc    Download a report file by name from the reports directory
// @access  Private
//
// VULNERABLE: builds the filesystem path via simple concatenation with
// no normalization/base-directory restriction, allowing ../ traversal
// out of REPORTS_DIR (e.g. into backend/internal/).
// ------------------------------------------------------------
router.get('/download', protect, (req, res) => {
    const file = req.query.file || 'sample-visit-summary.txt';

    // --- VULNERABLE PATH CONSTRUCTION ---
    const filePath = path.join(REPORTS_DIR, file);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            // VULNERABLE: leaks the resolved internal path in the error
            return res.status(404).json({ message: 'File not found', error: err.message, path: filePath });
        }
        res.type('text/plain').send(data);
    });
});

module.exports = router;
