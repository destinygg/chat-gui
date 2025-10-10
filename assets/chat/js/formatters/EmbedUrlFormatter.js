import { embedregex, nsflregex, nsfwregex, spoilersregex } from '../regex';

export default class EmbedUrlFormatter {
  format(chat, str /* , message=null */) {
    // Open hash links in a new tab when chat isn't embedded in the Bigscreen page.
    const target = chat.isBigscreenEmbed() ? '_top' : '_blank';
    let extraclass = '';

    if (nsflregex.test(str)) {
      extraclass = 'nsfl-link';
    } else if (nsfwregex.test(str)) {
      extraclass = 'nsfw-link';
    } else if (spoilersregex.test(str)) {
      extraclass = 'spoilers-link';
    }

    const baseUrl = chat.config.dggOrigin + chat.bigscreenPath;
    return str.replace(
      new RegExp(embedregex, 'g'),
      `$1<a class="externallink bookmarklink ${extraclass}" href="${baseUrl}$2" target="${target}">$2</a>`,
    );
  }
}
