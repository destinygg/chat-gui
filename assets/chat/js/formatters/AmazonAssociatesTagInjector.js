export default class AmazonAssociatesTagInjector {
  constructor() {
    this.amazonLinkRegex =
      /\bhttps:\/\/www\.amazon\.(com|ca|co\.uk|de)[-a-zA-Z0-9()@:%_+.~#?&//=]*\b/gi;
  }

  format(chat, str) {
    if (!chat.config.amazonTags) {
      return str;
    }

    const injectedStr = str.replace(this.amazonLinkRegex, (amazonLink) => {
      try {
        const parsedAmazonLink = new URL(amazonLink);

        const tag = chat.config.amazonTags[parsedAmazonLink.host];
        if (!tag) {
          return amazonLink;
        }

        parsedAmazonLink.searchParams.set('tag', tag);
        return parsedAmazonLink.toString();
      } catch {
        return amazonLink;
      }
    });

    return injectedStr;
  }
}
