// ============================================================
// SECURED VERSION — OS Command Injection FIX
// ------------------------------------------------------------
// Educational use / local testing only.
// ============================================================

const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const { protect, authorize } = require('../middleware/auth');

// ------------------------------------------------------------
// FIX (OS Command Injection): two layers of defense —
//   1. execFile() instead of exec() — execFile runs the binary
//      directly, with arguments passed as an ARRAY, never through a
//      shell. Shell metacharacters (; && | $() backticks) in `host`
//      are therefore just literal characters passed as one argument
//      to `ping`, not interpreted as shell syntax at all.
//   2. A strict allowlist regex on `host` as defense-in-depth, so even
//      a malformed/unexpected value never reaches the process call.
// ------------------------------------------------------------
const VALID_HOST = /^[a-zA-Z0-9.-]+$/;

router.post('/ping', protect, authorize('admin'), (req, res) => {
    const { host } = req.body;

    if (!host) {
        return res.status(400).json({ message: 'host is required' });
    }

    // --- FIX: reject anything that isn't a plausible hostname/IP ---
    if (!VALID_HOST.test(host) || host.length > 253) {
        return res.status(400).json({ message: 'Invalid host format' });
    }

    // --- FIX: arguments passed as an array, no shell involved ---
    execFile('ping', ['-c', '1', host], { timeout: 5000 }, (error, stdout) => {
        if (error) {
            console.error('[diagnostics] ping failed:', error);
            return res.status(500).json({ message: 'Ping failed' });
        }
        res.json({ output: stdout });
    });
});

module.exports = router;
