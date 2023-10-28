export default class EmoteService {
  emoteTiers = new Set();

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

  get tiers() {
    return Array.from(this.emoteTiers).sort((a, b) => a - b);
  }

  getEmote(emote) {
    return this.emotesMapped.get(emote);
  }

  setEmotes(emotes) {
    this.emoteTiers = new Set();
    this.emotesMapped = new Map();
    this.emotes = emotes;
    emotes.forEach((e) => {
      this.emoteTiers.add(e.minimumSubTier);
      this.emotesMapped.set(e.prefix, e);
    });
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
