import ChatInputNode from './ChatInputNode';

export default class ChatInputTextNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'text', value);
  }

  render() {
    const array = this.value
      .replace(/</gm, '&lt;')
      .replace(/>/gm, '&gt;')
      .replace(/\s/gm, '&nbsp;')
      .split(/(.+?(?:&nbsp;+?(?!&nbsp;)|$))/)
      .filter((v) => v !== '')
      .map((v) => `<span>${v}</span>`);

    if (array.length < this.element.children().length) {
      const size = this.element.children().length - array.length;
      for (let i = 0; i < size; i++) {
        const index = this.element.children().length - 1 - i;
        this.element.children().eq(index).remove();
      }
    }

    let newNodes = 0;
    [...array].forEach((html, i) => {
      const index = i + newNodes;
      const el = this.element.children().eq(index);
      if (el.length === 0) {
        if (index === 0) {
          this.element.html(html);
        } else {
          this.element
            .children()
            .eq(index - 1)
            .after(html);
        }
        newNodes += 1;
      } else if (el[0].outerHTML !== html) {
        el[0].outerHTML = html;
      }
    });
  }
}
