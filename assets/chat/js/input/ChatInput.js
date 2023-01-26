import $ from 'jquery';
import { KEYCODES, isKeyCode, getKeyCode } from '../const';
import { BIGSCREENREGEX, LINKREGEX } from '../formatters';
import Caret from './Caret';
import ChatInputSelection from './Selection';
import ChatInputInstanceHistory from './ChatInputInstanceHistory';
import {
  ChatInputEmoteNode,
  ChatInputTextNode,
  ChatInputUserNode,
  ChatInputLinkNode,
} from './nodes';

export default class ChatInput {
  constructor(chat) {
    this.chat = chat;
    this.ui = this.chat.ui.find('#chat-input-control');
    this.bgText = this.ui.attr('placeholder');

    this.urlregex = new RegExp(LINKREGEX, 'i');
    this.embedregex = new RegExp(BIGSCREENREGEX);

    this.caret = new Caret(this.ui);
    this.selection = new ChatInputSelection(this);
    this.history = new ChatInputInstanceHistory(this);
    this.loadHistory = false;

    this.nodes = [];

    this.oldInputValue = '';
    this.inputValue = '';

    this.ui.on('mouseup', () => {
      this.selection.update();
    });

    this.ui.on('keypress', (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        if (!isKeyCode(e, KEYCODES.ENTER)) {
          e.preventDefault();
          const keycode = getKeyCode(e);
          const char = String.fromCharCode(keycode) || '';
          if (this.selection.hasSelection()) this.selection.remove();
          if (char.length > 0) this.modify(0, char);
        } else if (!e.shiftKey) {
          e.preventDefault();
          this.chat.control.emit('SEND', this.value.trim());
          this.val('').focus();
          this.history.empty();
        }
      }
    });

    this.ui.on('keydown', (e) => {
      if (isKeyCode(e, KEYCODES.TAB)) e.preventDefault();

      if (isKeyCode(e, KEYCODES.BACKSPACE)) {
        e.preventDefault();
        this.selection.update();
        if (this.selection.hasSelection()) {
          this.selection.remove();
        } else {
          this.modify(-1);
        }
      }

      if (
        (e.ctrlKey && isKeyCode(e, 65)) || // CTRL + A
        isKeyCode(e, KEYCODES.UP) ||
        isKeyCode(e, KEYCODES.DOWN)
      ) {
        this.selection.update();
      }

      const left = isKeyCode(e, KEYCODES.LEFT);
      const right = isKeyCode(e, KEYCODES.RIGHT);
      if (left || right) {
        e.preventDefault();
        this.selection.update();
        const caret = this.caret.get();
        if ((left && caret > 0) || (right && caret < this.value.length)) {
          if (e.shiftKey) {
            // let { start, end } = this.caret.getSelectionRange(true);
            // if (start === end || this.selectBase === -1) {
            //   if (left) {
            //     this.selectBase = start;
            //     start -= 1;
            //   }
            //   if (right) {
            //     this.selectBase = end;
            //     end += 1;
            //   }
            // } else if (this.selectBase === start) {
            //   if (left) end -= 1;
            //   if (right) end += 1;
            // } else if (this.selectBase === end) {
            //   if (left) start -= 1;
            //   if (right) start += 1;
            // }
            // if (start < 0) start = 0;
            // if (end > this.value.length) end = this.value.length;
            // this.caret.setSelectionRange(start, end, this.nodes);
          } else {
            this.selectBase = -1;
            const { nodeIndex } = this.caret.getNodeIndex(
              caret + (left ? -1 : 1),
              this.nodes
            );
            if (this.nodes[nodeIndex].isEmote()) {
              const len = this.nodes[nodeIndex].value.length + 1;
              this.caret.set(caret + (left ? -len : len), this.nodes);
            } else {
              this.caret.set(caret + (left ? -1 : 1), this.nodes);
            }
          }
        }
      }

      if (e.ctrlKey && isKeyCode(e, 90)) {
        if (this.history.undo()) this.history.load();
      }
      if (e.ctrlKey && isKeyCode(e, 89)) {
        if (this.history.redo()) this.history.load();
      }
    });

    this.ui.on('copy', (e) => {
      e.preventDefault();
      this.selection.update();
      if (this.selection.hasSelection()) this.selection.copy();
    });

    this.ui.on('cut', (e) => {
      e.preventDefault();
      this.selection.update();
      if (this.selection.hasSelection()) {
        this.selection.copy();
        this.selection.remove();
      }
    });

    this.ui.on('paste', (e) => {
      e.preventDefault();
      const paste = e.originalEvent.clipboardData.getData('text/plain');
      this.selection.update();
      if (paste.length > 0) {
        if (this.selection.hasSelection()) this.selection.remove();
        this.modify(0, paste);
      }
    });

    this.render();
  }

  modify(modifier = 0, value = '') {
    const caret = this.caret.get();
    if (this.nodes.length === 0) {
      const element = $('<span>').appendTo(this.ui);
      this.nodes = [new ChatInputTextNode(this, element, '')];
    }
    const { nodeIndex, offset } = this.getCurrentNode();
    if (value === ' ' && !this.nodes[nodeIndex].isText()) {
      const element = $('<span>').insertAfter(this.nodes[nodeIndex].element);
      this.nodes.splice(
        nodeIndex + 1,
        0,
        new ChatInputTextNode(this, element, ' ')
      );
    } else {
      this.nodes[nodeIndex].modify(offset, modifier, value);
    }

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

    if (value.length > 1) {
      [...this.nodes[nodeIndex].value.split(/(\s+?)/g)]
        .filter((v) => v !== '')
        .reverse()
        .forEach((word) => {
          this.addNode(word, nodeIndex, false);
        });
      this.nodes[nodeIndex].value = '';
      this.render();
    } else {
      this.checkCurrentWord(caret);
    }
  }

  checkValid(caret) {
    const { nodeIndex } = this.getCurrentNode(caret - 1);
    if (this.nodes[nodeIndex].isText()) return;

    const valid = this.nodes[nodeIndex].isValid();
    if (!valid) {
      const { value } = this.nodes[nodeIndex];
      if (nodeIndex === 0 || !this.nodes[nodeIndex - 1].isText()) {
        const element = $('<span>').insertBefore(this.nodes[nodeIndex].element);
        this.nodes.splice(
          nodeIndex,
          0,
          new ChatInputTextNode(this, element, value)
        );
        this.nodes[nodeIndex + 1].value = '';
      } else {
        this.nodes[nodeIndex - 1].modify(
          this.nodes[nodeIndex - 1].value.length,
          0,
          value
        );
        this.nodes[nodeIndex].value = '';
      }
    }
  }

  addNode(word, nodeIndex, split = true) {
    const element = $('<span>').insertAfter(this.nodes[nodeIndex].element);

    const emote = this.chat.emoteService.getEmote(word, false);
    if (emote) {
      if (split) {
        this.insertNode(new ChatInputEmoteNode(this, element, emote.prefix));
      } else {
        this.nodes.splice(
          nodeIndex + 1,
          0,
          new ChatInputEmoteNode(this, element, emote.prefix)
        );
      }
      return;
    }

    const username = word.startsWith('@')
      ? word.substring(1).toLowerCase()
      : word.toLowerCase();
    const user = this.chat.users.get(username);
    if (user) {
      if (split) {
        this.insertNode(new ChatInputUserNode(this, element, word));
      } else {
        this.nodes.splice(
          nodeIndex + 1,
          0,
          new ChatInputUserNode(this, element, word)
        );
      }
      return;
    }

    const embed = this.embedregex.test(word);
    const url = this.urlregex.test(word);
    if (embed || url) {
      if (split) {
        this.insertNode(new ChatInputLinkNode(this, element, word));
      } else {
        this.nodes.splice(
          nodeIndex + 1,
          0,
          new ChatInputLinkNode(this, element, word)
        );
      }
      return;
    }

    if (!split) {
      this.nodes.splice(
        nodeIndex + 1,
        0,
        new ChatInputTextNode(this, element, word)
      );
    } else element.remove();
  }

  checkCurrentWord(caret = this.caret.get()) {
    const { nodeIndex } = this.getCurrentNode(caret);
    const word = this.getCurrentWord(caret);
    if (word && word !== ' ') this.addNode(word, nodeIndex);
    this.render(caret);
  }

  joinTextNodes(index) {
    if (index <= 0) return;
    const left = this.nodes[index - 1];
    const right = this.nodes[index];
    if (left.isText() && right.isText()) {
      this.nodes[index - 1].value =
        this.nodes[index - 1].value + this.nodes[index].value;
      this.nodes[index].element.remove();
      this.nodes.splice(index, 1);
    }
    this.joinTextNodes(index - 1);
  }

  insertNode(node) {
    const { nodeIndex, offset } = this.getCurrentNode();
    const split = this.nodes[nodeIndex].removeAndSplit(offset);
    if (split !== '') {
      const element = $('<span>').insertAfter(node.element);
      this.nodes.splice(
        nodeIndex + 1,
        0,
        new ChatInputTextNode(this, element, split)
      );
    }
    this.nodes.splice(nodeIndex + 1, 0, node);
  }

  val(value = null) {
    if (!value) return this.value;

    this.value = value;
    this.nodes = [];
    this.ui.empty();

    if (value === '') {
      this.render();
      return this;
    }

    const element = $('<span>').appendTo(this.ui);
    this.nodes = [new ChatInputTextNode(this, element, '')];
    [...this.value.split(/(\s+?)/g)]
      .filter((v) => v !== '')
      .reverse()
      .forEach((word) => {
        this.addNode(word, 0, false);
      });

    this.render();

    this.caret.setEnd();

    return this;
  }

  get value() {
    return this.inputValue;
  }

  set value(val) {
    const caret = this.caret.get();
    if (!this.loadHistory) {
      this.history.set(
        this.nodes,
        this.value,
        this.ui.html(),
        caret,
        this.selection.get()
      );
    } else {
      this.loadHistory = true;
    }
    this.oldInputValue = this.inputValue;
    this.inputValue = val;
  }

  get placeholder() {
    return this.bgText;
  }

  set placeholder(placeholder) {
    this.bgText = placeholder;
    this.ui.attr('placeholder', this.bgText);
  }

  render(prevCaret = this.caret.get()) {
    if (this.nodes.length > 0) {
      this.checkValid(prevCaret);

      for (let index = this.nodes.length - 1; index >= 0; index--) {
        if (this.nodes[index].value === '') {
          this.nodes[index].element.remove();
          this.nodes.splice(index, 1);
        }
      }

      this.joinTextNodes(this.nodes.length - 1);

      this.ui.toggleClass(
        'green',
        this.value.startsWith('>') || this.value.startsWith('/me >')
      );
      this.ui.toggleClass('italic', this.value.startsWith('/me '));

      [...this.nodes].forEach((node) => node.render());
    }

    this.ui.attr('data-input', this.value);

    const difference = this.value.length - this.oldInputValue.length;
    this.caret.set(prevCaret + difference, this.nodes);

    this.adjustInputHeight();
  }

  getCurrentNode(caret = this.caret.get()) {
    return this.caret.getNodeIndex(
      caret,
      [...this.nodes].map((node) => node.value)
    );
  }

  getCurrentWord(caret) {
    if (this.nodes.length === 0) return '';
    const { nodeIndex, offset } = this.getCurrentNode(caret);

    return this.nodes[nodeIndex].getWord(offset);
  }

  adjustInputHeight() {
    const maxHeightPixels = this.ui.css('maxHeight');
    const maxHeight = parseInt(maxHeightPixels.slice(0, -2), 10);

    const pinned = this.chat.getActiveWindow()?.scrollplugin?.isPinned();

    this.ui.css('height', '');
    const calculatedHeight = this.ui.prop('scrollHeight');

    this.ui.css(
      'overflow-y',
      calculatedHeight >= maxHeight ? 'scroll' : 'hidden'
    );

    this.ui.css('height', calculatedHeight);

    if (pinned !== undefined) this.chat.getActiveWindow().updateAndPin(pinned);
  }

  focus() {
    this.ui.focus();
    this.caret.set(this.caret.stored, this.nodes);
    return this;
  }

  // passthrough on event.
  on(...args) {
    return this.ui.on(...args);
  }
}
