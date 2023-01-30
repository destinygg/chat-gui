export default class ChatInputSelection {
  constructor(input) {
    this.input = input;
    this.text = '';
    this.left = false;
    this.nodes = [];
  }

  removeAll() {
    if (this.text === this.input.value) {
      this.text = '';
      this.nodes = [];
      this.input.val('');
      this.update();
      return true;
    }
    return false;
  }

  remove() {
    if (this.removeAll()) return;

    const start = this.nodes[0];
    const end = this.nodes[this.nodes.length - 1];
    if (start.nodeIndex === end.nodeIndex) {
      this.input.nodes[start.nodeIndex].value =
        this.input.nodes[start.nodeIndex].value.substring(0, start.offset) +
        this.input.nodes[end.nodeIndex].value.substring(end.offset);
    } else {
      this.input.nodes[start.nodeIndex].value = this.input.nodes[
        start.nodeIndex
      ].value.substring(0, start.offset);
      this.input.nodes[end.nodeIndex].value = this.input.nodes[
        end.nodeIndex
      ].value.substring(end.offset);
    }

    // remove middle nodes
    for (let i = 1; i < this.nodes.length - 1; i++)
      this.input.nodes[this.nodes[i]].value = '';

    // remove from input.value
    const startIndex = this.input.caret.getRawIndex(
      this.input.nodes[this.nodes[0].nodeIndex],
      this.nodes[0].offset
    );
    this.input.value =
      this.input.value.substring(0, startIndex) +
      this.input.value.substring(startIndex + this.text.length);

    this.input.render();
    this.update();
  }

  update() {
    this.nodes = [];
    this.text = window.getSelection().toString();
    if (window.getSelection().toString().length > 0) {
      this.all = this.text === this.input.value;

      const selection = window.getSelection();

      const parentAnchor = this.input.caret.getParent(selection.anchorNode);
      const parentFocus = this.input.caret.getParent(selection.focusNode);
      if (!parentAnchor && !parentFocus) {
        this.text = '';
        this.nodes = [];
        return;
      }

      const anchorIndex = this.input.caret.getRawIndex(
        parentAnchor,
        selection.anchorOffset
      );

      const focusIndex = this.input.caret.getRawIndex(
        parentFocus,
        selection.focusOffset
      );

      const anchor = this.input.caret.getNodeIndex(anchorIndex);
      const focus = this.input.caret.getNodeIndex(focusIndex);

      this.setDirection(anchor, focus);

      let middleNodes = [];
      const middle = this.left
        ? anchor.nodeIndex - focus.nodeIndex - 1
        : focus.nodeIndex - anchor.nodeIndex - 1;

      if (middle > 0) {
        const offset = (this.left ? focus.nodeIndex : anchor.nodeIndex) + 1;
        middleNodes = [...Array(middle).keys()].map((v) => v + offset);
      }

      const anchorEmote = this.input.nodes[anchor.nodeIndex].isEmote();
      const focusEmote = this.input.nodes[focus.nodeIndex].isEmote();
      if (anchorEmote || focusEmote) {
        if (anchorEmote) anchor.offset = 0;
        if (focusEmote)
          focus.offset = this.input.nodes[focus.nodeIndex].value.length;

        // update selection
        this.set({
          start: { node: selection.anchorNode, offset: anchor.offset },
          end: { node: selection.focusNode, offset: focus.offset },
        });
      }

      if (
        anchor.nodeIndex > focus.nodeIndex ||
        (anchor.nodeIndex === focus.nodeIndex && anchor.offset > focus.offset)
      ) {
        this.nodes = [focus, ...middleNodes, anchor];
      } else {
        this.nodes = [anchor, ...middleNodes, focus];
      }

      this.nodes.forEach((node) => {
        const index = node.nodeIndex !== undefined ? node.nodeIndex : node;
        if (this.input.nodes[index].isEmote()) {
          this.input.nodes[index].highlight = true;
        }
      });
    } else {
      this.input.nodes
        .filter((node) => node.isEmote())
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

  get() {
    this.update();
    if (this.text.length === 0) return null;
    const selection = window.getSelection();
    return {
      start: {
        node: selection.anchorNode,
        offset: selection.anchorOffset,
      },
      end: {
        node: selection.focusNode,
        offset: selection.focusOffset,
      },
    };
  }

  set(selection) {
    if (selection) {
      const range = new Range();
      range.setStart(selection.start.node, selection.start.offset);
      range.setEnd(selection.end.node, selection.end.offset);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
  }

  // FIX: Selection on the left side not working.
  // Cannot set end to be less than start.

  modify(selection, modify) {
    // console.log('modify', modify);
    // console.log(selection.start, selection.end);

    const parent = this.input.caret.getParent(selection.end.node);
    if (selection.end.offset + modify > selection.end.node.length) {
      if (parent.nextSibling) {
        const offset =
          selection.end.offset + modify - selection.end.node.length;
        selection.end.node = this.input.caret.getTextNode(
          parent.nextSibling
        ).node;
        selection.end.offset = offset;
      }
    } else if (selection.end.offset + modify < 0) {
      if (parent.previousSibling) {
        const offset = 0 - (selection.end.offset + modify);
        selection.end.node = this.input.caret.getTextNode(
          parent.previousSibling
        ).node;
        selection.end.offset = selection.end.node.length - offset;
      }
    } else {
      selection.end.offset += modify;
    }
    // console.log(selection.start, selection.end);
    // console.log('----------------------');
    this.set(selection);
    this.update();
  }

  extend(sel, left, length, caret) {
    let selection = sel;

    if (!selection) {
      const { nodeIndex, offset } = this.input.caret.getNodeIndex(caret);
      const caretTextNode = this.input.caret.getTextNode(
        this.input.ui[0].childNodes[nodeIndex]
      ).node;

      selection = {
        start: { node: caretTextNode, offset },
        end: { node: caretTextNode, offset },
      };
    }

    this.modify(selection, left ? -length : length);
  }

  copy() {
    navigator.clipboard.writeText(this.text);
  }

  hasSelection() {
    return this.text.length > 0;
  }
}
