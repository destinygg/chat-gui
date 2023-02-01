export default class ChatInputCaret {
  constructor(input) {
    this.input = input;
    this.stored = 0;
  }

  get() {
    let caretOffset = 0;
    if (window.getSelection().rangeCount > 0) {
      const range = window.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();

      preCaretRange.selectNodeContents(this.input.ui[0]);
      preCaretRange.setEnd(range.endContainer, range.endOffset);

      caretOffset = preCaretRange.toString().length;
    }

    this.stored = caretOffset;
    return caretOffset;
  }

  set(startIndex) {
    if (startIndex >= 0) {
      if (this.input.ui[0].childNodes.length > 0) {
        const parent = this.getNodeIndex(startIndex);
        const { node, offset } = this.getTextNode(
          this.input.ui[0].childNodes[parent.nodeIndex],
          parent.offset
        );

        if (node) {
          const range = new Range();
          const selection = window.getSelection();

          range.setStart(node, offset);
          range.collapse(true);

          selection.removeAllRanges();
          selection.addRange(range);

          this.stored = startIndex;
        }
      }
    }
  }

  setEnd() {
    const range = new Range();
    const selection = window.getSelection();

    const node = this.getLastNode(
      this.input.ui[0].childNodes[this.input.ui[0].childNodes.length - 1]
    );

    range.setStart(node, node.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    this.get();
  }

  getNodeIndex(index, nodes = [...this.input.nodes].map((node) => node.value)) {
    let previousLen = 0;
    let len = 0;
    for (let n = 0; n < nodes.length; n++) {
      previousLen = len;
      len += nodes[n].length;
      if (index <= len) {
        return {
          nodeIndex: n,
          offset: index - previousLen,
        };
      }
    }
    return { nodeIndex: 0, offset: 0 };
  }

  getTextNode(node, index = 0) {
    if (!node) return { node: null, offset: index };
    if (node.nodeName === '#text') return { node, offset: index };
    if (node.childNodes.length === 0) return { node: null, offset: index };
    if (node.childNodes.length === 1)
      return this.getTextNode(node.childNodes[0], index);
    if (node.childNodes.length > 1) {
      const { nodeIndex, offset } = this.getNodeIndex(
        index,
        [...node.childNodes].map((n) =>
          n.nodeValue ? n.nodeValue : n.innerText
        )
      );
      return this.getTextNode(node.childNodes[nodeIndex], offset);
    }

    return { node: null, offset: index };
  }

  getParent(node, n = 0) {
    if (n === 5) return null;
    if (node.parentElement.id === this.input.ui[0].id) return node;
    return this.getParent(node.parentElement, n + 1);
  }

  getNextNode(node) {
    if (node.nextSibling) return this.getTextNode(node.nextSibling).node;
    if (node.parentElement.id === this.input.ui[0].id) return null;
    return this.getNextNode(node.parentElement);
  }

  getPreviousNode(node) {
    if (node.previousSibling)
      return this.getTextNode(
        node.previousSibling,
        this.totalLength(node.previousSibling)
      ).node;
    if (node.parentElement.id === this.input.ui[0].id) return null;
    return this.getPreviousNode(node.parentElement);
  }

  getRawIndex(node, offset) {
    if (this.input.ui[0].childNodes.length > 0) {
      let index = offset;
      let next = this.getFirstNode(this.input.ui[0].childNodes[0]);

      while (next) {
        if (next === node) return index;
        index += next.length;
        next = this.getNextNode(next);
      }
    }
    return null;

    // const childNodes = [...this.input.ui[0].childNodes];
    // let index = offset;

    // for (
    //   let i = 0;
    //   i < (nodeIndex >= 0 ? nodeIndex : childNodes.indexOf(node));
    //   i++
    // ) {
    //   const len = this.totalLength(childNodes[i]);
    //   index += len;
    // }
    // return index;
  }

  getLastNode(node) {
    if (!node) return null;
    if (node.childNodes.length === 0) return node;
    return this.getLastNode(node.childNodes[node.childNodes.length - 1]);
  }

  getFirstNode(node) {
    if (!node) return null;
    if (node.childNodes.length === 0) return node;
    return this.getFirstNode(node.childNodes[0]);
  }

  totalLength(node) {
    if (!node) return 0;

    let len = 0;
    for (let i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeName === '#text') {
        len += node.childNodes[i].length;
      }
      if (node.childNodes[i].childNodes.length > 0) {
        len += this.totalLength(node.childNodes[i]);
      }
    }

    return len;
  }

  isAtStart() {
    return this.stored === 0;
  }

  isAtEnd() {
    return this.stored === this.input.value;
  }
}
