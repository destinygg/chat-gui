export default class EmoteService {
  emotes = new Map();

  regexForEmotes(emotes) {
    const prefixes = [...emotes].map((e) => e.prefix);
    return new RegExp(`(^|\\s)(${prefixes.join('|')})(?=$|\\s)`, 'gm');
  }

  emoteRegexForUser(user) {
    if (user.isPrivileged()) return this.regexForEmotes(this.emotes.values());

    let emotes = [...this.emotes.values()].filter(
      (e) => e.minimumSubTier <= user.subTier && !e.twitch
    );

    if (user.isTwitchSub()) {
      emotes = emotes.concat([...this.emotes.values()].filter((e) => e.twitch));
    }

    return this.regexForEmotes(emotes);
  }

  get prefixes() {
    return [...this.emotes.keys()];
  }

  get systemEmoteRegex() {
    return this.regexForEmotes(this.emotes.values());
  }

  get twitchEmotePrefixes() {
    return this.emotes.filter((e) => e.twitch).map((e) => e.prefix);
  }

  getEmote(emote) {
    if (this.emotes.has(emote)) return this.emotes.get(emote);
    return null;
  }

  setEmotes(emotes) {
    emotes.forEach((e) => {
      this.emotes.set(e.prefix, e);
    });
  }

  emotePrefixesForTier(tier) {
    return [...this.emotes.values()]
      .filter((e) => e.minimumSubTier === tier && !e.twitch)
      .map((e) => e.prefix);
  }

  canUserUseEmote(user, text) {
    const emote = this.getEmote(text);
    if (emote) {
      return user.subTier >= emote.minimumSubTier;
    }
    return false;
  }
}
