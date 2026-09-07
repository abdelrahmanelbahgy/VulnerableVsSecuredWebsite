// ============================================================
// SECURED VERSION — CSRF FIX
// ------------------------------------------------------------
// Isolated cookie-based session flow, kept separate from the app's
// main JWT-in-header authentication.
//
// FIX — three layers, per the assignment's explicit instruction not
// to rely on SameSite alone:
//   1. The state-changing action is now POST, not GET (GET requests
//      should never have side effects — that was itself a mistake).
//   2. SameSite=Strict on the session cookie — modern browsers will
//      not attach it to any cross-site request at all.
//   3. A CSRF token, generated at login and returned only in the JSON
//      response body (never in a cookie), which the client must echo
//      back in a custom header on every state-changing request. A
//      cross-site attacker page cannot read that token because
//      browsers block cross-origin reads of response bodies by
//      default (see the tightened CORS config in server.js).
// ============================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory session store for this isolated demo flow only.
const sessions = new Map(); // sessionId -> { username, backupEmail, csrfToken }

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
    const csrfToken = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, { username, backupEmail: null, csrfToken });

    // --- FIX: SameSite=Strict — this cookie is never sent on a
    // cross-site request, regardless of how it's triggered. ---
    res.cookie('clinicSession', sessionId, {
        httpOnly: true,
        sameSite: 'strict'
    });

    // --- FIX: CSRF token returned ONLY in the response body, never
    // as a cookie — a cross-origin attacker page cannot read it. ---
    res.json({ message: `Logged in as ${username}`, csrfToken });
});

// ------------------------------------------------------------
// @route   POST /api/session/update-backup-email
// @desc    Update the account's backup notification email
// @access  Private (cookie session + CSRF token)
// ------------------------------------------------------------
router.post('/update-backup-email', (req, res) => {
    const sessionId = req.cookies && req.cookies.clinicSession;
    const session = sessionId && sessions.get(sessionId);

    if (!session) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    // --- FIX: require the CSRF token as a custom header, and verify
    // it matches the one issued at login for this exact session. ---
    const submittedToken = req.get('X-CSRF-Token');
    if (!submittedToken || submittedToken !== session.csrfToken) {
        return res.status(403).json({ message: 'Missing or invalid CSRF token' });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'email is required' });
    }

    session.backupEmail = email;
    res.json({ message: 'Backup email updated', backupEmail: session.backupEmail });
});

// ------------------------------------------------------------
// @route   GET /api/session/whoami
// @desc    Check current CSRF-demo session state (read-only — GET is fine here)
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
        backupEmail: session.backupEmail
    });
});

module.exports = router;
