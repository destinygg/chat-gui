export default class EmoteFormatter {
  format(chat, str) {
    const regex = chat.emoteService.emoteRegex;

    if (regex != null) {
      return str.replace(regex, '$1<div title="$2" class="emote $2">$2 </div>');
    }
    return str;
  }
}
