export default class BadWordsCensorshipFormatter {
  constructor() {
    this.badWordsRegex =
      /(fuck|shit|cunt|whore|bitch|faggot|fag|nigger|nigga|gusano|cracker|rape)/gi;
  }

  format(chat, str /* , message=null */) {
    if (chat.settings.get('censorbadwords')) {
      return str.replace(this.badWordsRegex, (match) =>
        '*'.repeat(match.length)
      );
    }

    return str;
  }
}
