export default class EmbedHashFormatter {
  constructor(chat, messageBuilder) {
    this.chat = chat;
    this.messageBuilder = messageBuilder;
    this.hasHttp = /^http[s]?:\/{0,2}/;
    this.youtubeLiveRegex = /^live\/([a-zA-z0-9_]{11})$/;
    this.twitchClipRegex = /^[^/]+\/clip\/([a-zA-z0-9-]*)$/;
    this.twitchVODRegex = /^videos\/(\d+)$/;
    this.rumbleEmbedRegex = /^embed\/([a-z0-9]+)\/?$/;
  }

  format(invalidLinkMessage, urlString) {
    const url = new URL(
      urlString.match(this.hasHttp) ? urlString : `https://${urlString}`
    );
    const pathname = url.pathname.slice(1);
    let match;
    switch (url.hostname) {
      case 'www.twitch.tv':
      case 'twitch.tv':
        match = pathname.match(this.twitchClipRegex);
        if (match) {
          return `#twitch-clip/${match[1]}`;
        }
        match = pathname.match(this.twitchVODRegex);
        if (match) {
          return `#twitch-vod/${match[1]}`;
        }
        return `#twitch/${pathname}`;
      case 'clips.twitch.tv':
        return `#twitch-clip/${pathname}`;
      case 'www.youtube.com':
      case 'youtube.com':
        match = pathname.match(this.youtubeLiveRegex);
        if (match) {
          return `#youtube/${match[1]}`;
        }
        return `#youtube/${url.searchParams.get('v')}`;
      case 'www.youtu.be':
      case 'youtu.be':
        return `#youtube/${pathname}`;
      case 'www.rumble.com':
      case 'rumble.com':
        match = pathname.match(this.rumbleEmbedRegex);
        if (match) {
          return `#rumble/${match[1]}`;
        }
        if (this.chat) {
          this.messageBuilder
            .error(
              'Rumble links have to be embed links - https://rumble.com/embed/<id>'
            )
            .into(this.chat);
        }

        return null;

      default:
        if (this.chat && this.messageBuilder) {
          this.messageBuilder
            .error(`Invalid link - ${invalidLinkMessage}`)
            .into(this.chat);
          this.messageBuilder
            .info(
              'Valid links: Twitch Streams, Twitch VODs, Twitch Clips, Youtube Videos, Vimeo Videos, Rumble Videos.'
            )
            .into(this.chat);
        }
        return null;
    }
  }
}
