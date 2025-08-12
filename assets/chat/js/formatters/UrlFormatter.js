import linkifyHtml from 'linkify-html';
import { HashLinkConverter } from '../hashlinkconverter';

const MAX_URL_LENGTH = 90;

export default class UrlFormatter {
  constructor() {
    this.hashLinkConverter = new HashLinkConverter();
  }

  format(chat, str) {
    if (!str) {
      return undefined;
    }

    return linkifyHtml(str, {
      className: () => {
        switch (true) {
          case /\b(?:NSFL)\b/i.test(str):
            return 'externallink nsfl-link';
          case /\b(?:NSFW)\b/i.test(str):
            return 'externallink nsfw-link';
          case /\b(?:SPOILERS)\b/i.test(str):
            return 'externallink spoilers-link';
          default:
            return 'externallink';
        }
      },
      rel: 'nofollow',
      target: '_blank',
      format: (content) => {
        const normalizedUrl = this.normalizeUrl(content);

        if (
          !(chat.settings.get('showentireurl') ?? false) &&
          normalizedUrl.length > MAX_URL_LENGTH
        ) {
          return `${normalizedUrl.slice(0, 40)}...${normalizedUrl.slice(-40)}`;
        }

        return normalizedUrl;
      },
      formatHref: (href) => this.normalizeUrl(href),
      render: ({ tagName, attributes, content }) => {
        let embedHashLink = '';
        try {
          embedHashLink = this.hashLinkConverter.convert(attributes.href);
        } catch (err) {
          // ignore
        }

        const attrs = Object.keys(attributes).reduce(
          (acc, cur) => `${acc} ${cur}="${attributes[cur]}"`,
          '',
        );

        const embedTarget = chat.isBigscreenEmbed() ? '_top' : '_blank';
        const embedUrl = `${chat.config.dggOrigin}${chat.bigscreenPath}${embedHashLink}`;

        return embedHashLink
          ? `<${tagName}${attrs}>${content}</${tagName}><a target="${embedTarget}" class="embed-button" href="${embedUrl}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tv-minimal"><path d="M7 21h10"/><rect width="20" height="14" x="2" y="3" rx="2"/></svg></a>`
          : `<${tagName}${attrs}>${content}</${tagName}>`;
      },
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
