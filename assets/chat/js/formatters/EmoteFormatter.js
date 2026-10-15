import escapeHtml from '../escapeHtml';

export default class EmoteFormatter {
  format(chat, str, message = null) {
    const regex =
      !message || !message.user
        ? chat.emoteService.systemEmoteRegex
        : chat.emoteService.emoteRegexForUser(message.user);

    if (regex != null) {
      // The text is already escaped, but quotes aren't, and the prefix also
      // lands in attributes.
      return str.replace(regex, (match, before, prefix) => {
        const emote = escapeHtml(prefix);
        return `${before}<div title="${emote}" class="emote ${emote}">${emote} </div>`;
      });
    }
    return str;
  }
}
