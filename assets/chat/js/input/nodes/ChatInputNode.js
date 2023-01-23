export default class ChatInputNode {
  constructor(input, element, type, value) {
    this.input = input;
    this.element = element;
    this.type = type;
    this.oldvalue = '';
    this.value = value;
  }

  modify(offset, modifier, value) {
    this.oldvalue = this.value;
    if (window.getSelection().toString().length === 0) {
      this.value =
        this.value.substring(0, offset + modifier) +
        value +
        this.value.substring(offset);
    } else {
      this.value =
        this.value.substring(
          0,
          offset - window.getSelection().toString().length
        ) +
        value +
        this.value.substring(offset);
    }
  }

  getWord(offset) {
    const words = [...this.value.split(/(\s+?)/g)].filter((v) => v !== '');
    const { nodeIndex } = this.input.caret.getNodeIndex(offset, words);

    return words[nodeIndex];
  }

  removeAndSplit(offset) {
    const words = [...this.value.split(/(\s+?)/g)].filter((v) => v !== '');
    const { nodeIndex } = this.input.caret.getNodeIndex(offset, words);

    this.oldvalue = this.value;
    this.value = words.slice(0, nodeIndex).join('');

    if (nodeIndex === words.length - 1) return '';
    return words.slice(nodeIndex + 1, words.length).join('');
  }

  render() {
    if (this.value === '') return;
    if (this.oldvalue === this.value) return;

    this.oldvalue = this.value;

    const html = this.value
      .replace(/</gm, '&lt;')
      .replace(/>/gm, '&gt;')
      .replace(/\s/gm, '&nbsp;')
      .replace(/(&nbsp;)(?!&nbsp;|$)/gm, ' ');

    this.element.html(html);
  }
}
