import { KEYCODES, isKeyCode, getKeyCode } from './const';
import Caret from './caret';

class ChatInput {
  constructor(chat) {
    this.chat = chat;
    this.ui = this.chat.ui.find('#chat-input-control');
    this.bgText = this.ui.attr('placeholder');

    this.startArrowSelect = { node: null, offset: 0 };
    this.previousValueLength = 0;
    this.caret = new Caret(this.ui);
    this.nodes = [];
    this.value = '';

    this.ui.on('mouseup', () => this.caret.get());

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
          const { nodeIndex } = this.caret.getNodeIndex(
            caret + (left ? -1 : 1),
            this.nodes
          );
          if (e.shiftKey) {
            const selection = window.getSelection();
            const start = {
              node: selection.anchorNode,
              offset: selection.anchorOffset,
            };
            const end = {
              node: selection.focusNode,
              offset: selection.focusOffset,
            };

            if (start.offset === end.offset || !this.startArrowSelect.node) {
              if (left) {
                this.startArrowSelect = end;
                start.offset -= 1;
              }
              if (right) {
                this.startArrowSelect = start;
                end.offset += 1;
              }
            } else if (this.startArrowSelect.offset < end.offset) {
              if (left) end.offset -= 1;
              if (right) end.offset += 1;
            } else if (this.startArrowSelect.offset > start.offset) {
              if (left) start.offset -= 1;
              if (right) start.offset += 1;
            }

            if (start.offset < 0) {
              const newNode = this.caret.getTextNode(
                start.node.previousSibling
              );
              if (newNode) {
                start.node = newNode;
                start.offset = newNode.textContent.length;
              }
            }

            if (end.offset > end.node.textContent.length) {
              const newNode = this.caret.getTextNode(end.node.nextSibling);
              if (newNode) {
                end.node = newNode;
                end.offset = 0;
              }
            }

            const range = new Range();
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
          } else {
            this.startArrowSelect.node = null;
            this.startArrowSelect.offset = 0;
            if (this.nodes[nodeIndex].type === 'emote') {
              const len = this.nodes[nodeIndex].value.length + 1;
              this.caret.set(caret + (left ? -len : len), this.nodes);
            } else {
              this.caret.set(caret + (left ? -1 : 1), this.nodes);
            }
          }
        }
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
