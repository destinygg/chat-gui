import { KEYCODES, isKeyCode, getKeyCode } from './const';
import Caret from './caret';
import ChatInputInstanceHistory from './inputInstanceHistory';

class ChatInput {
  constructor(chat) {
    this.chat = chat;
    this.ui = this.chat.ui.find('#chat-input-control');
    this.bgText = this.ui.attr('placeholder');

    this.selectBase = -1;
    this.previousValueLength = 0;
    this.caret = new Caret(this.ui);
    this.history = new ChatInputInstanceHistory();
    this.nodes = [];
    this.value = '';

    this.ui.on('mouseup', () => {
      this.caret.get();
      const { start, end } = this.caret.getSelectionRange(true);
      if (start > end) this.selectBase = end;
      else if (start < end) this.selectBase = start;
      else this.selectBase = -1;
    });

    this.ui.on('keypress', (e) => {
      if (!isKeyCode(e, KEYCODES.ENTER) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const keycode = getKeyCode(e);
        const char = String.fromCharCode(keycode) || '';
        if (char.length > 0) {
          this.caretOrSelectReplace(0, char);
          this.render();
        }
      }
    });

    this.ui.on('keydown', (e) => {
      if (isKeyCode(e, KEYCODES.TAB)) e.preventDefault();
      if (isKeyCode(e, KEYCODES.BACKSPACE)) {
        e.preventDefault();
        this.caretOrSelectReplace(-1);
        this.render();
      }

      const left = isKeyCode(e, KEYCODES.LEFT);
      const right = isKeyCode(e, KEYCODES.RIGHT);
      if (left || right) {
        e.preventDefault();
        const caret = this.caret.get();
        if ((left && caret > 0) || (right && caret < this.value.length)) {
          if (e.shiftKey) {
            let { start, end } = this.caret.getSelectionRange(true);
            if (start === end || this.selectBase === -1) {
              if (left) {
                this.selectBase = start;
                start -= 1;
              }
              if (right) {
                this.selectBase = end;
                end += 1;
              }
            } else if (this.selectBase === start) {
              if (left) end -= 1;
              if (right) end += 1;
            } else if (this.selectBase === end) {
              if (left) start -= 1;
              if (right) start += 1;
            }
            if (start < 0) start = 0;
            if (end > this.value.length) end = this.value.length;
            this.caret.setSelectionRange(start, end, this.nodes);
          } else {
            this.selectBase = -1;
            const { nodeIndex } = this.caret.getNodeIndex(
              caret + (left ? -1 : 1),
              this.nodes
            );
            if (this.nodes[nodeIndex].type === 'emote') {
              const len = this.nodes[nodeIndex].value.length + 1;
              this.caret.set(caret + (left ? -len : len), this.nodes);
            } else {
              this.caret.set(caret + (left ? -1 : 1), this.nodes);
            }
          }
        }
      }

      if (e.ctrlKey && isKeyCode(e, 90)) {
        if (this.history.undo()) {
          this.loadInstance();
        }
      }
      if (e.ctrlKey && isKeyCode(e, 89)) {
        if (this.history.redo()) {
          this.loadInstance();
        }
      }
    });

    this.ui.on('keyup', (e) => {
      if (
        !(e.ctrlKey && isKeyCode(e, 90)) &&
        !(e.ctrlKey && isKeyCode(e, 89))
      ) {
        this.history.post(this.value, this.caret.stored, window.getSelection());
      }
    });

    this.ui.on('cut', (e) => {
      e.preventDefault();
      if (window.getSelection().toString().length > 0) {
        navigator.clipboard.writeText(window.getSelection().toString());
        this.caretOrSelectReplace();
        this.render();
      }
    });

    this.ui.on('paste', (e) => {
      e.preventDefault();
      const paste = e.originalEvent.clipboardData.getData('text/plain');
      if (paste.length > 0) {
        this.caretOrSelectReplace(0, paste);
        this.render();
      }
    });

    this.render();
  }

  loadInstance() {
    const data = this.history.get();
    this.previousValueLength = this.value.length;
    this.value = data.value;
    this.render();

    this.caret.set(data.caret, this.nodes);

    const range = new Range();
    const selection = window.getSelection();
    range.setStart(data.selection.start.node, data.selection.start.offset);
    range.setEnd(data.selection.end.node, data.selection.end.offset);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  caretOrSelectReplace(modifier = 0, value = '') {
    const caret = this.caret.get();
    this.previousValueLength = this.value.length;
    if (window.getSelection().toString().length === 0) {
      this.value =
        this.value.substring(0, caret + modifier) +
        value +
        this.value.substring(caret);
    } else {
      this.value =
        this.value.substring(
          0,
          caret - window.getSelection().toString().length
        ) +
        value +
        this.value.substring(caret);
    }
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
          this.nodes.push({ type: 'text', value: nodeText });
          nodeText = '';
        }
        this.nodes.push({ type: emote ? 'emote' : 'user', value });
      }
      if (emote) {
        text += `<div data-type="emote" data-emote="${emote.prefix}" class="msg-chat"><span title="${emote.prefix}" class="emote ${emote.prefix}">${emote.prefix}</span></div>`;
      } else if (user) {
        text += `<div data-type="user" data-username="${username}" class="msg-chat"><span class="user ${this.chat.users
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

    if (nodeText !== '') this.nodes.push({ type: 'text', value: nodeText });

    text = text.replace(/(&nbsp;)(?!&nbsp;|$)/gm, ' ');

    this.ui.html(text);
    this.ui.attr('data-input', this.value);

    const difference = this.value.length - this.previousValueLength;
    this.caret.set(prevCaret + difference, this.nodes);

    this.chat.adjustInputHeight();
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
