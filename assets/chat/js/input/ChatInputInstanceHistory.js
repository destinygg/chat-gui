class ChatInputInstanceHistory {
  constructor() {
    this.history = [{ value: '', caret: 0 }];
    this.index = 0;
  }

  undo() {
    if (this.index - 1 >= 0) {
      this.index -= 1;
      return true;
    }
    return false;
  }

  redo() {
    if (this.index + 1 <= this.history.length - 1) {
      this.index += 1;
      return true;
    }
    return false;
  }

  post(value, caret, sel) {
    if (this.index < this.history.length - 1) {
      this.history = this.history.splice(0, this.index);
    }

    const selection = {
      start: {
        node: sel.anchorNode,
        offset: sel.anchorOffset,
      },
      end: {
        node: sel.focusNode,
        offset: sel.focusOffset,
      },
    };

    this.history.push({ value, caret, selection });

    if (this.history.length > 25) {
      this.history = this.history.splice(this.history.length - 25, 25);
    }

    this.index = this.history.length - 1;
  }

  get() {
    if (this.index === -1) return null;
    return this.history[this.index];
  }

  empty() {
    this.history = [{ value: '', caret: 0 }];
    this.index = 0;
  }
}

export default ChatInputInstanceHistory;
