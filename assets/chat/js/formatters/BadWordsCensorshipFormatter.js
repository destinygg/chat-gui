export default class BadWordsCensorshipFormatter {
  constructor() {
    this.badWordsRegex =
      /(fuck|shit|cunt|whore|bitch|faggot|fag|nigger|nigga|gusano|cracker|rape)/gi;
    this.parser = new DOMParser();
  }

  format(chat, str /* , message=null */) {
    if (chat.settings.get('censorbadwords')) {
      try {
        const msg = this.parser.parseFromString(str, 'text/html').body;

        [...msg.childNodes].forEach((c) => {
          if (c.classList?.contains('emote')) {
            return;
          }

          c.textContent = c.textContent.replace(this.badWordsRegex, (match) =>
            '*'.repeat(match.length),
          );
        });

        return msg.innerHTML;
      } catch {
        return str;
      }
    }

    return str;
  }
}
