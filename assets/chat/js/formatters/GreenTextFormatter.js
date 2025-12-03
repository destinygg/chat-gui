export default class GreenTextFormatter {
  format(chat, str, message = null) {
    if (
      message.user &&
      message.user.isSubscriber() &&
      str.indexOf('&gt;') === 0
    ) {
      return `<span class="greentext">${str}</span>`;
    }

    return str;
  }
}
