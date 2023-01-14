import $ from 'jquery';
import { KEYCODES, isKeyCode, getKeyCode } from './const';
import Trie from './Trie';

const maxResults = 20;
function sortResults(a, b) {
  if (!a || !b) return 0;

  // order emotes second
  if (a.isEmote !== b.isEmote) return a.isEmote && !b.isEmote ? -1 : 1;

  // order according to recency third
  if (a.weight !== b.weight) return a.weight > b.weight ? -1 : 1;

  // order lexically fourth
  const lowerA = a.value.toLowerCase();
  const lowerB = b.value.toLowerCase();

  if (lowerA === lowerB) return 0;

  return lowerA > lowerB ? 1 : -1;
}

class ChatAutoComplete {
  constructor(chat) {
    this.chat = chat;
    this.ui = this.chat.ui.find('#chat-auto-complete');
    this.input = this.chat.input;

    this.timer = null;
    this.hasAt = false;
    this.hasColon = false;
    this.rangeStart = 0;
    this.rangeEnd = 0;
    this.message = '';
    this.trie = new Trie();
    this.results = [];
    this.tabIndex = -1;

    this.input.on('keypress', (e) => {
      const keycode = getKeyCode(e);
      const char = String.fromCharCode(keycode) || '';
      if (char.length > 0) {
        this.tabIndex = -1;
        this.ui.css('left', 0);
        this.search();
      }
    });

    this.input.on('keydown', (e) => {
      if (isKeyCode(e, KEYCODES.UP) || isKeyCode(e, KEYCODES.DOWN))
        this.reset();
      if (isKeyCode(e, KEYCODES.BACKSPACE)) this.search();
      if (this.results.length > 0) {
        if (isKeyCode(e, KEYCODES.TAB) || isKeyCode(e, KEYCODES.RIGHT)) {
          e.preventDefault();
          if (this.tabIndex + 1 > this.results.length - 1) {
            this.tabIndex = 0;
          } else {
            this.tabIndex += 1;
          }
          this.select(this.tabIndex);
        }
        if (isKeyCode(e, KEYCODES.LEFT)) {
          e.preventDefault();
          if (this.tabIndex - 1 < 0) {
            this.tabIndex = this.results.length - 1;
          } else {
            this.tabIndex -= 1;
          }
          this.select(this.tabIndex);
        }
      }
    });

    this.ui.on('click', 'li', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      this.tabIndex = index;
      this.select(index);
    });

    window.addEventListener('resize', () => {
      if (this.results.length > 0) {
        this.position();
      }
    });
  }

  select(index) {
    this.position();

    const pre = this.message.substring(0, this.rangeStart);
    const post = this.message.substring(this.rangeEnd);
    const atEnd = this.input.caret.isAtEnd(this.input.val());
    this.input.val(
      `${pre}${this.hasAt ? '@' : ''}${this.results[index].value}${
        atEnd ? ' ' : ''
      }${post}`
    );

    if (atEnd) this.input.caret.set();

    this.render();
  }

  position() {
    const padding = 8.5838;
    const list = $(this.ui[0].children[0]);
    const chatWidth = this.chat.ui.width();
    const listWidth = list.width();
    if (listWidth <= chatWidth) {
      this.ui.css('left', 0);
    } else {
      const items = list.children();
      let leftWidth = 0;
      for (let i = 0; i <= this.tabIndex; i++) {
        leftWidth += $(items[i]).width() + padding;
      }

      const itemWidth = $(items[this.tabIndex]).width() + padding;
      const left = leftWidth - (chatWidth / 2 - itemWidth / 2);
      const right = listWidth - left + itemWidth / 2;
      if (left <= 0) {
        this.ui.css('left', 0);
      } else if (right <= chatWidth) {
        this.ui.css('left', -(listWidth - chatWidth + padding * 2));
      } else {
        this.ui.css('left', -left);
      }
    }
  }

  getWord(words) {
    let len = 0;
    for (let n = 0; n < words.length; n++) {
      len += words[n].length;
      if (this.input.caret.get() <= len) {
        return {
          wordIndex: n,
          startIndex: this.input.caret.get() - words[n].length,
          endIndex: this.input.caret.get(),
        };
      }
    }
    return {
      wordIndex: 0,
      startIndex: this.input.caret.get() - words[0].length,
      endIndex: this.input.caret.get(),
    };
  }

  search() {
    this.message = this.input.val();
    const words = this.message.split(/(\s+?)/g);
    const { wordIndex, startIndex, endIndex } = this.getWord(words);
    this.rangeStart = startIndex;
    this.rangeEnd = endIndex;
    let currentWord = words[wordIndex];
    if (currentWord !== '') {
      if (currentWord.startsWith('@')) {
        this.hasAt = true;
        this.hasColon = false;
        currentWord = currentWord.substring(1);
        this.results = this.trie
          .all(currentWord)
          .filter((data) => !data.isEmote);
      } else if (currentWord.startsWith(':')) {
        this.hasAt = false;
        this.hasColon = true;
        currentWord = currentWord.substring(1);
        this.results = this.trie
          .all(currentWord)
          .filter((data) => data.isEmote);
      } else {
        this.hasAt = false;
        this.hasColon = false;
        this.results = this.trie.all(currentWord);
      }
      this.results.sort(sortResults).slice(0, maxResults);
    } else {
      this.results = [];
    }
    this.tabIndex = -1;
    this.render();
  }

  add(str, isEmote = false, weight = 1) {
    this.trie.add(str, { value: str, isEmote, weight });
  }

  remove(str) {
    this.trie.remove(str);
  }

  render() {
    this.chat.ui.toggleClass('chat-autocomplete-in', this.results.length > 0);
    this.ui.toggleClass('active', this.results.length > 0);
    if (this.results.length > 0) {
      const html = [...this.results]
        .map(
          (data, index) =>
            `<li data-index="${index}"${
              index === this.tabIndex ? ` class="active"` : ''
            }>${data.value}</li>`
        )
        .join('');
      this.ui[0].children[0].innerHTML = html;
      this.timeout();
    }
  }

  reset() {
    this.ui.css('left', 0);
    this.results = [];
    this.tabIndex = -1;
    this.render();
  }

  timeout() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reset(), 15000);
  }
}

export default ChatAutoComplete;
