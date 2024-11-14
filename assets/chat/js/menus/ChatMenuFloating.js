import $ from 'jquery';
import ChatMenu from './ChatMenu';

export default class ChatMenuFloating extends ChatMenu {
  constructor(ui, btn, chat, draggable = null) {
    super(ui, btn, chat);
    this.ui = ui;
    this.btn = btn;
    this.chat = chat;
    this.draggable = draggable;

    this.mousedown = false;
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;

    this.viewChain = [window];

    if (this.draggable?.length) {
      while (this.viewChain[0] !== window.top) {
        try {
          // Access href to check if we have permissions for parent view
          this.viewChain[0].parent.location.href;
          this.viewChain.splice(0, 0, this.viewChain[0].parent);
        } catch {
          break;
        }
      }
      this.viewChain.reverse();
      
      // Lift the ui up to the top of the chain
      this.ui.css('pointer-events', 'auto');
      this.ui.detach().appendTo(this.getContainer(this.viewChain[this.viewChain.length - 1]));
      
      this.draggable[0].style.cursor = 'grab';
      this.draggable.on('mouseup', (e) => {
        e.preventDefault();
        this.mousedown = false;
      });
      this.draggable.on('mousedown', (e) => {
        e.preventDefault();
        this.mousedown = true;
        this.x1 = e.clientX;
        this.y1 = e.clientY;
      });
      this.chat.output.on('mousemove', (e) => {
        this.drag(e);
      });
      this.ui.on('mousemove', (e) => {
        this.drag(e);
      });
    }
  }

  drag(e) {
    if (this.mousedown) {
      const offset = this.getViewOffset(e.view);
      if (offset === null) return console.log(e.view);

      this.x2 = this.x1 - (e.clientX + offset.x);
      this.y2 = this.y1 - (e.clientY + offset.y);
      this.x1 = (e.clientX + offset.x);
      this.y1 = (e.clientY + offset.y);

      this.draggable[0].style.cursor = 'grabbing';
      this.ui[0].style.left = `${this.ui[0].offsetLeft - this.x2}px`;
      this.ui[0].style.top = `${this.ui[0].offsetTop - this.y2}px`;
    } else {
      this.draggable[0].style.cursor = 'grab';
    }
  }

  position(e) {
    this.mousedown = false;
    const rect = this.chat.output[0].getBoundingClientRect();
    const offset = this.getViewOffset(e.view);
    e.clientX += offset.x;
    e.clientY += offset.y;
    // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
    const x =
      this.ui.width() + e.clientX > rect.width
        ? e.clientX - rect.left + (rect.width - (this.ui.width() + e.clientX))
        : e.clientX - rect.left;
    const y =
      this.ui.height() + e.clientY > rect.height
        ? e.clientY -
          rect.top +
          (rect.height - (this.ui.height() + e.clientY)) -
          12
        : e.clientY - rect.top - 12;

    this.ui[0].style.left = `${x}px`;
    this.ui[0].style.top = `${y}px`;
  }

  getViewOffset(view = window) {
    let x = 0, y = 0;

    // Iterate up the chain until we find the target view (skip iframes deeper than this one)
    let i = 0;
    for (; i < this.viewChain.length && this.viewChain[i] !== view; i++);
    if (i >= this.viewChain.length) return null; // View isn't part of our chain

    // Calculate offsets for the remainder of the chain
    for (; i < this.viewChain.length - 1; i++) {
      const frameRect = this.viewChain[i].frameElement.getBoundingClientRect();
      x += frameRect.left;
      y += frameRect.top;
    }
    return { x, y };
  }

  // Not using JQuery here as it doesn't always play nice with shadowDom
  getContainer(view) {
    let container = view.document.getElementById('#chat-gui__floating-window-container');
    let shadow = container?.shadowRoot;
    if (!shadow) {
      container = document.createElement('div');
      container.id = 'chat-gui__floating-window-container';
      view.document.body.appendChild(container);

      shadow = container.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div style="position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;overflow:hidden;">';
      
      const style = document.createElement('style');
      for (const stylesheet of document.styleSheets) {
        if (stylesheet.href) {
          // Link to external stylesheets
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = stylesheet.href;
          shadow.appendChild(link);
        } else if (stylesheet.cssRules) {
          // Inline or embedded stylesheets
          const style = document.createElement('style');
          for (const rule of stylesheet.cssRules) {
              style.appendChild(document.createTextNode(rule.cssText));
          }
          shadow.appendChild(style);
        }
      }
      // Add emotes and flairs as well (these are loaded after GUI is created, so don't exist yet)
      {
        const emotes = document.createElement('link');
        emotes.rel = 'stylesheet';
        emotes.href = `${this.chat.config.cdn.base}/emotes/emotes.css?_=${this.chat.config.cacheKey}`,
        shadow.appendChild(emotes);
        const flairs = document.createElement('link');
        flairs.rel = 'stylesheet';
        flairs.href = `${this.chat.config.cdn.base}/flairs/flairs.css?_=${this.chat.config.cacheKey}`,
        shadow.appendChild(flairs);
      }
      shadow.appendChild(style);
    }
    return shadow.firstChild;
  }
}
