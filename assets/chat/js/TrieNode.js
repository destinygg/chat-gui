class TrieNode {
  constructor(char, parent) {
    this.data = {};
    this.leaf = false;
    this.char = char;
    this.parent = parent;
    this.children = new Map();
  }
}

export default TrieNode;
