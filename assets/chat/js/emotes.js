export default class EmoteService {
  tiers = new Set();

  emotesMapped = new Map();

  emotes = [];

  regexForEmotes(emotes) {
    const prefixes = emotes.map((e) => e.prefix);
    return new RegExp(`(^|\\s)(${prefixes.join('|')})(?=$|\\s)`, 'gm');
  }

  emoteRegexForUser(user) {
    const emotes = this.emotesForUser(user);
    return this.regexForEmotes(emotes);
  }

  emotesForUser(user) {
    if (user.isPrivileged()) return this.emotes;

    let emotes = this.emotes.filter(
      (e) => e.minimumSubTier <= user.subTier && !e.twitch,
    );

    if (user.isTwitchSub()) {
      emotes = emotes.concat(this.emotes.filter((e) => e.twitch));
    }

    return emotes;
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

  hasEmote(emote) {
    return this.emotesMapped.has(emote);
  }

  getEmote(emote) {
    return this.emotesMapped.get(emote);
  }

  setEmotes(emotes) {
    this.emotes = emotes;
    emotes.forEach((e) => {
      this.tiers.add(e.minimumSubTier);
      this.emotesMapped.set(e.prefix, e);
    });
    this.tiers = Array.from(this.tiers).sort((a, b) => a - b);
  }

  emotePrefixesForTier(tier) {
    return this.emotes
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
