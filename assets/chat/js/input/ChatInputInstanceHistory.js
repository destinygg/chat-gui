class ChatInputInstanceHistory {
  constructor(input) {
    this.input = input;
    this.history = [
      { nodes: [], value: '', html: '', caret: 0, selection: null },
    ];
    this.index = 0;
  }

  undo() {
    if (this.index - 1 >= 0) {
      this.index -= 1;
      this.load();
    }
  }

  redo() {
    if (this.index + 1 <= this.history.length - 1) {
      this.index += 1;
      this.load();
    }
  }

  set(nodes, value, html, caret, selection) {
    if (this.index < this.history.length - 1) {
      this.history = this.history.splice(0, this.index);
    }

    this.history.push({ nodes, value, html, caret, selection });

    if (this.history.length > 25) {
      this.history = this.history.splice(this.history.length - 25, 25);
    }

    this.index = this.history.length - 1;
  }

  load() {
    if (this.index === -1) return;
    this.input.loadHistory = true;
    this.input.nodes = this.history[this.index].nodes;
    this.input.value = this.history[this.index].value;
    this.input.ui.html(this.history[this.index].html);
    this.input.caret.set(
      this.history[this.index].caret,
      this.history[this.index].nodes
    );
    this.input.selection.set(this.history[this.index].selection);
  }

  empty() {
    this.history = [
      { nodes: [], value: '', html: '', caret: 0, selection: null },
    ];
    this.index = 0;
  }
}

export default ChatInputInstanceHistory;
