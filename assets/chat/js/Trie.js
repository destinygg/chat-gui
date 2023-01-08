import TrieNode from './TrieNode';

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  add(str, data) {
    if (!str) return;
    const normalized = str.toLowerCase();
    if (normalized === '') return;
    let currentNode = this.root;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charAt(i);
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, new TrieNode(char, currentNode));
      }
      currentNode = currentNode.children.get(char);
    }
    currentNode.leaf = true;
    currentNode.data = data;
  }

  remove(str = '') {
    const normalized = str.toLowerCase();
    if (normalized === '') return false;
    const node = this.getNode(normalized);
    if (node) {
      if (node.children.size > 0) {
        node.leaf = false;
        node.data = {};
        return true;
      }
      return this.deleteNode(normalized, node);
    }
    return false;
  }
  
  deleteNode(str, node, index = 0) {
    const parentNode = node.parent;
    parentNode.children.delete(node.char);
    if (index === str.length - 1) return true;
    if (parentNode.children.size === 0) {
      return this.deleteNode(str, parentNode, index + 1);
    }
    return true;
  }

  search(str = '') {
    const normalized = str.toLowerCase();
    if (normalized === '') return null;
    const node = this.getNode(normalized);
    if (node) {
      if (node.leaf) return node.data;
    }
    return null;
  };

  all(str = '') {
    const normalized = str.toLowerCase();
    if (normalized === '') return [];
    const node = this.getNode(normalized);
    if (node) {
      return this.children(node, []);
    }
    return [];
  };

  getNode(str) {
    let currentNode = this.root;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      if (!currentNode.children.has(char)) return null;
      currentNode = currentNode.children.get(char);
    }
    return currentNode;
  }

  children(node, array) {
    if (node.leaf) array.push(node.data);
    if (node.children.size > 0) {
      node.children.forEach((childNode) => {
        const childArray = this.children(childNode, array);
        if (childArray.length > 0) return array.concat(childArray);
        return array;
      });
    }
    return array;
  }
}

export default Trie;