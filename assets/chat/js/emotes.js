export default class EmoteService {
  emotesMapped = new Map();

  emotes = [];

  regexForEmotes(emotes) {
    const prefixes = emotes.map((e) => e.prefix);
    return new RegExp(`(^|\\s)(${prefixes.join('|')})(?=$|\\s)`, 'gm');
  }

  get emoteRegex() {
    return this.regexForEmotes(this.emotes);
  }

  get prefixes() {
    return this.emotes.map((e) => e.prefix);
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
      this.emotesMapped.set(e.prefix, e);
    });
  }
}
