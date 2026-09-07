// ============================================================
// Shared frontend utility — HTML escaping
// ------------------------------------------------------------
// FIX (Stored XSS): every dashboard was inserting database content
// (appointment reasons, doctor notes, user names, etc.) directly into
// innerHTML with no encoding, so any HTML/JS a user typed would be
// executed as real markup for every viewer.
//
// escapeHtml() converts the five characters that matter for HTML
// injection into their harmless entity equivalents, so text like
// <script>alert(1)</script> renders as the literal text
// "<script>alert(1)</script>" on the page instead of executing.
//
// Load this file BEFORE patient.js/doctor.js/admin.js on every
// dashboard page.
// ============================================================

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
