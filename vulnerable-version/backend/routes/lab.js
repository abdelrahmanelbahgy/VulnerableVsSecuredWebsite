// ============================================================
// VULNERABLE VERSION — SSRF demo routes
// ------------------------------------------------------------
// Educational use / local testing only.
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ------------------------------------------------------------
// @route   GET /api/lab/internal/diag
// @desc    Simulated internal-only diagnostics service.
//          In a real deployment this would sit behind a firewall,
//          reachable only from inside the clinic network — never
//          intended to be reached directly by a browser client.
// @access  "Internal" (no auth — simulates network-level isolation,
//          not app-level access control, which is the point of SSRF)
// ------------------------------------------------------------
router.get('/internal/diag', (req, res) => {
    res.json({
        service: 'internal-lab-diagnostics',
        status: 'ok',
        flag: 'flag_2_Second_Part_Of_the_hash{e48ea1}',
        clue: 'Next: the appointment diagnostics ping tool might trust its input a bit too much.'
    });
});

// ------------------------------------------------------------
// @route   POST /api/lab/preview
// @desc    Fetch and preview a remote lab-result image/document by URL
// @access  Private
//
// VULNERABLE: the server makes an HTTP request to a fully
// user-controlled URL with no scheme/host/IP validation, allowing
// the client to pivot the server into fetching internal-only
// endpoints (e.g. http://localhost:5000/api/lab/internal/diag)
// or other internal network services.
// ------------------------------------------------------------
router.post('/preview', protect, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'url is required' });
    }

    try {
        // --- VULNERABLE: no allowlisting, no blocking of localhost/private IPs ---
        const response = await fetch(url);
        const contentType = response.headers.get('content-type') || 'text/plain';
        const body = await response.text();

        res.json({
            requestedUrl: url,
            contentType,
            body
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch resource', error: error.message, requestedUrl: url });
    }
});

module.exports = router;
