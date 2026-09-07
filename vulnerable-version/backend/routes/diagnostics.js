// ============================================================
// VULNERABLE VERSION — OS Command Injection demo routes
// ------------------------------------------------------------
// Educational use / local testing only. Non-destructive commands only.
// ============================================================

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');

const INTERNAL_DIR = path.join(__dirname, '..', 'internal');
if (!fs.existsSync(INTERNAL_DIR)) fs.mkdirSync(INTERNAL_DIR, { recursive: true });

const flag3Path = path.join(INTERNAL_DIR, 'flag_3_cmdi.txt');
if (!fs.existsSync(flag3Path)) {
    fs.writeFileSync(flag3Path, 'flag_3_Third_Part_Of_the_hash{85a3ce}\nClue: report downloads live under /api/reports/download?file=\n');
}

// ------------------------------------------------------------
// @route   POST /api/diagnostics/ping
// @desc    "Network diagnostics" — ping a lab server hostname
// @access  Private (Admin)
//
// VULNERABLE: user-controlled "host" is concatenated directly into a
// shell command string passed to child_process.exec(), allowing shell
// metacharacters (;, &&, |, $(...), backticks) to inject additional
// commands.
// ------------------------------------------------------------
router.post('/ping', protect, authorize('admin'), (req, res) => {
    const { host } = req.body;

    if (!host) {
        return res.status(400).json({ message: 'host is required' });
    }

    // --- VULNERABLE COMMAND CONSTRUCTION ---
    const command = `ping -c 1 ${host}`;

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
            // VULNERABLE: raw stderr/error surfaced to the client
            return res.status(500).json({ message: 'Ping failed', error: error.message, stderr, command });
        }
        res.json({ command, output: stdout });
    });
});

module.exports = router;
