export default class SuspostFormatter {
  format(chat, str, message = null) {
    const u = message?.user;
    if ((u?.isPrivileged() || u?.isSubscriber()) && str.indexOf('ඞ') === 0) {
      return `<span class="sus">${str}</span>`;
    }

    return str;
  }
}
