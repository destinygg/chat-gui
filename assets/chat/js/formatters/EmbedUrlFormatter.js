export default class EmbedUrlFormatter {
  constructor() {
    this.bigscreenPath = '/bigscreen';
    this.bigscreenregex =
      /(^|\s)(#(kick|twitch|twitch-vod|twitch-clip|youtube|youtube-live|facebook|rumble|vimeo)\/([\w-]{3,64}|\d{10,20}\/videos\/\d{10,20}|\w{7}\/\?pub=\w{5})(?:\?t=(\d+)s?)?)\b/g;

    try {
      const { location } = window.top || window.parent || window;
      this.currentPath = location.pathname;
      this.url = `${location.protocol}//${location.host}${this.bigscreenPath}${
        location.search ? location.search : ''
      }`.replace(/\/$/, '');
    } catch (e) {} // eslint-disable-line no-empty
  }

  format(chat, str /* , message=null */) {
    // Open embed links in a new tab when in embedded/popout chat.
    const target = this.currentPath === this.bigscreenPath ? '_top' : '_blank';
    let extraclass = '';

    if (/\b(?:NSFL)\b/i.test(str)) extraclass = 'nsfl-link';
    else if (/\b(?:NSFW|SPOILERS?)\b/i.test(str)) extraclass = 'nsfw-link';

    return str.replace(
      this.bigscreenregex,
      `$1<a class="externallink bookmarklink ${extraclass}" href="${this.url}$2" target="${target}">$2</a>`
    );
  }
}
