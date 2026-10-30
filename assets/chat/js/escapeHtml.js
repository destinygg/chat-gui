/**
 * Escapes a value for use as HTML text or inside a quoted attribute. Anything
 * the chat didn't write itself — emote prefixes and flair labels included,
 * which staff with no other privileges can set — goes through this before it's
 * put into markup.
 */
export default function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
