import makeSafeForRegex from './regex';

export default class EmoteService {
  tiers = new Set();

  emotesMapped = new Map();

  emotes = [];

  regexForEmotes(emotes) {
    // Escaped, so a prefix can't break or slow down matching for everyone.
    const prefixes = emotes.map((e) => makeSafeForRegex(e.prefix));
    return new RegExp(`(^|\\s)(${prefixes.join('|')})(?=$|\\s)`, 'gm');
  }

  emoteRegexForUser(user) {
    const emotes = this.emotesForUser(user);
    return this.regexForEmotes(emotes);
  }

  emotesForUser(user) {
    if (user.isPrivileged()) {
      return this.emotes;
    }

    return this.emotes.filter((e) =>
      e.patreonOnly ? user.patreonMember : e.minimumSubTier <= user.subTier,
    );
  }

  get prefixes() {
    return this.emotes.map((e) => e.prefix);
  }

  get systemEmoteRegex() {
    return this.regexForEmotes(this.emotes);
  }

  hasEmote(emote) {
    return this.emotesMapped.has(emote);
  }

  getEmote(emote) {
    return this.emotesMapped.get(emote);
  }

  setEmotes(emotes) {
    this.emotes = emotes;
    this.tiers = new Set();
    this.emotesMapped = new Map();
    emotes.forEach((e) => {
      this.tiers.add(e.minimumSubTier);
      this.emotesMapped.set(e.prefix, e);
    });
    this.tiers = Array.from(this.tiers).sort((a, b) => a - b);
  }

  emotePrefixesForTier(tier) {
    return this.emotes
      .filter((e) => e.minimumSubTier === tier && !e.patreonOnly)
      .map((e) => e.prefix);
  }

  get patreonEmotePrefixes() {
    return this.emotes.filter((e) => e.patreonOnly).map((e) => e.prefix);
  }

  canUserUseEmote(user, text) {
    const emote = this.getEmote(text);
    return emote !== undefined && this.emotesForUser(user).includes(emote);
  }
}
