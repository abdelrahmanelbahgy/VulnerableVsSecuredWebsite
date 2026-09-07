// ============================================================
// Shared backend utility — HTML escaping
// ------------------------------------------------------------
// FIX (Reflected XSS): used anywhere user-supplied data is written
// into a server-rendered HTML response, so it's always treated as
// literal text, never as markup.
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

module.exports = { escapeHtml };
