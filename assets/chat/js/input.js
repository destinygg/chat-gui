import { KEYCODES, isKeyCode, getKeyCode } from './const';
import Caret from './caret';

class ChatInput {
  constructor(chat) {
    this.chat = chat;
    this.ui = this.chat.ui.find('#chat-input-control');
    this.bgText = this.ui.attr('placeholder');

    this.previousValueLength = 0;
    this.caret = new Caret(this.ui);
    this.nodes = [];
    this.value = '';

    this.ui.on('mouseup', () => this.caret.get());

    this.ui.on('keypress', (e) => {
      if (!isKeyCode(e, KEYCODES.ENTER) && !e.ctrlKey) {
        e.preventDefault();
        const keycode = getKeyCode(e);
        const char = String.fromCharCode(keycode) || '';
        if (char.length > 0) {
          const caret = this.caret.get();
          this.previousValueLength = this.value.length;
          this.value =
            this.value.substring(0, caret) + char + this.value.substring(caret);
          this.render();
        }
      }
    });

    this.ui.on('keydown', (e) => {
      if (isKeyCode(e, KEYCODES.BACKSPACE)) {
        e.preventDefault();
        const caret = this.caret.get();
        this.previousValueLength = this.value.length;
        if (window.getSelection().toString().length === 0) {
          this.value =
            this.value.substring(0, caret - 1) + this.value.substring(caret);
        } else {
          this.value =
            this.value.substring(
              0,
              caret - window.getSelection().toString().length
            ) + this.value.substring(caret);
        }
        this.render();
      }
      if (isKeyCode(e, KEYCODES.TAB)) {
        e.preventDefault();
      }
    });

    this.ui.on('paste', (e) => {
      e.preventDefault();
      this.value += e.originalEvent.clipboardData.getData('text/plain');
      this.render();
    });

    this.render();
  }

  val(value = null) {
    if (value || value === '') {
      this.value = value;
      this.render();
      return this;
    }
    return this.value;
  }

  get placeholder() {
    return this.bgText;
  }

  set placeholder(placeholder) {
    this.bgText = placeholder;
    this.ui.attr('placeholder', this.bgText);
  }

  render() {
    this.nodes = [];
    const prevCaret = this.caret.get();
    let text = '';
    let nodeText = '';

    [...this.value.split(/(\s+?)/g)].forEach((value) => {
      const emote = this.chat.emoteService.getEmote(value, false);
      const username = value.startsWith('@')
        ? value.substring(1).toLowerCase()
        : value.toLowerCase();
      const user = this.chat.users.has(username);
      if (emote || user) {
        if (nodeText !== '') {
          this.nodes.push(nodeText);
          nodeText = '';
        }
        this.nodes.push(value);
      }
      if (emote) {
        text += `<div data-type="emote" data-emote="${emote.prefix}" class="msg-chat"><span title="${emote.prefix}" class="emote ${emote.prefix}">${emote.prefix}</span></div>`;
      } else if (user) {
        text += `<div data-type="user" data-username="${username}"><span class="user ${this.chat.users
          .get(username)
          .features.join(' ')}">${value}</span></div>`;
      } else {
        text += value
          .replace(/</gm, '&lt;')
          .replace(/>/gm, '&gt;')
          .replace(/\s/gm, '&nbsp;');
        nodeText += value;
      }
    });

    if (nodeText !== '') this.nodes.push(nodeText);

    this.ui.html(text);
    this.ui.attr('data-input', this.value);

    const difference = this.value.length - this.previousValueLength;
    this.caret.set(prevCaret + difference, this.nodes);
  }

  focus() {
    this.ui.focus();
    this.caret.set(this.caret.stored, this.nodes);
    return this;
  }

  // passthrough functions.
  on(...args) {
    return this.ui.on(...args);
  }

  css(...args) {
    return this.ui.css(...args);
  }

  prop(...args) {
    return this.ui.prop(...args);
  }

  is(...args) {
    return this.ui.is(...args);
  }
}

export default ChatInput;
