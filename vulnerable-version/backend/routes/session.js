// ============================================================
// VULNERABLE VERSION — CSRF demo routes
// ------------------------------------------------------------
// This is an ISOLATED cookie-based session flow, kept separate
// from the app's main JWT-in-header authentication, specifically
// to demonstrate CSRF. The main clinic app is unaffected.
//
// VULNERABLE for two combined reasons (both worth calling out
// during the demo):
//   1. The state-changing action is exposed via GET (a classic
//      "confused deputy" anti-pattern) rather than POST.
//   2. No CSRF token is required, and the session cookie is not
//      locked down with SameSite=Strict.
// ============================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory session store for this isolated demo flow only.
const sessions = new Map(); // sessionId -> { username, backupEmail }

// ------------------------------------------------------------
// @route   POST /api/session/login
// @desc    Cookie-based login for the CSRF demo ("patient portal quick access")
// @access  Public
// ------------------------------------------------------------
router.post('/login', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'username is required' });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, { username, backupEmail: null });

    // --- VULNERABLE COOKIE CONFIG: no SameSite=Strict, no CSRF token scheme ---
    res.cookie('clinicSession', sessionId, {
        httpOnly: true,
        sameSite: 'lax'
    });

    res.json({ message: `Logged in as ${username}`, sessionId });
});

// ------------------------------------------------------------
// @route   GET /api/session/update-backup-email?email=
// @desc    Update the account's backup notification email
// @access  Private (cookie session)
//
// VULNERABLE: state-changing action exposed via GET with no CSRF
// token — a cross-site request (e.g. an auto-loading <img> tag on
// an attacker page) can silently change the victim's backup email
// as long as the victim is logged in.
// ------------------------------------------------------------
router.get('/update-backup-email', (req, res) => {
    const sessionId = req.cookies && req.cookies.clinicSession;
    const session = sessionId && sessions.get(sessionId);

    if (!session) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'email is required' });
    }

    session.backupEmail = email;
    res.json({ message: 'Backup email updated', backupEmail: session.backupEmail });
});

// ------------------------------------------------------------
// @route   GET /api/session/whoami
// @desc    Check current CSRF-demo session state
// @access  Private (cookie session)
// ------------------------------------------------------------
router.get('/whoami', (req, res) => {
    const sessionId = req.cookies && req.cookies.clinicSession;
    const session = sessionId && sessions.get(sessionId);

    if (!session) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    res.json({
        username: session.username,
        backupEmail: session.backupEmail,
        flag: session.backupEmail && session.backupEmail.includes('attacker')
            ? 'flag_6_Sixth_Part_Of_the_hash{c5dc6f}'
            : undefined
    });
});

module.exports = router;
