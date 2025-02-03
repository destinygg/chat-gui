import { createElement, createIcons, X } from 'lucide';

const icons = {
  X,
};

class IconsController {
  renderIcons() {
    createIcons({ icons });
  }

  getNode(icon) {
    const node = createElement(icon);
    node.classList.add('lucide');
    return node;
  }
}

export { IconsController, icons as Icons };
