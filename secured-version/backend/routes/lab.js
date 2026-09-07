// ============================================================
// SECURED VERSION — SSRF FIX
// ------------------------------------------------------------
// Educational use / local testing only.
// ============================================================

const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { protect } = require('../middleware/auth');

// ------------------------------------------------------------
// FIX (SSRF): this endpoint is left in place ONLY so the secured
// version's fix can be demonstrated against the same target. In a
// real deployment this internal service would simply not be reachable
// from the public network at all (network-level isolation), which is
// the real fix — the application-level checks below are defense-in-
// depth on top of that, not a replacement for it.
// ------------------------------------------------------------
router.get('/internal/diag', (req, res) => {
    res.json({
        service: 'internal-lab-diagnostics',
        status: 'ok'
    });
});

// ------------------------------------------------------------
// FIX (SSRF): reject private/loopback/link-local/reserved IP ranges.
// Simple string checks on the hostname (e.g. blocking "localhost") are
// NOT enough — an attacker can use a numeric IP, an alternate loopback
// representation (0.0.0.0, 0x7f.0.0.1, [::1]), or a hostname that
// *resolves* to a private IP via DNS. So instead of filtering the
// input string, we resolve the hostname to its actual IP address and
// validate THAT.
// ------------------------------------------------------------
function isPrivateOrReservedIPv4(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return true; // fail closed
    const [a, b] = parts;

    if (a === 127) return true;                          // 127.0.0.0/8  loopback
    if (a === 10) return true;                            // 10.0.0.0/8   private
    if (a === 172 && b >= 16 && b <= 31) return true;      // 172.16.0.0/12 private
    if (a === 192 && b === 168) return true;               // 192.168.0.0/16 private
    if (a === 169 && b === 254) return true;               // 169.254.0.0/16 link-local
    if (a === 100 && b >= 64 && b <= 127) return true;      // 100.64.0.0/10 CGNAT
    if (a === 0) return true;                               // 0.0.0.0/8 "this network"
    return false;
}

function isPrivateOrReservedIPv6(ip) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true;                  // loopback
    if (normalized.startsWith('fe80:')) return true;         // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local (fc00::/7)
    if (normalized.startsWith('::ffff:')) {
        // IPv4-mapped IPv6 — re-check the embedded IPv4 address
        return isPrivateOrReservedIPv4(normalized.replace('::ffff:', ''));
    }
    return false;
}

async function isUrlSafeToFetch(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return { safe: false, reason: 'Invalid URL' };
    }

    // --- FIX: only allow http/https — blocks file://, gopher://, etc. ---
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { safe: false, reason: 'Only http/https URLs are allowed' };
    }

    let addresses;
    try {
        addresses = await dns.lookup(parsed.hostname, { all: true });
    } catch {
        return { safe: false, reason: 'Could not resolve hostname' };
    }

    // --- FIX: validate every resolved IP, not just the first one ---
    for (const { address, family } of addresses) {
        const isBad = family === 4 ? isPrivateOrReservedIPv4(address) : isPrivateOrReservedIPv6(address);
        if (isBad) {
            return { safe: false, reason: 'URL resolves to a private/internal address' };
        }
    }

    return { safe: true };
}

// ------------------------------------------------------------
// @route   POST /api/lab/preview
// @desc    Fetch and preview a remote lab-result image/document by URL
// @access  Private
// ------------------------------------------------------------
router.post('/preview', protect, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'url is required' });
    }

    const check = await isUrlSafeToFetch(url);
    if (!check.safe) {
        return res.status(400).json({ message: `Request blocked: ${check.reason}` });
    }

    try {
        // --- FIX: redirect: 'error' prevents an initially-safe URL from
        // redirecting the server to an internal address after the check
        // above has already passed (a classic SSRF-filter bypass). ---
        const response = await fetch(url, { redirect: 'error' });
        const contentType = response.headers.get('content-type') || 'text/plain';
        const body = await response.text();

        res.json({ contentType, body });
    } catch (error) {
        console.error('[lab] preview fetch failed:', error);
        res.status(502).json({ message: 'Failed to fetch the requested resource' });
    }
});

module.exports = router;
