import $ from 'jquery';
import { linkregex } from '../regex';
import { HashLinkConverter } from '../hashlinkconverter';
import encodeUrl from '../encodeUrl';

export default class UrlFormatter {
  constructor() {
    this.hashLinkConverter = new HashLinkConverter();
    this.elem = $('<div></div>');
  }

  static untrackX(url) {
    return url.split('?')[0];
  }

  static untrackYouTube(url) {
    try {
      const ytLink = new URL(url);
      ytLink.searchParams.delete('si');
      return ytLink.href;
    } catch (error) {
      return url;
    }
  }

  static async insertOembedData(
    id,
    domain,
    target,
    insertedItem = 'author_name',
  ) {
    const element = document.getElementById(id);
    if (!element) {
      setTimeout(() => {
        UrlFormatter.insertOembedData(id, domain, target, insertedItem);
      }, 50);
      return;
    }

    try {
      fetch(`https://${domain}/oembed?url=${target}`).then((response) => {
        response.json().then((json) => {
          element.innerText = json[insertedItem] ?? id;
          element.title = json[insertedItem];
        });
      });
    } catch (error) {
      // ignore
    }
  }

  format(chat, str) {
    if (!str) {
      return undefined;
    }
    const self = this;
    let extraclass = '';

    if (/\b(?:NSFL)\b/i.test(str)) {
      extraclass = 'nsfl-link';
    } else if (/\b(?:NSFW)\b/i.test(str)) {
      extraclass = 'nsfw-link';
    } else if (/\b(?:SPOILERS)\b/i.test(str)) {
      extraclass = 'spoilers-link';
    }

    return str.replace(linkregex, (url, scheme) => {
      const decodedUrl = self.elem.html(url).text();
      const m = decodedUrl.match(linkregex);
      if (m) {
        const normalizedUrl = encodeUrl(m[0]);

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

        if (
          /^(?:(?:https|http):\/\/)?(?:www\.)?youtu(?:be\.com|\.be)/i.test(href)
        ) {
          const u = UrlFormatter.untrackYouTube(href);
          const videoid = u.match(/([a-z0-9_-]{11})/i);
          if (!videoid || !videoid[0]) {
            return `<a target="_blank" class="externallink ${extraclass}" href="${href}" rel="nofollow">${urlText}</a>${extra}`;
          }

          const linkid = `ytlink:${Date.now()}${videoid[0]}`;
          UrlFormatter.insertOembedData(linkid, 'youtube.com', u);
          return `<a target="_blank" class="richlink ${extraclass}" href="${u}"><i class="brand youtube"></i><p class="title" id="${linkid}">${videoid && videoid[0] ? videoid[0] : urlText}</p></a>${extra}`;
        }

        const xlink = href.match(
          /(?:x|twitter)\.com\/(\w{1,15})\/status\/(\d{2,19})\\?/,
        );
        if (xlink !== null) {
          const [, name, id] = xlink;
          return `<a target="_blank" class="richlink ${extraclass}" href="${UrlFormatter.untrackX(href)}"><i class="brand x"></i><p class="title" id="xlink:${id}">${name === 'i' ? id : name}</p></span></a>${extra}`;
        }

        const embedTarget = chat.isBigscreenEmbed() ? '_top' : '_blank';
        const embedUrl = `${chat.config.dggOrigin}${chat.bigscreenPath}${embedHashLink}`;

        return embedHashLink
          ? `<a target="_blank" class="externallink ${extraclass}" href="${href}" rel="nofollow">${urlText}</a><a target="${embedTarget}" class="embed-button" href="${embedUrl}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tv-minimal"><path d="M7 21h10"/><rect width="20" height="14" x="2" y="3" rx="2"/></svg></a>`
          : `<a target="_blank" class="externallink ${extraclass}" href="${href}" rel="nofollow">${urlText}</a>${extra}`;
      }
      return url;
    });
  }
}
