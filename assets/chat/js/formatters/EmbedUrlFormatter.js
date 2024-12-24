export default class EmbedUrlFormatter {
  constructor() {
    this.bigscreenregex =
      /(^|\s)(#(kick|twitch|twitch-vod|twitch-clip|youtube|youtube-live|facebook|rumble|vimeo)\/([\w\d]{3,64}\/videos\/\d{10,20}|[\w-]{3,64}|\w{7}\/\?pub=\w{5})(?:\?t=(\d+)s?)?)\b/g;
  }

  format(chat, str /* , message=null */) {
    // Open hash links in a new tab when chat isn't embedded in the Bigscreen page.
    const target = chat.isBigscreenEmbed() ? '_top' : '_blank';
    let extraclass = '';

    if (/\b(?:NSFL)\b/i.test(str)) {
      extraclass = 'nsfl-link';
    } else if (/\b(?:NSFW)\b/i.test(str)) {
      extraclass = 'nsfw-link';
    } else if (/\b(?:SPOILERS)\b/i.test(str)) {
      extraclass = 'spoilers-link';
    }

    const baseUrl = chat.config.dggOrigin + chat.bigscreenPath;
    return str.replace(
      this.bigscreenregex,
      `$1<a class="externallink bookmarklink ${extraclass}" href="${baseUrl}$2" target="${target}">$2</a>`,
    );
  }
}
