class Caret {
  constructor(ui) {
    this.ui = ui;
    this.stored = 0;
  }

  get() {
    let caretOffset = 0;

    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = window.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.ui[0]);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }
    } else if (document.selection && document.selection.type !== 'Control') {
      const textRange = document.selection.createRange();
      const preCaretTextRange = document.body.createTextRange();
      preCaretTextRange.moveToElementText(this.ui[0]);
      preCaretTextRange.setEndPoint('EndToEnd', textRange);
      caretOffset = preCaretTextRange.text.length;
    }

    this.stored = caretOffset;
    return caretOffset;
  }

  set(startIndex = -1, nodes = []) {
    if (this.ui[0].childNodes.length > 0) {
      const range = document.createRange();
      const sel = window.getSelection();

      if (startIndex === -1) {
        const lastNode =
          this.ui[0].childNodes[this.ui[0].childNodes.length - 1];
        const node = this.getTextNode(lastNode);
        range.setStart(node, node.length);
      } else {
        const { nodeIndex, offset } = this.getNodeIndex(startIndex, nodes);
        const node = this.getTextNode(this.ui[0].childNodes[nodeIndex]);
        range.setStart(node, offset);
      }
      range.collapse(true);

      sel.removeAllRanges();
      sel.addRange(range);

      if (startIndex === -1) {
        this.get();
      } else {
        this.stored = startIndex;
      }
    }
  }

  getNodeIndex(index, nodes) {
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

  getTextNode(node) {
    if (node.nodeName === '#text') return node;
    if (node.childNodes.length > 0) return this.getTextNode(node.childNodes[0]);
    return null;
  }
}

export default Caret;
