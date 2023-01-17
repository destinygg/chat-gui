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

  post(value, caret) {
    const lastHistory = this.history[this.history.length - 1];
    if (lastHistory) {
      if (value === lastHistory.value) return;
    }

    if (this.index < this.history.length - 1) {
      this.history = this.history.splice(0, this.index);
    }

    this.history.push({ value, caret });

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
