export default class EmoteService {
  emotes = [];

  regexForEmotes(emotes) {
    const prefixes = emotes.map((e) => e.prefix);
    return new RegExp(`(^|\\s)(${prefixes.join('|')})(?=$|\\s)`, 'gm');
  }

  emoteRegexForUser(user) {
    if (user.isPrivileged()) return this.regexForEmotes(this.emotes);
    let emotes = this.emotes.filter(
      (e) => e.minimumSubTier <= user.subTier && !e.twitch
    );
    if (user.isTwitchSub())
      emotes = emotes.concat(this.emotes.filter((e) => e.twitch));
    return this.regexForEmotes(emotes);
  }

  get prefixes() {
    return this.emotes.map((e) => e.prefix);
  }

  get systemEmoteRegex() {
    return this.regexForEmotes(this.emotes);
  }

  get twitchEmotePrefixes() {
    return this.emotes.filter((e) => e.twitch).map((e) => e.prefix);
  }

  getEmote(emote, ignorecase = true) {
    return this.emotes.find((e) => {
      if (ignorecase) {
        return e.prefix.toLowerCase() === emote.toLowerCase();
      }
      return e.prefix === emote;
    });
  }

  emotePrefixesForTier(tier) {
    return this.emotes
      .filter((e) => e.minimumSubTier === tier && !e.twitch)
      .map((e) => e.prefix);
  }
}
