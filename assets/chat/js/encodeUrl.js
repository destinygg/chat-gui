// stolen from angular.js
// https://github.com/angular/angular.js/blob/v1.3.14/src/ngSanitize/sanitize.js#L435
function encodeUrl(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (v) => {
      const hi = v.charCodeAt(0);
      const low = v.charCodeAt(1);
      return `&#${(hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000};`;
    })
    .replace(/([^#-~| |!])/g, (v) => `&#${v.charCodeAt(0)};`)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default encodeUrl;
