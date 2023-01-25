export default class ChatInputNode {
  constructor(input, element, type, value) {
    this.input = input;
    this.element = element;
    this.type = type;
    this.oldvalue = '';
    this.nodeValue = value;

    this.element.attr('spellcheck', this.type === 'text');
    this.element.attr('data-type', this.type);
    this.element.addClass(`chat-input-node-${this.type}`);
  }

  get value() {
    return this.nodeValue;
  }

  set value(val) {
    this.oldvalue = this.nodeValue;
    this.nodeValue = val;
  }

  modify(offset, modifier, value) {
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

    this.value = words.slice(0, nodeIndex).join('');

    if (nodeIndex === words.length - 1) return '';
    return words.slice(nodeIndex + 1, words.length).join('');
  }

  render(customHtml = null) {
    if (this.value === '' || this.oldvalue === this.value) return;
    this.oldvalue = this.value;

    if (customHtml) {
      this.element.html(customHtml);
    } else {
      const html = this.value
        .replace(/</gm, '&lt;')
        .replace(/>/gm, '&gt;')
        .replace(/\s/gm, '&nbsp;')
        .replace(/(&nbsp;)(?!&nbsp;|$)/gm, ' ');

      this.element.html(html);
    }
  }

  isText() {
    return this.type === 'text';
  }

  isEmote() {
    return this.type === 'emote';
  }
}
