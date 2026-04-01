export default class EmoteFormatter {
  format(chat, str) {
    const regex = chat.emoteService.emoteRegex;

    if (regex != null) {
      return str.replace(regex, (match, space, prefix) => {
        const emote = chat.emoteService.getEmote(prefix);
        if (!emote) {
          return match;
        }
        return `${space}<div title="${prefix}" class="emote ${emote.name}" data-prefix="${prefix}">${prefix} </div>`;
      });
    }
    return str;
  }
}
