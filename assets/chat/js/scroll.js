import $ from 'jquery';
// eslint-disable-next-line import/no-unresolved
import 'overlayscrollbars/overlayscrollbars.css';
import { OverlayScrollbars } from 'overlayscrollbars';

const isTouchDevice =
  'ontouchstart' in window || // works on most browsers
  navigator.maxTouchPoints; // works on IE10/11 and Surface

class ChatScrollPlugin {
  constructor(viewport, target = undefined) {
    this.viewportEl = $(viewport).get(0);
    if (!this.viewportEl) return;

    this.previousPosition = 0;

    const targetEl = target !== undefined ? $(target) : $(viewport);

    this.scroller = OverlayScrollbars(
      {
        target: targetEl.get(0),
        elements: {
          viewport: this.viewportEl,
        },
      },
      {
        overflow: {
          x: 'hidden',
          y: 'scroll',
        },
        scrollbars: {
          theme: 'dgg-scroller-theme',
          autoHide: isTouchDevice ? 'never' : 'move',
          autoHideDelay: 1000,
        },
      }
    );
    this.viewport = this.scroller.elements().viewport;
    if (targetEl.find('.chat-scroll-notify').length > 0) {
      this.scroller.on('scroll', () => {
        const direction = this.getScrollDirection();
        this.previousPosition = this.viewportEl.scrollTop;
        if (direction !== 'same') {
          targetEl.toggleClass('chat-unpinned', !this.isPinned());
        }
      });
      targetEl.on('click', '.chat-scroll-notify', () => {
        this.updateAndPin(true);
        return false;
      });
    }
  }

  getScrollDirection() {
    if (this.viewportEl.scrollTop > this.previousPosition) {
      return 'down';
    }
    if (this.viewportEl.scrollTop < this.previousPosition) {
      return 'up';
    }
    return 'same';
  }

  isPinned() {
    // 30 is used to allow the scrollbar to be just offset, but still count as scrolled to bottom
    const { scrollTop, scrollHeight, clientHeight } = this.viewport;
    return scrollTop >= scrollHeight - clientHeight - 30;
  }

  updateAndPin(pin) {
    if (pin) this.scrollBottom();
  }

  scrollBottom() {
    this.viewport.scrollTo(0, this.viewport.scrollHeight);
  }

  reset() {
    this.scroller.update();
  }

  destroy() {
    this.scroller.destroy();
  }
}

export default ChatScrollPlugin;
