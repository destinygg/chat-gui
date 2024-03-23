export default class MentionedUserFormatter {
  format(chat, str, message = null) {
    if (message && message.mentioned && message.mentioned.length > 0) {
      return str.replace(
        new RegExp(
          `((?:^|\\s)@?)(${message.mentioned.join('|')})(?=$|\\s|[.?!,'])`,
          'igm',
        ),
        `$1<span class="chat-user">$2</span>`,
      );
    }
    return str;
  }
}
