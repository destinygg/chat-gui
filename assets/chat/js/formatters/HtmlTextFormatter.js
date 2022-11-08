const el = document.createElement('div');

export default class HtmlTextFormatter {
  format(chat, str /* , message=null */) {
    el.textContent = str;
    return el.innerHTML;
  }
}
