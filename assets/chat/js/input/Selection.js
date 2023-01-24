export default class ChatInputSelection {
  constructor(input) {
    this.input = input;
    this.text = '';
    this.left = false;
    this.nodes = [];
  }

  remove() {
    const last = this.nodes[this.nodes.length - 1];
    this.input.nodes[last.nodeIndex].value = this.input.nodes[
      last.nodeIndex
    ].value.substring(last.offset);

    this.input.nodes[this.nodes[0].nodeIndex].value = this.input.nodes[
      this.nodes[0].nodeIndex
    ].value.substring(0, this.nodes[0].offset);

    for (let i = 1; i < this.nodes.length - 1; i++)
      this.input.nodes[this.nodes[i]].value = '';
  }

  update() {
    this.nodes = [];
    this.text = window.getSelection().toString();
    if (window.getSelection().toString().length > 0) {
      this.all = this.text === this.input.value;

      const selection = window.getSelection();
      const anchorIndex = this.input.caret.getRawIndex(
        selection.anchorNode.parentElement,
        selection.anchorOffset
      );
      const focusIndex = this.input.caret.getRawIndex(
        selection.focusNode.parentElement,
        selection.focusOffset
      );

      const anchor = this.input.caret.getNodeIndex(
        anchorIndex,
        [...this.input.nodes].map((node) => node.value)
      );
      const focus = this.input.caret.getNodeIndex(
        focusIndex,
        [...this.input.nodes].map((node) => node.value)
      );

      this.setDirection(anchor, focus);

      let middleNodes = [];
      const middle = this.left
        ? anchor.nodeIndex - focus.nodeIndex - 1
        : focus.nodeIndex - anchor.nodeIndex - 1;

      if (middle > 0) {
        const offset = (this.left ? focus.nodeIndex : anchor.nodeIndex) + 1;
        middleNodes = [...Array(middle).keys()].map((v) => v + offset);
        if (this.left) middleNodes.reverse();
      }

      const anchorEmote = this.input.nodes[anchor.nodeIndex].type === 'emote';
      const focusEmote = this.input.nodes[focus.nodeIndex].type === 'emote';
      if (anchorEmote || focusEmote) {
        if (anchorEmote) anchor.offset = 0;
        if (focusEmote)
          focus.offset = this.input.nodes[focus.nodeIndex].value.length;

        // update window selection.
        this.input.caret.setSelectionRange();
      }

      this.nodes = [anchor, ...middleNodes, focus];

      this.nodes.forEach((node) => {
        const index = node?.nodeIndex ? node.nodeIndex : node;
        if (this.input.nodes[index].type === 'emote') {
          this.input.nodes[index].highlight = true;
        }
      });
    } else {
      this.input.nodes
        .filter((node) => node.type === 'emote')
        .forEach((node) => {
          node.highlight = false;
        });
    }
  }

  setDirection(anchor, focus) {
    if (anchor.nodeIndex > focus.nodeIndex) {
      this.left = true;
    } else if (anchor.nodeIndex < focus.nodeIndex) {
      this.left = false;
    } else {
      if (anchor.offset < focus.offset) {
        this.left = false;
      }
      this.left = true;
    }
  }

  // extend(direction, length) {}
}
