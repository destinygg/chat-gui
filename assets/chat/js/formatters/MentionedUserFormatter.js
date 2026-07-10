export default class MentionedUserFormatter {
  format(chat, str, message = null) {
    // Wrap any @-prefixed token so it's clickable, whether or not the user is
    // connected (or even exists — the user-info menu resolves it, showing "not
    // found" when it doesn't). Anchored on start/whitespace/&gt; before the @
    // (so it never matches inside a URL or email) with a boundary after (so it
    // never runs into adjacent markup emitted by the url/emote formatters, which
    // run earlier). The @ is kept outside the span so click/context handlers
    // read a clean nick.
    let result = str.replace(
      /(^|\s|&gt;)@(\w{3,20})(?=$|\s|[.?!,'])/gim,
      '$1@<span class="chat-user">$2</span>',
    );

    // Also wrap bare (no-@) mentions of currently-connected users.
    if (message && message.mentioned && message.mentioned.length > 0) {
      result = result.replace(
        new RegExp(
          `((?:^|\\s)|&gt;)(${message.mentioned.join('|')})(?=$|\\s|[.?!,'])`,
          'igm',
        ),
        `$1<span class="chat-user">$2</span>`,
      );
    }

    return result;
  }
}
