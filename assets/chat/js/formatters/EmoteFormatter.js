export default class EmoteFormatter {
  format(chat, str, message = null) {
    const regex =
      !message || !message.user
        ? chat.emoteService.systemEmoteRegex
        : chat.emoteService.emoteRegexForUser(message.user);

    if (regex != null) {
      return str.replace(regex, '$1<div title="$2" class="emote $2">$2 </div>');
    }
    return str;
  }
}
