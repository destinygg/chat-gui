import $ from 'jquery';
import { linkregex } from '../regex';
import { HashLinkConverter } from '../hashlinkconverter';
import encodeUrl from '../encodeUrl';

export default class UrlFormatter {
  constructor() {
    this.hashLinkConverter = new HashLinkConverter();
    this.elem = $('<div></div>');
  }

  format(chat, str) {
    if (!str) return undefined;
    const self = this;
    let extraclass = '';

    if (/\b(?:NSFL)\b/i.test(str)) extraclass = 'nsfl-link';
    else if (/\b(?:NSFW|SPOILERS?)\b/i.test(str)) extraclass = 'nsfw-link';

    return str.replace(linkregex, (url, scheme) => {
      const decodedUrl = self.elem.html(url).text();
      const m = decodedUrl.match(linkregex);
      if (m) {
        const normalizedUrl = encodeUrl(this.normalizeUrl(m[0]));

        let embedHashLink = '';
        try {
          embedHashLink = this.hashLinkConverter.convert(decodedUrl);
        } catch (err) {
          // ignore
        }

        const maxUrlLength = 90;
        let urlText = normalizedUrl;
        if (
          !(chat.settings.get('showentireurl') ?? false) &&
          urlText.length > maxUrlLength
        ) {
          urlText = `${urlText.slice(0, 40)}...${urlText.slice(-40)}`;
        }

        const extra = encodeUrl(decodedUrl.substring(m[0].length));
        const href = `${scheme ? '' : 'http://'}${normalizedUrl}`;

        const embedTarget = chat.isBigscreenEmbed() ? '_top' : '_blank';
        const embedUrl = `${chat.config.dggOrigin}${chat.bigscreenPath}${embedHashLink}`;
        return embedHashLink
          ? `<a target="_blank" class="externallink ${extraclass}" href="${href}" rel="nofollow">${urlText}</a><a target="${embedTarget}" class="embed-button" href="${embedUrl}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="14.4" viewBox="0 0 640 512"><path d="M64 64V352H576V64H64zM0 64C0 28.7 28.7 0 64 0H576c35.3 0 64 28.7 64 64V352c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zM128 448H512c17.7 0 32 14.3 32 32s-14.3 32-32 32H128c-17.7 0-32-14.3-32-32s14.3-32 32-32z"  fill="#fff"/></svg></a>`
          : `<a target="_blank" class="externallink ${extraclass}" href="${href}" rel="nofollow">${urlText}</a>${extra}`;
      }
      return url;
    });
  }

  /**
   * @param {string} url
   * @return {string} The normalized URL.
   */
  normalizeUrl(url) {
    if (/(x|twitter)\.com\/\w{1,15}\/status\/\d{2,19}\?/i.test(url)) {
      // Remove the query string from xeet URLs to protect users from clicking
      // on a link to a xeet they've already seen.
      return url.split('?')[0];
    }

    if (/^(?:(?:https|http):\/\/)?(?:www\.)?youtu(?:be\.com|\.be)/i.test(url)) {
      // Same as with xeets, remove the nasty share tracking query param
      // from YouTube links.
      try {
        const ytLink = new URL(url);
        ytLink.searchParams.delete('si');
        return ytLink.href;
      } catch {
        return url;
      }
    }

    return url;
  }
}
